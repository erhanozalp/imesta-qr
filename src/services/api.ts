import axios from 'axios';

// API URL'ini dinamik olarak al
const getApiBaseURL = (): string => {
  // Environment variable'dan al
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // Default
  return 'http://localhost:3000';
};

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor - Token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401 hatası durumunda logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sadece authentication endpoint'lerinde 401 hatası gelirse logout yap
      // QR token hataları (/transactions/*) için logout yapma
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/');
      const isTransactionEndpoint = url.includes('/transactions/');

      if (isAuthEndpoint && !isTransactionEndpoint) {
        // Authentication hatası - logout yap
        console.log('🔒 Authentication hatası, logout yapılıyor');
        localStorage.removeItem('admin_token');
        // Event gönder (App.vue dinleyecek)
        window.dispatchEvent(new Event('auth:logout'));
      } else if (isTransactionEndpoint) {
        // QR token hatası - logout yapma, sadece hata döndür
        console.log('⚠️ QR token hatası (401), logout yapılmıyor');
      } else {
        // Diğer endpoint'lerde 401 hatası - logout yap
        console.log('🔒 Genel 401 hatası, logout yapılıyor');
        localStorage.removeItem('admin_token');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  async login(email: string, password: string) {
    const response = await apiClient.post<{ access_token: string }>('/auth/login', {
      email,
      password,
    });
    return response.data;
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
    // Debug: API'ye gönderilen token'ı console'a yaz
    console.log('📤 API Request - getCustomerPreview:', {
      token: token,
      length: token.length,
      hex: Array.from(token).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '),
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

  async processAction(customerToken: string, action: string) {
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
    });
    return response.data;
  },
};


