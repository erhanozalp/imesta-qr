import axios from 'axios';
import { authService } from '@/services/auth';

// API URL'ini dinamik olarak al
export const getApiBaseURL = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return 'http://localhost:3000';
};

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

/** 401'de refresh denemesi: sadece kasiyer JWT / guard kaynaklı mesajlar (müşteri QR hatası değil) */
function shouldTryQrRefresh(message: unknown): boolean {
  const m = String(message ?? '').trim();
  if (!m) return true;
  const lower = m.toLowerCase();
  if (lower === 'unauthorized') return true;
  if (lower.includes('jwt expired') || lower.includes('jsonwebtokenerror')) return true;
  if (lower === 'unauthorized.' || m === 'Unauthorized') return true;
  return false;
}

let refreshPromise: Promise<void> | null = null;

async function refreshQrSession(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise;
    return;
  }
  const refresh = authService.getRefreshToken();
  if (!refresh) {
    throw new Error('no refresh token');
  }
  refreshPromise = (async () => {
    const { data } = await axios.post<{
      access_token: string;
      refresh_token: string;
    }>(
      `${getApiBaseURL()}/auth/qr/refresh`,
      { refresh_token: refresh },
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      },
    );
    authService.setToken(data.access_token);
    authService.setRefreshToken(data.refresh_token);
    window.dispatchEvent(new Event('auth:token-updated'));
  })();
  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// Request interceptor - Token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401: önce QR refresh, sonra mevcut mantık
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config as { url?: string; _retryAfterRefresh?: boolean; headers?: Record<string, string> } | undefined;
    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    const url = config.url || '';

    if (url.includes('/auth/qr/login') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (url.includes('/auth/qr/refresh')) {
      authService.clearAllAuth();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }

    const msg = error.response?.data?.message;
    const canRefresh =
      shouldTryQrRefresh(msg) &&
      !!authService.getRefreshToken() &&
      !config._retryAfterRefresh;

    if (canRefresh) {
      try {
        await refreshQrSession();
        config._retryAfterRefresh = true;
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${authService.getToken()}`;
        return apiClient.request(config);
      } catch {
        authService.clearAllAuth();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }
    }

    const isAuthEndpoint = url.includes('/auth/');
    const isTransactionEndpoint = url.includes('/transactions/');

    if (isAuthEndpoint && !isTransactionEndpoint) {
      console.log('🔒 Authentication hatası, logout yapılıyor');
      authService.clearAllAuth();
      window.dispatchEvent(new Event('auth:logout'));
    } else if (isTransactionEndpoint) {
      console.log('⚠️ İşlem 401 (müşteri QR veya kasiyer oturumu)');
    } else {
      console.log('🔒 Genel 401 hatası, logout yapılıyor');
      authService.clearAllAuth();
      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  /** QR masaüstü: access + refresh token */
  async loginQr(email: string, password: string) {
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
    }>('/auth/qr/login', {
      email,
      password,
    });
    return response.data;
  },

  async logoutQr() {
    const refresh = authService.getRefreshToken();
    if (!refresh) return;
    try {
      await axios.post(
        `${getApiBaseURL()}/auth/qr/logout`,
        { refresh_token: refresh },
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
    } catch {
      /* sunucu ulaşılamazsa yine de istemci temizlenir */
    }
  },

  async getMe() {
    const response = await apiClient.get<{
      name: string;
      email: string;
    }>('/auth/me');
    return response.data;
  },

  async grantPoint(customerToken: string) {
    const requestData = { customerToken };
    console.log('📤 API Request:', {
      method: 'POST',
      url: `${getApiBaseURL()}/transactions/grant-point`,
      data: requestData,
    });

    const response = await apiClient.post<{
      customerName: string;
      remainingPoints?: number;
      newPointTotal?: number;
    }>('/transactions/grant-point', requestData);

    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  },

  async redeemReward(customerToken: string) {
    const response = await apiClient.post<{
      customerName: string;
      remainingPoints: number;
    }>('/transactions/redeem-reward', {
      customerToken,
    });
    return response.data;
  },

  async getCustomerPreview(token: string) {
    console.log('📤 API Request - getCustomerPreview:', {
      token: token,
      length: token.length,
      hex: Array.from(token).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '),
      url: `${getApiBaseURL()}/transactions/customer-preview?token=${encodeURIComponent(token)}`,
    });

    const response = await apiClient.get<{
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
      }>;
      summary: {
        canRedeemReward: boolean;
        freeCoffeesAvailable: number;
        hasStudentDiscount: boolean;
        hasPartnerDiscount: boolean;
        studentDiscountPercent: number;
        partnerDiscountPercent: number;
      };
    }>('/transactions/customer-preview', {
      params: { token },
    });
    return response.data;
  },

  async processAction(customerToken: string, action: string, quantity = 1) {
    const response = await apiClient.post<{
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
    }>('/transactions/process-action', {
      customerToken,
      action,
      quantity,
    });
    return response.data;
  },
};
