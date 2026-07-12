<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#1E1618] shadow-2xl"
    >
      <header
        class="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5"
        :class="result?.success ? 'bg-[#6FA97E]/[0.08]' : 'bg-[#C86A6A]/[0.08]'"
      >
        <span
          class="flex h-9 w-9 flex-none items-center justify-center rounded-full"
          :class="result?.success ? 'bg-[#6FA97E]/20 text-[#82C398]' : 'bg-[#C86A6A]/20 text-[#E08A8A]'"
        >
          <svg v-if="result?.success" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
        </span>
        <h3 class="flex-1 text-[15px] font-semibold text-[#F3EAEA]">
          {{ result?.success ? 'İşlem başarılı' : 'İşlem başarısız' }}
        </h3>
        <button
          type="button"
          aria-label="Kapat"
          class="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#9A8A8A] transition hover:bg-white/[0.06] hover:text-[#F3EAEA]"
          @click="emit('close')"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" /></svg>
        </button>
      </header>

      <section class="px-5 py-4">
        <div v-if="!result" class="py-6 text-center text-sm text-[#A89597]">
          Sonuç bilgisi bulunamadı.
        </div>

        <div v-else class="space-y-4">
          <p class="text-sm font-medium text-[#F3EAEA]">{{ result.message }}</p>

          <div class="space-y-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[#A89597]">Müşteri</span>
              <span class="font-semibold text-[#F3EAEA]">{{ result.customerName }}</span>
            </div>

            <div v-if="result.result" class="space-y-2 border-t border-white/[0.06] pt-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[#A89597]">Puan</span>
                <span class="flex items-center gap-1.5 font-semibold text-[#F3EAEA]">
                  {{ result.result.pointsBefore }}
                  <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-[#7E6E6E]" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h11M11 6l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  <span class="text-[#CE8181]">{{ result.result.pointsAfter }}</span>
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-[#A89597]">
                <span>Otorite puanı</span>
                <span>{{ result.result.authorityPointsBefore }} → {{ result.result.authorityPointsAfter }}</span>
              </div>
              <div
                v-if="result.result.discountApplied"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#E8894A]/15 px-2.5 py-1 text-[11px] font-semibold text-[#F2A868]"
              >
                %{{ result.result.discountApplied }} indirim uygulandı
              </div>
            </div>

            <div
              v-if="result.rank && result.rank.changed"
              class="flex items-center justify-between rounded-xl bg-[#E0B15E]/10 px-3 py-2 text-xs"
            >
              <span class="font-medium text-[#E7C185]">⭐ Rütbe yükseldi</span>
              <span class="font-semibold text-[#EAC079]">{{ result.rank.title }}</span>
            </div>
          </div>

          <button
            type="button"
            class="h-12 w-full rounded-2xl border border-[#9A4B4B] bg-[#7C3434] text-sm font-bold text-[#F6E4E4] transition hover:bg-[#8A3B3B] active:scale-[0.99]"
            @click="emit('close')"
          >
            Tamam{{ countdown !== null ? ` (${countdown})` : '' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';

interface ResultDetails {
  pointsBefore: number;
  pointsAfter: number;
  authorityPointsBefore: number;
  authorityPointsAfter: number;
  discountApplied?: number;
}

interface RankResult {
  title: string;
  changed: boolean;
}

interface ActionResult {
  success: boolean;
  message: string;
  customerName: string;
  action: string;
  result?: ResultDetails;
  rank?: RankResult;
}

const props = defineProps<{
  visible: boolean;
  result: ActionResult | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const result = computed(() => props.result);

// Başarılı işlemde 3 sn sonra otomatik kapan (kasiyer yeni okutmaya hazır olsun).
// Hata durumunda otomatik KAPANMAZ — kasiyer hatayı görmeli.
const AUTO_CLOSE_SECONDS = 3;
const countdown = ref<number | null>(null);
let countdownTimer: number | null = null;

const clearCountdown = () => {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = null;
};

watch(
  () => props.visible,
  (isVisible) => {
    clearCountdown();
    if (isVisible && props.result?.success) {
      countdown.value = AUTO_CLOSE_SECONDS;
      countdownTimer = window.setInterval(() => {
        if (countdown.value === null) return;
        countdown.value -= 1;
        if (countdown.value <= 0) {
          clearCountdown();
          emit('close');
        }
      }, 1000);
    }
  },
);

onUnmounted(clearCountdown);
</script>
