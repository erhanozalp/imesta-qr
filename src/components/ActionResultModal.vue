<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-emerald-500/20 backdrop-blur"
    >
      <header
        class="flex items-center justify-between border-b border-slate-800 px-5 py-3"
        :class="result?.success ? 'bg-emerald-500/5' : 'bg-red-500/5'"
      >
        <h3 class="text-sm font-semibold text-slate-50 flex items-center gap-2">
          <span class="text-lg">
            {{ result?.success ? '✅' : '❌' }}
          </span>
          {{ result?.success ? 'İşlem Başarılı' : 'İşlem Başarısız' }}
        </h3>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <section class="px-5 py-4 text-sm text-slate-100">
        <div v-if="!result" class="py-6 text-center text-slate-400">
          Sonuç bilgisi bulunamadı.
        </div>

        <div v-else class="space-y-4">
          <p class="text-sm font-medium text-slate-50">
            {{ result.message }}
          </p>

          <div class="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Müşteri</span>
              <span class="font-semibold text-slate-50">
                {{ result.customerName }}
              </span>
            </div>

            <div v-if="result.result" class="mt-2 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Puan</span>
                <span class="font-semibold text-slate-50">
                  {{ result.result.pointsBefore }} → {{ result.result.pointsAfter }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-slate-400">
                <span>Otorite Puanı</span>
                <span>
                  {{ result.result.authorityPointsBefore }} →
                  {{ result.result.authorityPointsAfter }}
                </span>
              </div>
              <div
                v-if="result.result.discountApplied"
                class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
              >
                <span>💸</span>
                <span>%{{ result.result.discountApplied }} indirim uygulandı</span>
              </div>
            </div>

            <div
              v-if="result.rank && result.rank.changed"
              class="mt-3 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-xs"
            >
              <span class="text-emerald-200">🎉 Rütbe Yükseldi</span>
              <span class="font-semibold text-emerald-100">
                {{ result.rank.title }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <button
            type="button"
            class="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/30 hover:bg-emerald-400"
            @click="emit('close')"
          >
            Tamam
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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
const visible = computed(() => props.visible);
</script>


