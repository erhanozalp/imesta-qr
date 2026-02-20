<template>
  <div class="w-full max-w-md mx-auto">
    <div
      class="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-emerald-500/10 backdrop-blur px-6 py-8"
    >
      <div class="mb-6 text-center">
        <div
          class="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 text-slate-950"
        >
          ☕
        </div>
        <h2 class="text-xl font-semibold tracking-tight text-slate-50">
          Kasiyer Girişi
        </h2>
        <p class="mt-1 text-xs text-slate-400">
          Imesta QR Scanner’a giriş yapın
        </p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-300">
            E-posta
          </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="kasiyer@imesta.com"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-50 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
            :disabled="loading"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-300">
            Şifre
          </label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-50 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
            :disabled="loading"
          />
        </div>

        <p v-if="error" class="rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200">
          {{ error }}
        </p>

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          <span v-if="loading" class="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></span>
          <span>{{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const { loading, error } = storeToRefs(auth);

const email = ref('');
const password = ref('');

const onSubmit = async () => {
  try {
    await auth.login(email.value, password.value);
  } catch {
    // Hata mesajı zaten store.error içinde
  }
};
</script>



