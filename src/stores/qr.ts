import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api';
import { useNotificationsStore } from './notifications';

interface CustomerPreview {
  customer: {
    id: string;
    name: string;
    email: string;
    points: number;
    authorityPoints: number;
  };
  customerType: 'NORMAL' | 'STUDENT' | 'PARTNER' | 'STUDENT_PARTNER';
  rank: {
    id: string;
    title: string;
    rankTitle: string;
    benefits: Array<{ id: string; text: string }>;
    nextRank: {
      rankTitle: string;
      minPoints: number;
      pointsNeeded: number;
    } | null;
  } | null;
  availableActions: Array<{
    type: string;
    label: string;
    description: string;
    icon: string;
    isRecommended?: boolean;
    discountPercent?: number;
    pointsCost?: number;
    pointsGain?: number;
    campaignId?: string; // D1: kampanya aksiyonları için
  }>;
  summary: {
    canRedeemReward: boolean;
    pointsForReward?: number; // yeni backend'de gelir (3/5 ilerleme için)
    freeCoffeesAvailable: number;
    hasStudentDiscount: boolean;
    hasPartnerDiscount: boolean;
    studentDiscountPercent: number;
    partnerDiscountPercent: number;
  };
  // Yeni backend alanları (opsiyonel — eski backend'de gelmez, UI kontrol eder)
  todayVisit?: {
    visitedToday: boolean;
    grantCount: number;
    pointsToday: number;
    lastGrantAt: string | null;
  };
  activeCampaigns?: Array<{
    id: string;
    name: string;
    type: string;
    description: string | null;
    summary: string;
    isApplicableNow: boolean;
  }>;
}

interface ActionResult {
  success: boolean;
  message: string;
  customerName: string;
  action: string;
  result: {
    pointsBefore: number;
    pointsAfter: number;
    authorityPointsBefore: number;
    authorityPointsAfter: number;
    discountApplied?: number;
  };
  rank?: {
    title: string;
    changed: boolean;
  };
}

export const useQRStore = defineStore('qr', () => {
  const currentToken = ref<string>('');
  const currentCode = ref<string>(''); // D4: hızlı kod akışında dolu olur (token yerine)
  const previewShownAt = ref<number>(0); // D10: önizleme açıldığı an (kasiyer karar süresi ölçümü)
  const customerPreview = ref<CustomerPreview | null>(null);
  const actionResult = ref<ActionResult | null>(null);
  const isProcessingQR = ref(false);
  const lastProcessedToken = ref<string>('');
  const lastProcessedTime = ref<number>(0);
  const TOKEN_COOLDOWN_MS = 5000; // 5 saniye cooldown

  // Modal visibility
  const showCustomerModal = ref(false);
  const showResultModal = ref(false);

  async function processQRToken(token: string, logsStore: any) {
    // Lock kontrolü
    if (isProcessingQR.value) {
      logsStore.addLog({
        type: 'warning',
        message: 'İşlem zaten devam ediyor',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Cooldown kontrolü
    const now = Date.now();
    if (token === lastProcessedToken.value && now - lastProcessedTime.value < TOKEN_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil((TOKEN_COOLDOWN_MS - (now - lastProcessedTime.value)) / 1000);
      logsStore.addLog({
        type: 'warning',
        message: `Token yakın zamanda işlendi (${remainingCooldown} saniye önce)`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Hybrid yaklaşım: Yeni QR okutulduğunda eski modal'ları kapat
    // Müşteri modalı her zaman öncelikli, result modal'ı kapat
    if (showResultModal.value) {
      // Eski "puan verildi" modalını kapat
      showResultModal.value = false;
      actionResult.value = null;
    }

    isProcessingQR.value = true;
    lastProcessedToken.value = token;
    lastProcessedTime.value = now;
    currentToken.value = token;
    currentCode.value = ''; // QR akışı — kodu temizle

    // QR kod değerini log'a yaz
    logsStore.addLog({
      type: 'info',
      message: `QR kod okutuldu: ${token}`,
      timestamp: new Date().toISOString(),
      token: token,
    });

    // Debug: API'ye gönderilen token'ı log'a yaz
    console.log('🔍 API\'ye gönderilecek token:', {
      original: token,
      length: token.length,
      hex: Array.from(token).map(c => c.charCodeAt(0).toString(16)).join(' '),
      visible: token,
    });

    try {
      logsStore.addLog({
        type: 'info',
        message: 'Müşteri bilgileri alınıyor...',
        timestamp: new Date().toISOString(),
        token: token,
      });

      const preview = await apiService.getCustomerPreview(token);
      customerPreview.value = preview;
      showCustomerModal.value = true;
      previewShownAt.value = Date.now(); // D10: önizleme açıldı → süre ölçümü başlar
      
      const notifications = useNotificationsStore();
      notifications.success(`Müşteri bulundu: ${preview.customer.name}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Geçersiz QR kod veya işlem hatası.';
      
      const notifications = useNotificationsStore();
      notifications.error(errorMessage);
      
      logsStore.addLog({
        type: 'error',
        message: 'Müşteri bilgileri alınamadı',
        timestamp: new Date().toISOString(),
        details: errorMessage,
        token: token.substring(0, 50) + '...',
      });

      // Hata durumunda result modal göster
      actionResult.value = {
        success: false,
        message: errorMessage,
        customerName: 'Bilinmiyor',
        action: '',
        result: {
          pointsBefore: 0,
          pointsAfter: 0,
          authorityPointsBefore: 0,
          authorityPointsAfter: 0,
        },
      };
      showResultModal.value = true;
    } finally {
      isProcessingQR.value = false;
    }
  }

  // Hızlı Kod (D4) ile müşteri getir — QR yerine 6 haneli kod (peek: kodu tüketmez).
  async function processCodeEntry(code: string, logsStore: any) {
    const clean = (code || '').trim();
    if (!clean) return;
    if (isProcessingQR.value) {
      logsStore.addLog({
        type: 'warning',
        message: 'İşlem zaten devam ediyor',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    if (showResultModal.value) {
      showResultModal.value = false;
      actionResult.value = null;
    }
    isProcessingQR.value = true;
    currentCode.value = clean;
    currentToken.value = ''; // kod akışı — token'ı temizle
    logsStore.addLog({
      type: 'info',
      message: `Hızlı kod girildi: ${clean}`,
      timestamp: new Date().toISOString(),
    });
    try {
      const preview = await apiService.getCustomerPreviewByCode(clean);
      customerPreview.value = preview as unknown as CustomerPreview;
      showCustomerModal.value = true;
      previewShownAt.value = Date.now(); // D10: önizleme açıldı → süre ölçümü başlar
      const notifications = useNotificationsStore();
      notifications.success(`Müşteri bulundu: ${preview.customer.name}`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Geçersiz veya süresi dolmuş kod.';
      const notifications = useNotificationsStore();
      notifications.error(errorMessage);
      logsStore.addLog({
        type: 'error',
        message: 'Kod ile müşteri bulunamadı',
        timestamp: new Date().toISOString(),
        details: errorMessage,
      });
      currentCode.value = '';
      actionResult.value = {
        success: false,
        message: errorMessage,
        customerName: 'Bilinmiyor',
        action: '',
        result: {
          pointsBefore: 0,
          pointsAfter: 0,
          authorityPointsBefore: 0,
          authorityPointsAfter: 0,
        },
      };
      showResultModal.value = true;
    } finally {
      isProcessingQR.value = false;
    }
  }

  async function processAction(
    actionType: string,
    quantity: number,
    logsStore: any,
    campaignId?: string,
  ) {
    if (!currentToken.value && !currentCode.value) return;

    const actionSource = currentCode.value
      ? `kod:${currentCode.value}`
      : currentToken.value.substring(0, 50) + '...';

    // Müşteri modalını kapat (işlem yapılırken)
    showCustomerModal.value = false;
    isProcessingQR.value = true;
    
    // Eğer result modal açıksa kapat (yeni işlem yapılırken)
    if (showResultModal.value) {
      showResultModal.value = false;
      actionResult.value = null;
    }

    try {
      logsStore.addLog({
        type: 'info',
        message: `İşlem yapılıyor: ${actionType}...`,
        timestamp: new Date().toISOString(),
        token: actionSource,
      });

      // D10: önizleme açıldığından bu yana geçen süre (kasiyer karar süresi), 10 dk ile sınırlı
      const durationMs = previewShownAt.value > 0 ? Math.min(600000, Date.now() - previewShownAt.value) : undefined;
      const result = currentCode.value
        ? await apiService.processActionByCode(currentCode.value, actionType, quantity, campaignId, durationMs)
        : await apiService.processAction(currentToken.value, actionType, quantity, campaignId, durationMs);
      actionResult.value = result;
      showResultModal.value = true;

      const notifications = useNotificationsStore();
      const actionLabel = customerPreview.value?.availableActions.find(a => a.type === actionType)?.label || actionType;
      const quantityLabel = quantity > 1 ? ` (${quantity} adet)` : '';

      // Log ekle
      const logType = result.success ? 'success' : 'error';
      
      logsStore.addLog({
        type: logType,
        message: result.success
          ? `${actionLabel}${quantityLabel} başarılı`
          : `${actionLabel}${quantityLabel} başarısız`,
        timestamp: new Date().toISOString(),
        customerName: result.customerName,
        details: result.message,
        token: actionSource,
      });

      // Toast notification
      if (result.success) {
        notifications.success(result.message);
      } else {
        notifications.error(result.message);
      }

      // Rütbe yükselme bildirimi
      if (result.rank?.changed) {
        const rankMessage = `🎉 Rütbe yükseldi: ${result.rank.title}`;
        notifications.success(rankMessage, 6000);
        logsStore.addLog({
          type: 'success',
          message: rankMessage,
          timestamp: new Date().toISOString(),
          customerName: result.customerName,
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'İşlem başarısız oldu.';
      
      const notifications = useNotificationsStore();
      notifications.error(errorMessage);
      
      actionResult.value = {
        success: false,
        message: errorMessage,
        customerName: customerPreview.value?.customer?.name || 'Bilinmiyor',
        action: actionType,
        result: {
          pointsBefore: 0,
          pointsAfter: 0,
          authorityPointsBefore: 0,
          authorityPointsAfter: 0,
        },
      };
      showResultModal.value = true;

      logsStore.addLog({
        type: 'error',
        message: `İşlem başarısız: ${actionType}`,
        timestamp: new Date().toISOString(),
        details: errorMessage,
        token: actionSource,
      });
    } finally {
      isProcessingQR.value = false;
    }
  }

  function closeCustomerModal() {
    showCustomerModal.value = false;
    customerPreview.value = null;
    currentToken.value = '';
    currentCode.value = '';
    isProcessingQR.value = false;
  }

  function closeResultModal() {
    showResultModal.value = false;
    actionResult.value = null;
    customerPreview.value = null;
    currentToken.value = '';
    currentCode.value = '';
  }

  function reset() {
    currentToken.value = '';
    currentCode.value = '';
    customerPreview.value = null;
    actionResult.value = null;
    isProcessingQR.value = false;
    lastProcessedToken.value = '';
    lastProcessedTime.value = 0;
    showCustomerModal.value = false;
    showResultModal.value = false;
  }

  return {
    // state
    currentToken,
    currentCode,
    customerPreview,
    actionResult,
    isProcessingQR,
    showCustomerModal,
    showResultModal,
    // actions
    processQRToken,
    processCodeEntry,
    processAction,
    closeCustomerModal,
    closeResultModal,
    reset,
  };
});

