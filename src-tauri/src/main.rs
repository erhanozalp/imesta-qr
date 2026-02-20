// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod serial;
mod keyboard;

use commands::*;
use tauri::Manager;

fn main() {
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
        ])
        .setup(|app| {
            // Close event handler - minimize on close
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // Pencereyi gizle (uygulama tray olmadan arka planda açık kalır)
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.hide();
                        }
                        api.prevent_close();
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



