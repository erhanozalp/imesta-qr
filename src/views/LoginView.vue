<template>
  <div class="w-full max-w-md mx-auto">
    <div
      class="rounded-2xl border border-white/[0.08] bg-[#1E1618] shadow-xl shadow-black/30 px-6 py-8"
    >
      <div class="mb-6 text-center">
        <div
          class="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#773030] text-[#F6E9E9]"
        >
          ☕
        </div>
        <h2 class="text-xl font-semibold tracking-tight text-[#F3EAEA]">
          Kasiyer Girişi
        </h2>
        <p class="mt-1 text-xs text-[#A89597]">
          Imesta QR Scanner’a giriş yapın
        </p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-[#C9BABA]">
            E-posta
          </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="kasiyer@imesta.com"
            class="w-full rounded-xl border border-white/[0.12] bg-black/25 px-3.5 py-2.5 text-sm text-[#F3EAEA] shadow-sm outline-none transition placeholder:text-[#7E6E6E] focus:border-[#9A4B4B] focus:ring-2 focus:ring-[#773030]/40"
            :disabled="loading"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-[#C9BABA]">
            Şifre
          </label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-xl border border-white/[0.12] bg-black/25 px-3.5 py-2.5 text-sm text-[#F3EAEA] shadow-sm outline-none transition placeholder:text-[#7E6E6E] focus:border-[#9A4B4B] focus:ring-2 focus:ring-[#773030]/40"
            :disabled="loading"
          />
        </div>

        <p v-if="error" class="rounded-xl border border-[#C0392B]/40 bg-[#C0392B]/10 px-3 py-2 text-xs text-[#E0A0A0]">
          {{ error }}
        </p>

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9A4B4B] bg-[#7C3434] px-4 py-2.5 text-sm font-semibold text-[#F6E4E4] transition hover:bg-[#8A3B3B] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          <span v-if="loading" class="h-3 w-3 animate-spin rounded-full border-2 border-[#F6E4E4] border-t-transparent"></span>
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



