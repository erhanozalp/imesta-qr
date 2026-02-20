use crate::keyboard::KeyboardHook;
use crate::serial::SerialManager;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::{mpsc, Mutex};

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub success: bool,
    pub port: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SerialPortStatus {
    pub status: String, // "listening" | "closed" | "error" | "connecting"
    pub message: String,
    pub port: String,
}

// Global serial manager instance
lazy_static::lazy_static! {
    static ref SERIAL_MANAGER: Arc<Mutex<SerialManager>> = Arc::new(Mutex::new(SerialManager::new()));
    static ref KEYBOARD_HOOK: Arc<Mutex<KeyboardHook>> = Arc::new(Mutex::new(KeyboardHook::new()));
    static ref QR_CALLBACK_TX: Arc<Mutex<Option<mpsc::UnboundedSender<String>>>> = Arc::new(Mutex::new(None));
}

/// Tüm mevcut COM portlarını listeler
#[tauri::command]
pub async fn list_ports() -> Result<Vec<PortInfo>, String> {
    let ports = SerialManager::list_ports();
    
    Ok(ports
        .into_iter()
        .map(|p| PortInfo {
            name: p.port_name.clone(),
            description: format!("{:?}", p.port_type),
        })
        .collect())
}

/// Port taraması yapar ve otomatik bağlanır
#[tauri::command]
pub async fn scan_for_port() -> Result<ScanResult, String> {
    let manager = SERIAL_MANAGER.lock().await;
    
    match manager.scan_for_port() {
        Ok(port_name) => Ok(ScanResult {
            success: true,
            port: Some(port_name),
            error: None,
        }),
        Err(e) => Ok(ScanResult {
            success: false,
            port: None,
            error: Some(e),
        }),
    }
}

/// Belirli bir porta bağlanır
#[tauri::command]
pub async fn connect_port(port_name: String) -> Result<(), String> {
    let manager = SERIAL_MANAGER.lock().await;
    manager.connect(&port_name)
}

/// Port bağlantısını kapatır
#[tauri::command]
pub async fn disconnect_port() -> Result<(), String> {
    let manager = SERIAL_MANAGER.lock().await;
    manager.disconnect();
    Ok(())
}

/// Port durumunu döndürür
#[tauri::command]
pub async fn get_port_status() -> Result<SerialPortStatus, String> {
    let manager = SERIAL_MANAGER.lock().await;
    
    if manager.is_connected() {
        let port_name = manager.get_port_name();
        Ok(SerialPortStatus {
            status: "listening".to_string(),
            message: "Port dinleniyor".to_string(),
            port: port_name,
        })
    } else {
        Ok(SerialPortStatus {
            status: "closed".to_string(),
            message: "Bağlantı bekleniyor...".to_string(),
            port: "—".to_string(),
        })
    }
}

/// Porttan veri okur (tek seferlik)
#[tauri::command]
pub async fn read_qr_code() -> Result<Option<String>, String> {
    let manager = SERIAL_MANAGER.lock().await;
    manager.read_data()
}

/// Keyboard hook'u başlatır (QR kodları klavye inputu olarak yakalar)
#[tauri::command]
pub async fn start_keyboard_hook(app: tauri::AppHandle) -> Result<(), String> {
    let hook = KEYBOARD_HOOK.lock().await;
    
    if hook.is_listening() {
        return Ok(()); // Zaten dinleniyor
    }

    // QR kod callback channel'ı oluştur
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();
    *QR_CALLBACK_TX.lock().await = Some(tx.clone());

    // Hook'u başlat
    hook.start_listening(tx);

    // QR kodları yakalayıp Tauri event olarak gönder
    tokio::spawn(async move {
        while let Some(qr_code) = rx.recv().await {
            // QR kod yakalandı, frontend'e event gönder
            let _ = app.emit("qr-scanned", qr_code);
        }
    });

    Ok(())
}

/// Keyboard hook'u durdurur
#[tauri::command]
pub async fn stop_keyboard_hook() -> Result<(), String> {
    let hook = KEYBOARD_HOOK.lock().await;
    hook.stop_listening();
    *QR_CALLBACK_TX.lock().await = None;
    Ok(())
}

/// Keyboard hook durumunu kontrol eder
#[tauri::command]
pub async fn is_keyboard_hook_active() -> Result<bool, String> {
    let hook = KEYBOARD_HOOK.lock().await;
    Ok(hook.is_listening())
}

/// Pencereyi restore eder ve öne getirir (sadece minimize durumundaysa restore eder)
/// Kasiyerler için: QR okutulduğunda pencereyi ekrana getirir
#[tauri::command]
pub async fn restore_and_focus_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            // Windows API kullanarak pencere durumunu kontrol et
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{IsIconic, ShowWindow, SW_RESTORE, SW_SHOW};
            
            if let Ok(hwnd) = window.hwnd() {
                let hwnd = HWND(hwnd.0);
                unsafe {
                    // Sadece minimize durumundaysa restore et
                    if IsIconic(hwnd).as_bool() {
                        // Minimize durumunda: Restore et
                        ShowWindow(hwnd, SW_RESTORE);
                        ShowWindow(hwnd, SW_SHOW);
                    } else {
                        // Normal durumda: Sadece göster (gizli ise) ve öne getir
                        ShowWindow(hwnd, SW_SHOW);
                    }
                }
            }
        }
        
        // Pencereyi göster (gizli ise)
        window.show().map_err(|e| format!("Pencere gösterilemedi: {}", e))?;
        
        // Pencereye odak ver (en öne getir)
        window.set_focus().map_err(|e| format!("Pencere odaklanamadı: {}", e))?;
        
        // Geçici olarak always on top yap (kesinlikle öne getirmek için)
        let _ = window.set_always_on_top(true);
        
        // 500ms sonra always on top'u kaldır
        let window_clone = window.clone();
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            let _ = window_clone.set_always_on_top(false);
        });
        
        Ok(())
    } else {
        Err("Pencere bulunamadı".to_string())
    }
}

