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
      const response = await apiService.login(email, password);
      authService.setToken(response.access_token);
      token.value = response.access_token;

      // Kullanıcı bilgilerini çek
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

  function logout() {
    const notifications = useNotificationsStore();
    authService.clearToken();
    token.value = null;
    user.value = null;
    error.value = null;
    notifications.info('Çıkış yapıldı');
  }

  return {
    // state
    token,
    user,
    loading,
    error,
    // getters
    isAuthenticated,
    // actions
    login,
    logout,
    setUser,
  };
});


