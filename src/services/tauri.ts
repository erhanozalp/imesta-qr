import { invoke } from '@tauri-apps/api/core';

export interface PortInfo {
  name: string;
  description: string;
}

export interface ScanResult {
  success: boolean;
  port?: string;
  error?: string;
}

export interface SerialPortStatus {
  status: 'listening' | 'closed' | 'error' | 'connecting';
  message: string;
  port: string;
}

/**
 * Tauri IPC command'larını çağıran service
 */
export const tauriService = {
  /**
   * Tüm mevcut COM portlarını listeler
   */
  async listPorts(): Promise<PortInfo[]> {
    try {
      return await invoke<PortInfo[]>('list_ports');
    } catch (error: any) {
      console.error('Port listesi alınamadı:', error);
      return [];
    }
  },

  /**
   * Port taraması yapar ve otomatik bağlanır.
   * baud verilmezse Rust tarafı varsayılanı (9600) kullanır.
   */
  async scanForPort(baud?: number): Promise<ScanResult> {
    try {
      return await invoke<ScanResult>('scan_for_port', { baud: baud ?? null });
    } catch (error: any) {
      console.error('Port taraması başarısız:', error);
      return {
        success: false,
        error: error.message || 'Port taraması başarısız',
      };
    }
  },

  /**
   * Belirli bir porta bağlanır
   */
  async connectPort(portName: string, baud?: number): Promise<void> {
    try {
      // Hem snake_case hem camelCase gönderilir: Tauri v2 varsayılanı camelCase bekler,
      // fazladan anahtar yok sayılır — iki sürümle de uyumlu.
      await invoke('connect_port', { port_name: portName, portName, baud: baud ?? null });
    } catch (error: any) {
      console.error('Port bağlantısı başarısız:', error);
      throw new Error(error.message || 'Port bağlantısı başarısız');
    }
  },

  /**
   * Port bağlantısını kapatır
   */
  async disconnectPort(): Promise<void> {
    try {
      await invoke('disconnect_port');
    } catch (error: any) {
      console.error('Port kapatma başarısız:', error);
      throw new Error(error.message || 'Port kapatma başarısız');
    }
  },

  /**
   * Port durumunu döndürür
   */
  async getPortStatus(): Promise<SerialPortStatus> {
    try {
      return await invoke<SerialPortStatus>('get_port_status');
    } catch (error: any) {
      console.error('Port durumu alınamadı:', error);
      return {
        status: 'error',
        message: 'Port durumu alınamadı',
        port: '—',
      };
    }
  },

  /**
   * Porttan QR kod okur (tek seferlik)
   */
  async readQRCode(): Promise<string | null> {
    try {
      const result = await invoke<string | null>('read_qr_code');
      return result;
    } catch (error: any) {
      console.error('QR kod okuma başarısız:', error);
      return null;
    }
  },

  /**
   * Keyboard hook'u başlatır (QR kodları klavye inputu olarak yakalar)
   */
  async startKeyboardHook(): Promise<void> {
    try {
      await invoke('start_keyboard_hook');
    } catch (error: any) {
      console.error('Keyboard hook başlatma başarısız:', error);
      throw new Error(error.message || 'Keyboard hook başlatma başarısız');
    }
  },

  /**
   * Keyboard hook'u durdurur
   */
  async stopKeyboardHook(): Promise<void> {
    try {
      await invoke('stop_keyboard_hook');
    } catch (error: any) {
      console.error('Keyboard hook durdurma başarısız:', error);
      throw new Error(error.message || 'Keyboard hook durdurma başarısız');
    }
  },

  /**
   * Keyboard hook durumunu kontrol eder
   */
  async isKeyboardHookActive(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_keyboard_hook_active');
    } catch (error: any) {
      console.error('Keyboard hook durumu alınamadı:', error);
      return false;
    }
  },

  /**
   * Pencereyi gösterir ve odaklar (minimize/gizli durumundan geri getirir)
   * Kasiyerler için: QR okutulduğunda pencereyi ekrana getirir
   * Rust tarafındaki restore_and_focus_window command'ını kullanır
   */
  async showWindow(): Promise<void> {
    try {
      // Rust tarafındaki command'ı kullan (Windows'ta minimize durumunu düzgün handle eder)
      await invoke('restore_and_focus_window');
    } catch (error: any) {
      console.error('Pencere gösterme hatası:', error);
      // Fallback: Frontend API'yi dene
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        await appWindow.show();
        await appWindow.setFocus();
      } catch (fallbackError: any) {
        throw new Error(error.message || 'Pencere gösterme başarısız');
      }
    }
  },

  /**
   * Pencereyi gizler
   */
  async hideWindow(): Promise<void> {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (error: any) {
      console.error('Pencere gizleme hatası:', error);
      throw new Error(error.message || 'Pencere gizleme başarısız');
    }
  },

  /**
   * Pencereyi minimize eder
   */
  async minimizeWindow(): Promise<void> {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error: any) {
      console.error('Pencere minimize hatası:', error);
      throw new Error(error.message || 'Pencere minimize başarısız');
    }
  },

  /**
   * Always on top ayarını değiştirir
   */
  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.setAlwaysOnTop(alwaysOnTop);
    } catch (error: any) {
      console.error('Always on top ayarı hatası:', error);
      throw new Error(error.message || 'Always on top ayarı başarısız');
    }
  },
};

