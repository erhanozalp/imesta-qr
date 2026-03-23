import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth';
import { apiService } from '@/services/api';
import { useNotificationsStore } from './notifications';

interface UserInfo {
  name: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(authService.getToken());
  const user = ref<UserInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    const notifications = useNotificationsStore();

    try {
      const response = await apiService.loginQr(email, password);
      authService.setToken(response.access_token);
      authService.setRefreshToken(response.refresh_token);
      token.value = response.access_token;

      try {
        const me = await apiService.getMe();
        user.value = {
          name: me.name,
          email: me.email,
        };
        notifications.success(`Hoş geldin, ${me.name}!`);
      } catch (e) {
        console.warn('Kullanıcı bilgileri alınamadı:', e);
        notifications.warning('Giriş başarılı ancak kullanıcı bilgileri alınamadı.');
      }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || 'Giriş başarısız. Lütfen tekrar deneyin.';
      error.value = errorMessage;
      notifications.error(errorMessage);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function setUser(info: UserInfo | null) {
    user.value = info;
  }

  function clearLocalSession() {
    authService.clearAllAuth();
    token.value = null;
    user.value = null;
    error.value = null;
  }

  /** Sunucuya revoke gitmeden (401 / refresh başarısız) oturumu temizle */
  function sessionExpired() {
    clearLocalSession();
  }

  async function logout() {
    const notifications = useNotificationsStore();
    await apiService.logoutQr();
    clearLocalSession();
    notifications.info('Çıkış yapıldı');
  }

  function syncTokenFromStorage() {
    token.value = authService.getToken();
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    sessionExpired,
    setUser,
    syncTokenFromStorage,
  };
});
