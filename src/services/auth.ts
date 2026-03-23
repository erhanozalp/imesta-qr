const TOKEN_KEY = 'admin_token';
const REFRESH_KEY = 'qr_refresh_token';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_KEY, token);
  },

  clearRefreshToken(): void {
    localStorage.removeItem(REFRESH_KEY);
  },

  clearAllAuth(): void {
    this.clearToken();
    this.clearRefreshToken();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
