<template>
  <div class="min-h-screen bg-[#1B1416] text-[#F3EAEA] flex items-center justify-center">
    <div class="w-full max-w-2xl px-4">
      <header class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight">
          <span class="bg-gradient-to-r from-[#D68A8A] to-[#9B4545] bg-clip-text text-transparent">
            Imesta QR Scanner
          </span>
        </h1>
        <p class="mt-2 text-sm text-[#A89597]">
          Kasiyerler için hızlı QR okuma ve müşteri yönetimi
        </p>
      </header>

      <main>
        <div
          class="rounded-2xl border border-white/[0.08] bg-[#1E1618] shadow-xl shadow-black/30 px-6 py-6"
        >
          <!-- Henüz login olmadıysa -->
          <LoginView v-if="!isAuthenticated" />

          <!-- Login olduysa ana scanner ekranı -->
          <div v-else class="space-y-4">
            <div class="flex items-center justify-between text-xs text-[#A89597]">
              <span>
                Hoş geldin,
                <span class="font-semibold text-[#CE8181]">{{ userName }}</span>
              </span>
              <button
                type="button"
                class="inline-flex items-center rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-[#D3C4C4] hover:border-[#9A4B4B] hover:text-[#CE8181]"
                @click="logout"
              >
                Çıkış
              </button>
            </div>

            <ScannerView />
          </div>
        </div>
      </main>

      <!-- Modals -->
      <CustomerPreviewModal
        :visible="showCustomerModal"
        :loading="isProcessingQR"
        :data="customerPreview"
        @close="closeCustomerModal"
        @select-action="handleActionSelect"
      />
      <ActionResultModal
        :visible="showResultModal"
        :result="actionResult"
        @close="closeResultModal"
      />
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import LoginView from '@/views/LoginView.vue';
import ScannerView from '@/views/ScannerView.vue';
import CustomerPreviewModal from '@/components/CustomerPreviewModal.vue';
import ActionResultModal from '@/components/ActionResultModal.vue';
import ToastContainer from '@/components/ToastContainer.vue';
import { useAuthStore } from '@/stores/auth';
import { useQRStore } from '@/stores/qr';
import { useLogsStore } from '@/stores/logs';
import { useSettingsStore } from '@/stores/settings';
import { tauriService } from '@/services/tauri';

const auth = useAuthStore();
const qrStore = useQRStore();
const logsStore = useLogsStore();
const settingsStore = useSettingsStore();

const { isAuthenticated, user } = storeToRefs(auth);
const {
  showCustomerModal,
  showResultModal,
  customerPreview,
  actionResult,
  isProcessingQR,
} = storeToRefs(qrStore);
const { startMinimized } = storeToRefs(settingsStore);

const userName = computed(() => user.value?.name ?? 'Kasiyer');

const logout = async () => {
  await auth.logout();
  qrStore.reset();
};

const onAuthLogout = () => {
  auth.sessionExpired();
  qrStore.reset();
};

const onTokenUpdated = () => {
  auth.syncTokenFromStorage();
};

const closeCustomerModal = () => {
  qrStore.closeCustomerModal();
};

const closeResultModal = () => {
  qrStore.closeResultModal();
};

const handleActionSelect = (payload: {
  action: { type: string; campaignId?: string };
  quantity: number;
}) => {
  qrStore.processAction(payload.action.type, payload.quantity, logsStore, payload.action.campaignId);
};

// Uygulama başlangıcında ayarları uygula
onMounted(async () => {
  window.addEventListener('auth:logout', onAuthLogout);
  window.addEventListener('auth:token-updated', onTokenUpdated);

  // Eğer startMinimized ayarı aktifse, pencereyi başlangıçta gizle
  if (startMinimized.value) {
    try {
      await tauriService.hideWindow();
    } catch (error) {
      console.warn('Pencere gizleme hatası:', error);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('auth:logout', onAuthLogout);
  window.removeEventListener('auth:token-updated', onTokenUpdated);
});
</script>

