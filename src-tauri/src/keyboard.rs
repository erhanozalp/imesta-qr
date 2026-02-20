use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

pub struct KeyboardHook {
    is_listening: Arc<Mutex<bool>>,
    qr_buffer: Arc<Mutex<String>>,
    callback_tx: Arc<Mutex<Option<mpsc::UnboundedSender<String>>>>,
}

impl KeyboardHook {
    pub fn new() -> Self {
        Self {
            is_listening: Arc::new(Mutex::new(false)),
            qr_buffer: Arc::new(Mutex::new(String::new())),
            callback_tx: Arc::new(Mutex::new(None)),
        }
    }

    /// Keyboard hook'u başlatır (şimdilik noop; ileride rdev entegrasyonu eklenecek)
    pub fn start_listening(&self, callback: mpsc::UnboundedSender<String>) {
        // Sadece state ve callback referansını saklıyoruz
        *self.is_listening.lock().unwrap() = true;
        *self.callback_tx.lock().unwrap() = Some(callback);
        // TODO: rdev::listen ile global keyboard hook'u yeniden bağla
    }

    /// Keyboard hook'u durdurur
    pub fn stop_listening(&self) {
        *self.is_listening.lock().unwrap() = false;
        *self.callback_tx.lock().unwrap() = None;
        self.qr_buffer.lock().unwrap().clear();
    }

    /// Dinleme durumunu kontrol eder
    pub fn is_listening(&self) -> bool {
        *self.is_listening.lock().unwrap()
    }
}

impl Default for KeyboardHook {
    fn default() -> Self {
        Self::new()
    }
}

