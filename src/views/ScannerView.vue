<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-50 tracking-tight">
          QR Scanner Aktif
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">
          QR okutulduğunda müşteri bilgileri ve işlemler burada görünecek.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="showSettings = true"
      >
        ⚙️
      </Button>
    </div>

    <!-- Serial Port Durumu -->
    <div class="flex justify-center">
      <StatusIndicator
        :status="serialPortStatus.status as 'listening' | 'closed' | 'error' | 'connecting'"
        :port="serialPortStatus.port"
        :label="serialPortStatus.message"
      />
    </div>

    <!-- Hızlı Kod (D4) — QR okunmazsa 6 haneli kodla müşteri getir -->
    <form
      class="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5"
      @submit.prevent="submitCode"
    >
      <span class="text-base">🔢</span>
      <input
        v-model="codeInput"
        inputmode="numeric"
        maxlength="6"
        placeholder="QR okunmuyor mu? 6 haneli kodu gir"
        class="min-w-0 flex-1 bg-transparent text-sm tracking-widest text-slate-100 placeholder:text-slate-500 focus:outline-none"
        @input="onCodeInput"
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        :disabled="codeInput.length < 4 || qrBusy"
      >
        Getir
      </Button>
    </form>

    <!-- Log Alanı -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-medium text-slate-300 uppercase tracking-wide">
          Loglar
        </h3>
        <button
          type="button"
          class="text-[11px] text-slate-400 hover:text-slate-200"
          @click="clearLogs"
        >
          Temizle
        </button>
      </div>

      <div
        class="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs"
      >
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="rounded-lg border px-2.5 py-1.5"
          :class="logClass(log.type)"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ log.message }}</span>
            <span class="text-[10px] text-slate-400">
              {{ formatTime(log.timestamp) }}
            </span>
          </div>
          <p v-if="log.details" class="mt-0.5 text-[11px] text-slate-300">
            {{ log.details }}
          </p>
        </div>

        <p v-if="logs.length === 0" class="py-6 text-center text-[11px] text-slate-500">
          Henüz log yok. QR kod okutulduğunda kayıtlar burada görünecek.
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        :loading="isScanning"
        :disabled="isScanning"
        full-width
        @click="scanForPort"
      >
        <span v-if="!isScanning">🔍</span>
        {{ isScanning ? 'Taranıyor...' : 'Port Tarama' }}
      </Button>
      <Button
        variant="outline"
        size="sm"
        full-width
        @click="minimizeWindow"
      >
        Simge Durumuna Küçült
      </Button>
    </div>

    <!-- Port Settings Modal -->
    <PortSettingsModal
      :visible="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import type { LogEntry } from '@/types/electron.d';
import { useLogsStore } from '@/stores/logs';
import { useQRStore } from '@/stores/qr';
import { useSettingsStore } from '@/stores/settings';
import { Button, StatusIndicator } from '@/components/ui';
import { tauriService } from '@/services/tauri';
import PortSettingsModal from '@/components/PortSettingsModal.vue';
import { listen } from '@tauri-apps/api/event';

const logsStore = useLogsStore();
const qrStore = useQRStore();
const settingsStore = useSettingsStore();
const { logs, serialPortStatus } = storeToRefs(logsStore);
const { isProcessingQR: qrBusy } = storeToRefs(qrStore);

const isScanning = ref(false);
const showSettings = ref(false);
const codeInput = ref('');

// Hızlı Kod (D4): yalnızca rakam, en fazla 6 hane
const onCodeInput = () => {
  codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
};
const submitCode = async () => {
  const c = codeInput.value.trim();
  if (c.length < 4) return;
  await qrStore.processCodeEntry(c, logsStore);
  codeInput.value = '';
};

// Port durumunu periyodik olarak kontrol et
let statusLoopTimeout: number | null = null;
let qrLoopTimeout: number | null = null;
let stopStatusLoop = false;
let stopQrLoop = false;
let isPortChecking = false;
let isQrPolling = false;
let isProcessingQR = false;

const PORT_STATUS_MS = 2000;
// D7 (güvenli): polling aralığı 100→20ms. read_data() zaten veri gelince anında döner;
// tarama iki poll ARASINA denk gelirse gecikirdi — aralığı kısaltmak worst-case gecikmeyi
// ~100ms'den ~20ms'ye indirir. Seri mimari/deadlock fix DEĞİŞMEZ (sıfır risk).
// (Tam event-push için serial.rs'i tek-okuyucu yapmak gerekir — gerçek okuyucu testi ister.)
const QR_POLL_MS = 20;

const clearLogs = () => {
  logsStore.clearLogs();
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const logClass = (type: LogEntry['type']) => {
  switch (type) {
    case 'success':
      return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100';
    case 'error':
      return 'border-red-500/40 bg-red-500/5 text-red-100';
    case 'warning':
      return 'border-amber-500/40 bg-amber-500/5 text-amber-100';
    default:
      return 'border-slate-600 bg-slate-800/60 text-slate-100';
  }
};

// --- Klavye modu (keyboard-wedge) QR yakalama (D8) ---
// GÜVENLİ yaklaşım: yalnızca uygulama penceresi ODAKLIYKEN window keydown dinlenir.
// Sistem geneli / global hook YOK → macOS Accessibility izni, keylogger/antivirüs riski YOK.
// Klavye modundaki okuyucu QR'ı hızlıca "yazar" ve Enter ile bitirir. Bir input/textarea'ya
// (Kod Gir, login vb.) yazılıyorsa karışmaz. Seri port yoluna dokunmaz; processQRToken'ın
// kendi kilidi + cooldown'u çift işlemeyi önler.
let kbBuffer = '';
let kbLastKeyTime = 0;
const KB_RESET_GAP_MS = 300; // tuşlar arası bu süreden uzun boşluk → tampon sıfırlanır (insan yazımı elenir)
const KB_MIN_LEN = 6; // en az bu uzunluktaki dizi "tarama" sayılır

const onKeyboardWedge = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  const tag = el?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return; // input'a karışma

  const now = Date.now();
  if (now - kbLastKeyTime > KB_RESET_GAP_MS) kbBuffer = '';
  kbLastKeyTime = now;

  if (e.key === 'Enter') {
    const code = kbBuffer.trim();
    kbBuffer = '';
    if (code.length >= KB_MIN_LEN) {
      logsStore.addLog({
        type: 'info',
        message: `QR yakalandı (klavye modu): ${code}`,
        timestamp: new Date().toISOString(),
        token: code,
      });
      qrStore.processQRToken(code, logsStore);
    }
    return;
  }

  if (e.key.length === 1) {
    kbBuffer += e.key; // tek yazdırılabilir karakter
  }
};

const scanForPort = async () => {
  isScanning.value = true;
  try {
    const result = await tauriService.scanForPort(settingsStore.baudRate);
    const now = new Date().toISOString();
    
    if (result.success && result.port) {
      logsStore.setSerialPortStatus({
        status: 'listening',
        message: 'Port dinleniyor',
        port: result.port,
      });
      
      logsStore.addLog({
        type: 'success',
        message: `Port bağlandı: ${result.port}`,
        timestamp: now,
      });
    } else {
      logsStore.setSerialPortStatus({
        status: 'error',
        message: result.error || 'Port bulunamadı',
        port: '—',
      });
      
      logsStore.addLog({
        type: 'error',
        message: `Port taraması başarısız: ${result.error ?? 'Bilinmeyen hata'}`,
        timestamp: now,
      });
    }
  } catch (error: any) {
    logsStore.addLog({
      type: 'error',
      message: `Port taraması hatası: ${error.message || 'Bilinmeyen hata'}`,
      timestamp: new Date().toISOString(),
    });
  } finally {
    isScanning.value = false;
  }
};

const minimizeWindow = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  } catch (error) {
    console.error('Pencere küçültme hatası:', error);
  }
};

// Port durumunu kontrol et
const checkPortStatus = async () => {
  try {
    const status = await tauriService.getPortStatus();
    logsStore.setSerialPortStatus({
      status: status.status as 'listening' | 'closed' | 'error' | 'connecting',
      message: status.message,
      port: status.port,
    });
  } catch (error) {
    console.error('Port durumu kontrol hatası:', error);
  }
};

// QR kod okuma için polling
const pollQRCode = async () => {
  try {
    const qrCode = await tauriService.readQRCode();
    if (qrCode) {
      if (isProcessingQR) return;
      isProcessingQR = true;
      try {
        // QR okutulduğunda pencereyi aç ve odakla (kasiyerler için)
        try {
          await tauriService.showWindow();
        } catch (error) {
          console.warn('Pencere açma hatası:', error);
        }
        await qrStore.processQRToken(qrCode, logsStore);
      } finally {
        isProcessingQR = false;
      }
    }
  } catch (error) {
    // Hata sessizce yok sayılır (port bağlı değilse normal)
  }
};

onMounted(async () => {
  // Klavye modu (keyboard-wedge) yakalama — yalnızca pencere odaklıyken (D8)
  window.addEventListener('keydown', onKeyboardWedge);

  // İlk port durumu kontrolü
  await checkPortStatus();
  
  // Periyodik port durumu kontrolü (single-flight)
  const statusLoop = async () => {
    if (stopStatusLoop) return;
    if (isPortChecking) {
      if (!stopStatusLoop) {
        statusLoopTimeout = window.setTimeout(statusLoop, PORT_STATUS_MS);
      }
      return;
    }
    isPortChecking = true;
    try {
      await checkPortStatus();
    } finally {
      isPortChecking = false;
      if (!stopStatusLoop) {
        statusLoopTimeout = window.setTimeout(statusLoop, PORT_STATUS_MS);
      }
    }
  };
  statusLoopTimeout = window.setTimeout(statusLoop, PORT_STATUS_MS);

  // QR kod okuma polling (single-flight)
  const qrLoop = async () => {
    if (stopQrLoop) return;
    if (isQrPolling) {
      if (!stopQrLoop) {
        qrLoopTimeout = window.setTimeout(qrLoop, QR_POLL_MS);
      }
      return;
    }
    isQrPolling = true;
    try {
      await pollQRCode();
    } finally {
      isQrPolling = false;
      if (!stopQrLoop) {
        qrLoopTimeout = window.setTimeout(qrLoop, QR_POLL_MS);
      }
    }
  };
  qrLoopTimeout = window.setTimeout(qrLoop, QR_POLL_MS);
  
  // Keyboard hook'u başlat (QR cihazları klavye gibi davranabilir)
  try {
    await tauriService.startKeyboardHook();
    logsStore.addLog({
      type: 'info',
      message: 'Keyboard hook aktif - QR kodlar klavye inputu olarak yakalanacak',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn('Keyboard hook başlatılamadı:', error);
  }
  
  // Tauri event listener - QR kod yakalandığında (keyboard hook'tan)
  const unlisten = await listen<string>('qr-scanned', async (event) => {
    const qrCode = event.payload;
    if (qrCode) {
      if (isProcessingQR) return;
      isProcessingQR = true;
      try {
        // QR okutulduğunda pencereyi aç ve odakla (kasiyerler için)
        try {
          await tauriService.showWindow();
        } catch (error) {
          console.warn('Pencere açma hatası:', error);
        }
        
        // QR kod değerini log'a yaz
        logsStore.addLog({
          type: 'info',
          message: `QR kod yakalandı (keyboard): ${qrCode}`,
          timestamp: new Date().toISOString(),
          token: qrCode,
        });
        await qrStore.processQRToken(qrCode, logsStore);
      } finally {
        isProcessingQR = false;
      }
    }
  });
  
  // Cleanup için unlisten'i sakla
  onUnmounted(() => {
    unlisten();
  });
});

onUnmounted(async () => {
  stopStatusLoop = true;
  stopQrLoop = true;
  window.removeEventListener('keydown', onKeyboardWedge); // klavye modu yakalamayı kaldır (D8)
  if (statusLoopTimeout) window.clearTimeout(statusLoopTimeout);
  if (qrLoopTimeout) window.clearTimeout(qrLoopTimeout);
  
  // Keyboard hook'u durdur
  try {
    await tauriService.stopKeyboardHook();
  } catch (error) {
    console.error('Keyboard hook durdurma hatası:', error);
  }
});
</script>


