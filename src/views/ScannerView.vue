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
import { Button, StatusIndicator } from '@/components/ui';
import { tauriService } from '@/services/tauri';
import PortSettingsModal from '@/components/PortSettingsModal.vue';
import { listen } from '@tauri-apps/api/event';

const logsStore = useLogsStore();
const qrStore = useQRStore();
const { logs, serialPortStatus } = storeToRefs(logsStore);

const isScanning = ref(false);
const showSettings = ref(false);

// Port durumunu periyodik olarak kontrol et
let statusCheckInterval: number | null = null;

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

const scanForPort = async () => {
  isScanning.value = true;
  try {
    const result = await tauriService.scanForPort();
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
      await qrStore.processQRToken(qrCode, logsStore);
    }
  } catch (error) {
    // Hata sessizce yok sayılır (port bağlı değilse normal)
  }
};

let qrPollInterval: number | null = null;

onMounted(async () => {
  // İlk port durumu kontrolü
  await checkPortStatus();
  
  // Periyodik port durumu kontrolü (her 2 saniyede bir)
  statusCheckInterval = window.setInterval(checkPortStatus, 2000);
  
  // QR kod okuma polling (her 100ms'de bir)
  qrPollInterval = window.setInterval(pollQRCode, 100);
  
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
  const unlisten = await listen<string>('qr-scanned', (event) => {
    const qrCode = event.payload;
    if (qrCode) {
      // QR kod değerini log'a yaz
      logsStore.addLog({
        type: 'info',
        message: `QR kod yakalandı (keyboard): ${qrCode}`,
        timestamp: new Date().toISOString(),
        token: qrCode,
      });
      qrStore.processQRToken(qrCode, logsStore);
    }
  });
  
  // Cleanup için unlisten'i sakla
  onUnmounted(() => {
    unlisten();
  });
});

onUnmounted(async () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }
  if (qrPollInterval) {
    clearInterval(qrPollInterval);
  }
  
  // Keyboard hook'u durdur
  try {
    await tauriService.stopKeyboardHook();
  } catch (error) {
    console.error('Keyboard hook durdurma hatası:', error);
  }
});
</script>


