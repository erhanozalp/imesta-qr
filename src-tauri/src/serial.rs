use serialport::{SerialPortType, SerialPortInfo};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use tokio::task;

/// Varsayılan baud (geriye uyumlu). Ayarlardan 115200'e kadar yükseltilebilir.
pub const DEFAULT_BAUD: u32 = 9600;
/// Satır sonu göndermeyen okuyucular için: son byte'tan bu kadar süre sessizlik
/// geçerse buffer'daki veri tamamlanmış token sayılır. 9600 baud'da JWT chunk'ları
/// arası boşluk <10ms olduğundan 200ms sessizlik = iletim bitti demektir.
const FLUSH_SILENCE_MS: u64 = 200;

pub struct SerialManager {
    port: Arc<Mutex<Option<Box<dyn serialport::SerialPort + Send>>>>,
    port_name: Arc<Mutex<String>>,
    listener_tx: Arc<Mutex<Option<mpsc::UnboundedSender<String>>>>,
    read_buffer: Arc<Mutex<String>>, // QR kod parçalarını biriktirmek için
    last_rx_at: Arc<Mutex<Option<Instant>>>, // Son byte'ın geldiği an (sessizlik eşiği için)
}

impl SerialManager {
    pub fn new() -> Self {
        Self {
            port: Arc::new(Mutex::new(None)),
            port_name: Arc::new(Mutex::new(String::new())),
            listener_tx: Arc::new(Mutex::new(None)),
            read_buffer: Arc::new(Mutex::new(String::new())),
            last_rx_at: Arc::new(Mutex::new(None)),
        }
    }

    /// Tüm mevcut COM portlarını listeler
    pub fn list_ports() -> Vec<SerialPortInfo> {
        match serialport::available_ports() {
            Ok(ports) => ports,
            Err(e) => {
                eprintln!("Port listesi alınamadı: {}", e);
                vec![]
            }
        }
    }

    /// Belirli bir porta bağlanır
    pub fn connect(&self, port_name: &str, baud: u32) -> Result<(), String> {
        // Önce mevcut bağlantıyı kapat
        self.disconnect();

        let builder = serialport::new(port_name, baud)
            .timeout(Duration::from_millis(100))
            .data_bits(serialport::DataBits::Eight)
            .flow_control(serialport::FlowControl::None)
            .parity(serialport::Parity::None)
            .stop_bits(serialport::StopBits::One);

        match builder.open() {
            Ok(port) => {
                *self.port.lock().unwrap() = Some(port);
                *self.port_name.lock().unwrap() = port_name.to_string();
                Ok(())
            }
            Err(e) => Err(format!("Port açılamadı: {}", e))
        }
    }

    /// Port bağlantısını kapatır
    pub fn disconnect(&self) {
        *self.port.lock().unwrap() = None;
        *self.port_name.lock().unwrap() = String::new();
        *self.listener_tx.lock().unwrap() = None;
        *self.read_buffer.lock().unwrap() = String::new(); // Buffer'ı temizle
        *self.last_rx_at.lock().unwrap() = None;
    }

    /// Port durumunu kontrol eder
    pub fn is_connected(&self) -> bool {
        self.port.lock().unwrap().is_some()
    }

    /// Seçili port adını döndürür
    pub fn get_port_name(&self) -> String {
        self.port_name.lock().unwrap().clone()
    }

    /// Porttan veri okur (blocking) - Token'ı tamamlanana kadar biriktirir
    pub fn read_data(&self) -> Result<Option<String>, String> {
        let mut port_guard = self.port.lock().unwrap();
        
        if let Some(ref mut port) = *port_guard {
            let mut buffer = vec![0u8; 1024];
            
            match port.read(buffer.as_mut_slice()) {
                Ok(bytes_read) => {
                    if bytes_read > 0 {
                        // Ham veriyi al
                        let raw_data = String::from_utf8_lossy(&buffer[..bytes_read]);

                        // Sessizlik eşiği için son veri zamanını güncelle
                        *self.last_rx_at.lock().unwrap() = Some(Instant::now());

                        // Buffer'a ekle
                        let mut read_buffer = self.read_buffer.lock().unwrap();
                        read_buffer.push_str(&raw_data);
                        
                        // Yeni satır karakteri var mı kontrol et (\r\n veya \n)
                        if read_buffer.contains('\n') {
                            // Token tamamlandı, satırı ayır
                            let lines: Vec<&str> = read_buffer.split('\n').collect();
                            let complete_token = lines[0].trim().to_string();
                            
                            // Kalan veriyi buffer'da tut (eğer birden fazla satır varsa)
                            if lines.len() > 1 {
                                *read_buffer = lines[1..].join("\n");
                            } else {
                                read_buffer.clear();
                            }
                            
                            if !complete_token.is_empty() {
                                return Ok(Some(complete_token));
                            }
                        } else if read_buffer.contains('\r') {
                            // Sadece \r var, satırı ayır
                            let lines: Vec<&str> = read_buffer.split('\r').collect();
                            let complete_token = lines[0].trim().to_string();
                            
                            if lines.len() > 1 {
                                *read_buffer = lines[1..].join("\r");
                            } else {
                                read_buffer.clear();
                            }
                            
                            if !complete_token.is_empty() {
                                return Ok(Some(complete_token));
                            }
                        }
                        
                        // Token henüz tamamlanmadı, buffer'da beklet
                        Ok(None)
                    } else {
                        Ok(None)
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                    // Timeout: yeni veri gelmedi. Buffer'da bekleyen veri varsa ve okuyucu
                    // göndermeyi BİTİRDİYSE (son byte'tan beri FLUSH_SILENCE_MS sessizlik)
                    // token'ı tamamlanmış say ve gönder (satır sonu göndermeyen okuyucular için).
                    //
                    // NOT: Önceki kod burada iki hataya sahipti ve "okut-bekle-yeniden okut"
                    // şikayetinin kök nedeniydi:
                    //  1) Aynı mutex'i guard canlıyken ikinci kez kilitleyip SELF-DEADLOCK
                    //     yaratıyordu (tüm seri okuma, uygulama yeniden başlatılana dek donuyordu).
                    //  2) "buffer > 10 karakter" koşuluyla JWT daha tamamlanmadan yarım
                    //     gönderiyordu ("Geçersiz QR kod" hatalarının kaynağı).
                    let silence_elapsed = {
                        let last_rx = self.last_rx_at.lock().unwrap();
                        match *last_rx {
                            Some(t) => t.elapsed() >= Duration::from_millis(FLUSH_SILENCE_MS),
                            None => false,
                        }
                    };

                    if silence_elapsed {
                        let token = {
                            let mut read_buffer = self.read_buffer.lock().unwrap();
                            let t = read_buffer.trim().to_string();
                            read_buffer.clear();
                            t
                        };
                        *self.last_rx_at.lock().unwrap() = None;

                        if !token.is_empty() {
                            return Ok(Some(token));
                        }
                    }
                    Ok(None)
                }
                Err(e) => Err(format!("Okuma hatası: {}", e))
            }
        } else {
            Err("Port bağlı değil".to_string())
        }
    }

    /// Async olarak port dinlemeyi başlatır
    pub fn start_listening(&self, callback: mpsc::UnboundedSender<String>) {
        *self.listener_tx.lock().unwrap() = Some(callback.clone());
        
        let port = Arc::clone(&self.port);
        let listener_tx = Arc::clone(&self.listener_tx);
        
        // Spawn blocking task for serial port reading
        task::spawn_blocking(move || {
            let mut buffer = vec![0u8; 1024];
            let mut line_buffer = String::new();
            
            loop {
                // Port bağlı mı kontrol et
                let port_guard = port.lock().unwrap();
                if port_guard.is_none() {
                    drop(port_guard);
                    std::thread::sleep(Duration::from_millis(100));
                    continue;
                }
                
                // Porttan okuma yap
                let read_result = {
                    let mut port_guard = port.lock().unwrap();
                    if let Some(ref mut p) = *port_guard {
                        match p.read(buffer.as_mut_slice()) {
                            Ok(bytes_read) if bytes_read > 0 => {
                                Ok(Some(String::from_utf8_lossy(&buffer[..bytes_read]).to_string()))
                            }
                            Ok(_) => Ok(None),
                            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => Ok(None),
                            Err(e) => Err(format!("Okuma hatası: {}", e))
                        }
                    } else {
                        Ok(None)
                    }
                };
                
                match read_result {
                    Ok(Some(data)) => {
                        line_buffer.push_str(&data);
                        
                        // Yeni satır karakteri varsa, satırı işle
                        while let Some(newline_pos) = line_buffer.find('\n') {
                            let line = line_buffer[..newline_pos].trim().to_string();
                            line_buffer = line_buffer[newline_pos + 1..].to_string();
                            
                            if !line.is_empty() {
                                // Callback'e gönder
                                let tx_guard = listener_tx.lock().unwrap();
                                if let Some(ref tx) = *tx_guard {
                                    let _ = tx.send(line.clone());
                                }
                            }
                        }
                        
                        // Carriage return kontrolü
                        if let Some(cr_pos) = line_buffer.find('\r') {
                            let line = line_buffer[..cr_pos].trim().to_string();
                            line_buffer = line_buffer[cr_pos + 1..].to_string();
                            
                            if !line.is_empty() {
                                let tx_guard = listener_tx.lock().unwrap();
                                if let Some(ref tx) = *tx_guard {
                                    let _ = tx.send(line.clone());
                                }
                            }
                        }
                    }
                    Ok(None) => {
                        // Timeout, devam et
                    }
                    Err(e) => {
                        eprintln!("Serial port okuma hatası: {}", e);
                        std::thread::sleep(Duration::from_millis(100));
                    }
                }
                
                std::thread::sleep(Duration::from_millis(10));
            }
        });
    }

    /// Port taraması yapar ve uygun portu bulmaya çalışır
    pub fn scan_for_port(&self, baud: u32) -> Result<String, String> {
        let ports = Self::list_ports();

        if ports.is_empty() {
            return Err("Hiç port bulunamadı".to_string());
        }

        // Windows'ta COM portlarını önceliklendir
        for port_info in &ports {
            if let SerialPortType::UsbPort(_) = &port_info.port_type {
                // USB port bulundu, bağlanmayı dene
                match self.connect(&port_info.port_name, baud) {
                    Ok(_) => return Ok(port_info.port_name.clone()),
                    Err(_) => continue,
                }
            }
        }

        // USB port bulunamazsa, ilk COM portunu dene
        for port_info in &ports {
            if port_info.port_name.starts_with("COM") {
                match self.connect(&port_info.port_name, baud) {
                    Ok(_) => return Ok(port_info.port_name.clone()),
                    Err(_) => continue,
                }
            }
        }

        // Hiçbiri çalışmazsa ilk portu dene
        if let Some(first_port) = ports.first() {
            match self.connect(&first_port.port_name, baud) {
                Ok(_) => Ok(first_port.port_name.clone()),
                Err(e) => Err(e),
            }
        } else {
            Err("Uygun port bulunamadı".to_string())
        }
    }
}

impl Default for SerialManager {
    fn default() -> Self {
        Self::new()
    }
}


