<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    @click.self="emit('close')"
  >
    <Card variant="elevated" class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-[#F3EAEA] flex items-center gap-2">
            <span class="text-lg">⚙️</span>
            Port Ayarları
          </h3>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-[#A89597] hover:bg-white/[0.06] hover:text-[#F3EAEA]"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Otomatik Tarama Toggle -->
        <div class="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <div class="flex-1">
            <p class="text-xs font-medium text-[#F3EAEA]">Otomatik Port Tarama</p>
            <p class="text-[11px] text-[#A89597] mt-0.5">
              Başlangıçta otomatik olarak portları tara
            </p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              v-model="localAutoScan"
              type="checkbox"
              class="peer sr-only"
              @change="handleAutoScanChange"
            />
            <div
              class="peer h-5 w-9 rounded-full bg-white/15 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#8C3A3A] peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-[#773030]/40"
            ></div>
          </label>
        </div>

        <!-- Port Listesi -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-[#C9BABA]">Mevcut Portlar</p>
            <Button
              variant="ghost"
              size="sm"
              :loading="isScanning"
              :disabled="isScanning"
              @click="scanPorts"
            >
              <span v-if="!isScanning">🔄</span>
              {{ isScanning ? 'Taranıyor...' : 'Yenile' }}
            </Button>
          </div>

          <div
            v-if="availablePorts.length > 0"
            class="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-white/[0.08] bg-black/25 p-2"
          >
            <label
              v-for="port in availablePorts"
              :key="port"
              class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition"
              :class="
                selectedPort === port
                  ? 'border-[#9A4B4B] bg-[#7C3434]/25'
                  : 'border-white/[0.1] bg-white/[0.03] hover:border-white/20'
              "
            >
              <input
                v-model="selectedPort"
                type="radio"
                :value="port"
                name="port"
                class="h-3 w-3 border-white/20 text-[#8C3A3A] focus:ring-[#773030]/30"
                @change="handlePortChange"
              />
              <div class="flex-1">
                <p class="text-xs font-medium text-[#F3EAEA]">{{ port }}</p>
                <p class="text-[10px] text-[#A89597]">
                  {{ selectedPort === port ? 'Seçili' : 'Seçmek için tıklayın' }}
                </p>
              </div>
              <Badge v-if="selectedPort === port" variant="default" size="sm">
                Aktif
              </Badge>
            </label>
          </div>

          <div
            v-else
            class="rounded-lg border border-white/[0.08] bg-black/25 px-4 py-6 text-center"
          >
            <p class="text-xs text-[#A89597]">
              {{ isScanning ? 'Portlar taranıyor...' : 'Henüz port bulunamadı' }}
            </p>
            <p v-if="!isScanning" class="mt-1 text-[10px] text-[#7E6E6E]">
              QR cihazınızı bağlayın ve "Yenile" butonuna tıklayın
            </p>
          </div>
        </div>

        <!-- Baud Hızı -->
        <div class="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1">
              <p class="text-xs font-medium text-[#F3EAEA]">Baud Hızı</p>
              <p class="text-[11px] text-[#A89597] mt-0.5">
                Okuyucunuz destekliyorsa 115200 çok daha hızlı okur (emin değilseniz 9600 kalsın)
              </p>
            </div>
            <select
              v-model.number="localBaudRate"
              class="rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs text-[#F3EAEA] focus:border-[#9A4B4B] focus:outline-none"
              @change="handleBaudChange"
            >
              <option v-for="b in BAUD_OPTIONS" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
        </div>

        <!-- Pencere Ayarları -->
        <div class="space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <p class="text-xs font-medium text-[#C9BABA]">Pencere Ayarları</p>

          <label class="flex cursor-pointer items-center justify-between py-1.5">
            <span class="text-xs text-[#A89597]">Kapatıldığında simge durumuna küçült</span>
            <input
              v-model="localMinimizeOnClose"
              type="checkbox"
              class="h-4 w-4 rounded border-white/20 text-[#8C3A3A] focus:ring-[#773030]/30"
              @change="handleMinimizeOnCloseChange"
            />
          </label>

          <label class="flex cursor-pointer items-center justify-between py-1.5">
            <span class="text-xs text-[#A89597]">Başlangıçta simge durumunda başlat</span>
            <input
              v-model="localStartMinimized"
              type="checkbox"
              class="h-4 w-4 rounded border-white/20 text-[#8C3A3A] focus:ring-[#773030]/30"
              @change="handleStartMinimizedChange"
            />
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="emit('close')">
            Kapat
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import { useLogsStore } from '@/stores/logs';
import { Button, Card, Badge } from '@/components/ui';
import { tauriService } from '@/services/tauri';

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const settingsStore = useSettingsStore();
const logsStore = useLogsStore();

const { selectedPort, autoScanEnabled, minimizeOnClose, startMinimized, baudRate } = storeToRefs(settingsStore);

const availablePorts = ref<string[]>([]);
const isScanning = ref(false);

const BAUD_OPTIONS = [9600, 19200, 38400, 57600, 115200];

// Local state for form
const localAutoScan = ref(autoScanEnabled.value);
const localMinimizeOnClose = ref(minimizeOnClose.value);
const localStartMinimized = ref(startMinimized.value);
const localBaudRate = ref(baudRate.value);

// Watch for external changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    localAutoScan.value = autoScanEnabled.value;
    localMinimizeOnClose.value = minimizeOnClose.value;
    localStartMinimized.value = startMinimized.value;
    localBaudRate.value = baudRate.value;
    scanPorts();
  }
});

const scanPorts = async () => {
  isScanning.value = true;
  try {
    // Tauri service ile port listesi al
    const ports = await tauriService.listPorts();

    if (ports.length > 0) {
      availablePorts.value = ports.map(p => p.name);

      // Eğer seçili port yoksa, ilk portu seç
      if (!selectedPort.value && ports.length > 0) {
        settingsStore.setPort(ports[0].name);
      }
    } else {
      // Port bulunamadı, tarama yap
      const scanResult = await tauriService.scanForPort();
      if (scanResult.success && scanResult.port) {
        availablePorts.value = [scanResult.port];
        if (!selectedPort.value) {
          settingsStore.setPort(scanResult.port);
        }
      }
    }

    logsStore.addLog({
      type: 'info',
      message: 'Port taraması tamamlandı',
      timestamp: new Date().toISOString(),
      details: `${availablePorts.value.length} port bulundu`,
    });
  } catch (error: any) {
    logsStore.addLog({
      type: 'error',
      message: 'Port taraması başarısız',
      timestamp: new Date().toISOString(),
      details: error.message || 'Bilinmeyen hata',
    });
  } finally {
    isScanning.value = false;
  }
};

const handlePortChange = async () => {
  if (selectedPort.value) {
    try {
      await tauriService.connectPort(selectedPort.value, baudRate.value);
      settingsStore.setPort(selectedPort.value);
      logsStore.addLog({
        type: 'success',
        message: `Port bağlandı: ${selectedPort.value}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logsStore.addLog({
        type: 'error',
        message: `Port bağlantısı başarısız: ${selectedPort.value}`,
        timestamp: new Date().toISOString(),
        details: error.message || 'Bilinmeyen hata',
      });
    }
  }
};

const handleAutoScanChange = () => {
  settingsStore.setAutoScan(localAutoScan.value);
};

const handleBaudChange = async () => {
  settingsStore.setBaudRate(localBaudRate.value);
  // Bağlı port varsa yeni hızla yeniden bağlan
  if (selectedPort.value) {
    try {
      await tauriService.connectPort(selectedPort.value, localBaudRate.value);
      logsStore.addLog({
        type: 'success',
        message: `Baud hızı ${localBaudRate.value} olarak ayarlandı (${selectedPort.value})`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logsStore.addLog({
        type: 'error',
        message: 'Baud değişiminde yeniden bağlanma başarısız',
        timestamp: new Date().toISOString(),
        details: error.message || 'Bilinmeyen hata',
      });
    }
  }
};

const handleMinimizeOnCloseChange = () => {
  settingsStore.setMinimizeOnClose(localMinimizeOnClose.value);
};

const handleStartMinimizedChange = () => {
  settingsStore.setStartMinimized(localStartMinimized.value);
};
</script>
