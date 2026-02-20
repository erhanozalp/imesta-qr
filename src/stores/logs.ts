import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LogEntry, SerialPortStatus } from '@/types/electron.d';

export const useLogsStore = defineStore('logs', () => {
  const logs = ref<LogEntry[]>([]);
  const serialPortStatus = ref<SerialPortStatus>({
    status: 'closed',
    message: 'Bağlantı bekleniyor...',
    port: '—',
  });

  function addLog(entry: LogEntry) {
    logs.value.unshift(entry);
    // Max 100 log tut, fazlasını şimdilik siliyoruz (ileride file export eklenebilir)
    if (logs.value.length > 100) {
      logs.value = logs.value.slice(0, 100);
    }
  }

  function clearLogs() {
    logs.value = [];
  }

  function setSerialPortStatus(status: SerialPortStatus) {
    serialPortStatus.value = status;
  }

  return {
    logs,
    serialPortStatus,
    addLog,
    clearLogs,
    setSerialPortStatus,
  };
});



