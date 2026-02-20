import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const selectedPort = ref<string>('');
  const autoScanEnabled = ref(true);
  const minimizeOnClose = ref(true);
  const startMinimized = ref(false);

  // LocalStorage'dan ayarları yükle
  function loadSettings() {
    try {
      const saved = localStorage.getItem('imesta-qr-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        selectedPort.value = settings.selectedPort || '';
        autoScanEnabled.value = settings.autoScanEnabled ?? true;
        minimizeOnClose.value = settings.minimizeOnClose ?? true;
        startMinimized.value = settings.startMinimized ?? false;
      }
    } catch (e) {
      console.warn('Ayarlar yüklenemedi:', e);
    }
  }

  // Ayarları kaydet
  function saveSettings() {
    try {
      const settings = {
        selectedPort: selectedPort.value,
        autoScanEnabled: autoScanEnabled.value,
        minimizeOnClose: minimizeOnClose.value,
        startMinimized: startMinimized.value,
      };
      localStorage.setItem('imesta-qr-settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Ayarlar kaydedilemedi:', e);
    }
  }

  function setPort(port: string) {
    selectedPort.value = port;
    saveSettings();
  }

  function setAutoScan(enabled: boolean) {
    autoScanEnabled.value = enabled;
    saveSettings();
  }

  function setMinimizeOnClose(enabled: boolean) {
    minimizeOnClose.value = enabled;
    saveSettings();
  }

  function setStartMinimized(enabled: boolean) {
    startMinimized.value = enabled;
    saveSettings();
  }

  // İlk yüklemede ayarları oku
  loadSettings();

  return {
    // state
    selectedPort,
    autoScanEnabled,
    minimizeOnClose,
    startMinimized,
    // actions
    setPort,
    setAutoScan,
    setMinimizeOnClose,
    setStartMinimized,
    loadSettings,
    saveSettings,
  };
});


