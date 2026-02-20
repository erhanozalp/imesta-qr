use tauri::{AppHandle, Manager};
use tray_icon::{
    menu::{Menu, MenuItem},
    TrayIcon, TrayIconBuilder,
};

pub fn create_tray(app: &AppHandle) -> Result<TrayIcon, Box<dyn std::error::Error>> {
    // Icon yükle
    let icon = load_icon()?;
    
    // Menu oluştur
    let mut menu = Menu::new();
    
    // App handle'ı clone'la (menu item callback'leri için)
    let app_handle_show = app.clone();
    let app_handle_hide = app.clone();
    let app_handle_always_on_top = app.clone();
    let app_handle_quit = app.clone();
    
    // Menu item'ları oluştur ve callback ekle
    let show_item = MenuItem::new("Göster", true, Some(Box::new(move || {
        if let Some(window) = app_handle_show.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
    })));
    
    let hide_item = MenuItem::new("Gizle", true, Some(Box::new(move || {
        if let Some(window) = app_handle_hide.get_webview_window("main") {
            let _ = window.hide();
        }
    })));
    
    let separator1 = MenuItem::new("", false, None);
    
    let always_on_top_item = MenuItem::new("Her Zaman Üstte", true, Some(Box::new(move || {
        if let Some(window) = app_handle_always_on_top.get_webview_window("main") {
            let is_always_on_top = window.is_always_on_top().unwrap_or(false);
            let _ = window.set_always_on_top(!is_always_on_top);
        }
    })));
    
    let separator2 = MenuItem::new("", false, None);
    
    let quit_item = MenuItem::new("Çıkış", true, Some(Box::new(move || {
        app_handle_quit.exit(0);
    })));
    
    menu.append(&show_item)?;
    menu.append(&hide_item)?;
    menu.append(&separator1)?;
    menu.append(&always_on_top_item)?;
    menu.append(&separator2)?;
    menu.append(&quit_item)?;
    
    // Tray icon oluştur
    let tray_icon = TrayIconBuilder::new()
        .with_menu(Box::new(menu))
        .with_icon(icon)
        .with_tooltip("Imesta QR Scanner")
        .build()?;
    
    Ok(tray_icon)
}

fn load_icon() -> Result<tray_icon::Icon, Box<dyn std::error::Error>> {
    // Tauri'nin icon dosyasını yükle
    let icon_path = std::path::Path::new("src-tauri/icons/icon.ico");
    
    if icon_path.exists() {
        // Şimdilik basit bir icon oluştur (ICO parser eklenebilir)
        let rgba = vec![100u8; 32 * 32 * 4]; // Gri icon
        let icon = tray_icon::Icon::from_rgba(rgba, 32, 32)?;
        Ok(icon)
    } else {
        // Fallback: basit bir icon oluştur
        let rgba = vec![100u8; 32 * 32 * 4];
        let icon = tray_icon::Icon::from_rgba(rgba, 32, 32)?;
        Ok(icon)
    }
}
