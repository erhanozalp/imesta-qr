// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod serial;
mod keyboard;

use commands::*;
use windows::Win32::Foundation::{GetLastError, ERROR_ALREADY_EXISTS};
use windows::Win32::System::Threading::CreateMutexW;
use windows::Win32::UI::WindowsAndMessaging::{FindWindowW, SetForegroundWindow, ShowWindow, SW_RESTORE};
use windows::core::PCWSTR;

#[cfg(windows)]
fn to_wide(s: &str) -> Vec<u16> {
    use std::os::windows::prelude::OsStrExt;
    std::ffi::OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
}

#[cfg(windows)]
fn is_another_instance_running() -> bool {
    // Global mutex: tüm kullanıcı oturumları arasında tek instance kalsın.
    // Name, uygulama kimliği gibi düşünülebilir.
    let mutex_name = r"Global\imesta-qr-single-instance";
    let mutex_wide = to_wide(mutex_name);

    let mutex_handle = unsafe { CreateMutexW(None, false, PCWSTR(mutex_wide.as_ptr())) };
    let mutex_handle = match mutex_handle {
        Ok(h) => h,
        Err(_) => return false,
    };
    if mutex_handle.is_invalid() {
        // Mutex oluşmazsa tek-instance garanti edemeyiz; ama mevcut davranışı bozmayalım.
        return false;
    }

    let last_error = unsafe { GetLastError() };
    let already_exists = last_error == ERROR_ALREADY_EXISTS;

    if !already_exists {
        // İlk instance ise mutex handle'ın yaşam döngüsünü process'e bağlarız.
        // Burada ReleaseMutex yapmayacağız; process kapanınca sistem otomatik bırakır.
        let _ = mutex_handle;
    }

    already_exists
}

#[cfg(windows)]
fn focus_existing_window() {
    let title = "Imesta QR Scanner";
    let title_wide = to_wide(title);
    let hwnd = unsafe { FindWindowW(None, PCWSTR(title_wide.as_ptr())) };
    if let Ok(hwnd) = hwnd {
        unsafe {
            let _ = ShowWindow(hwnd, SW_RESTORE);
            let _ = SetForegroundWindow(hwnd);
        }
    }
}

fn main() {
    // Windows'ta tek instance kontrolü.
    // Kullanıcı X'e basınca app kapanacağı için mutex de serbest kalır; tekrar açılırsa bu kontrol devreye girer.
    if cfg!(windows) && is_another_instance_running() {
        focus_existing_window();
        return;
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_ports,
            scan_for_port,
            connect_port,
            disconnect_port,
            get_port_status,
            read_qr_code,
            start_keyboard_hook,
            stop_keyboard_hook,
            is_keyboard_hook_active,
            restore_and_focus_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



