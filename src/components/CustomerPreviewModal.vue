<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-emerald-500/20 backdrop-blur"
    >
      <header class="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <h3 class="text-sm font-semibold text-slate-50 flex items-center gap-2">
          <span class="text-lg">📱</span>
          Müşteri Bilgileri
        </h3>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <section class="max-h-[70vh] overflow-y-auto px-5 py-4 text-sm text-slate-100">
        <div v-if="loading" class="py-10 text-center text-slate-400">
          <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          Müşteri bilgileri yükleniyor...
        </div>

        <div v-else-if="data">
          <!-- Müşteri Bilgileri -->
          <div class="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-wide text-slate-400">Müşteri</p>
                <p class="text-sm font-semibold text-slate-50">
                  {{ data.customer.name || 'İsimsiz' }}
                </p>
              </div>
              <div class="flex gap-2 text-[11px] font-medium">
                <span
                  v-if="data.customerType === 'STUDENT' || data.customerType === 'STUDENT_PARTNER'"
                  class="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-300"
                >
                  🎓 Öğrenci
                </span>
                <span
                  v-if="data.customerType === 'PARTNER' || data.customerType === 'STUDENT_PARTNER'"
                  class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300"
                >
                  🤝 İşbirlikçi
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div class="flex flex-col gap-0.5">
                <span class="text-slate-400">⭐ Puan</span>
                <span class="font-semibold text-slate-50">{{ data.customer.points }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-slate-400">🏆 Otorite Puanı</span>
                <span class="font-semibold text-slate-50">{{ data.customer.authorityPoints }}</span>
              </div>
            </div>

            <div v-if="data.rank" class="mt-3 flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
              <span class="text-xs text-slate-400">Rütbe</span>
              <span
                class="rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-3 py-0.5 text-xs font-semibold text-slate-950"
              >
                {{ data.rank.title }}
              </span>
            </div>

            <div
              v-if="data.rank && data.rank.benefits.length > 0"
              class="mt-3 rounded-lg bg-slate-900/70 px-3 py-2"
            >
              <p class="mb-1 text-xs font-medium text-slate-300">✨ Rütbe Özellikleri</p>
              <ul class="space-y-1 text-xs text-slate-400">
                <li v-for="benefit in data.rank.benefits" :key="benefit.id" class="flex items-start gap-1.5">
                  <span class="mt-[2px] text-emerald-400">✓</span>
                  <span>{{ benefit.text }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Aksiyonlar -->
          <div class="mt-4 space-y-2">
            <p class="text-xs font-medium text-slate-300">Ne yapmak istersiniz?</p>
            <div class="space-y-2">
              <div
                v-for="action in data.availableActions"
                :key="action.type"
                class="space-y-2 rounded-xl border px-3.5 py-2.5"
                :class="actionClasses(action)"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 text-left text-xs transition"
                  @click="emitAction(action)"
                >
                  <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/80 text-base">
                    {{ action.icon }}
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <p class="font-semibold text-slate-50">{{ action.label }}</p>
                    <p class="text-[11px] text-slate-400">
                      {{ action.description }}
                    </p>
                  </div>
                </button>

                <div
                  v-if="supportsQuantity(action)"
                  class="flex items-center justify-between rounded-lg bg-slate-900/70 px-2.5 py-2"
                >
                  <p class="text-[11px] text-slate-300">Adet</p>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="h-7 w-7 rounded border border-slate-700 text-slate-200 hover:border-slate-500 disabled:opacity-50"
                      :disabled="getQuantity(action) <= 1"
                      @click.stop="decreaseQuantity(action)"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      class="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center text-xs text-slate-100"
                      :min="1"
                      :max="getMaxQuantity(action)"
                      :value="getQuantity(action)"
                      @click.stop
                      @input="onQuantityInput(action, $event)"
                    />
                    <button
                      type="button"
                      class="h-7 w-7 rounded border border-slate-700 text-slate-200 hover:border-slate-500 disabled:opacity-50"
                      :disabled="getQuantity(action) >= getMaxQuantity(action)"
                      @click.stop="increaseQuantity(action)"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      class="rounded border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:border-emerald-400"
                      @click.stop="emitAction(action)"
                    >
                      Uygula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-xs text-slate-400">
          Müşteri bilgisi bulunamadı.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Benefit {
  id: string;
  text: string;
}

interface RankInfo {
  id: string;
  title: string;
  rankTitle: string;
  benefits: Benefit[];
  nextRank: {
    rankTitle: string;
    minPoints: number;
    pointsNeeded: number;
  } | null;
}

interface AvailableAction {
  type: string;
  label: string;
  description: string;
  icon: string;
  isRecommended?: boolean;
  discountPercent?: number;
  pointsCost?: number;
  pointsGain?: number;
}

interface CustomerPreviewData {
  customer: {
    id: string;
    name: string;
    email: string;
    points: number;
    authorityPoints: number;
  };
  customerType: 'NORMAL' | 'STUDENT' | 'PARTNER' | 'STUDENT_PARTNER';
  rank: RankInfo | null;
  availableActions: AvailableAction[];
  summary: {
    canRedeemReward: boolean;
    freeCoffeesAvailable: number;
    hasStudentDiscount: boolean;
    hasPartnerDiscount: boolean;
    studentDiscountPercent: number;
    partnerDiscountPercent: number;
  };
}

const props = defineProps<{
  visible: boolean;
  loading?: boolean;
  data: CustomerPreviewData | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectAction', payload: { action: AvailableAction; quantity: number }): void;
}>();

const loading = computed(() => props.loading ?? false);
const data = computed(() => props.data);
const quantities = ref<Record<string, number>>({});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      // Her yeni müşteri/işlem açılışında yanlış adet riskini önlemek için varsayılanları sıfırla.
      quantities.value = {};
    }
  },
);

const supportsQuantity = (action: AvailableAction) => {
  return !!action.pointsGain || !!action.pointsCost;
};

const getMaxQuantity = (action: AvailableAction) => {
  if (!supportsQuantity(action)) return 1;
  if (action.pointsCost && data.value) {
    const affordable = Math.floor(data.value.customer.points / action.pointsCost);
    return Math.max(1, Math.min(50, affordable));
  }
  return 50;
};

const getQuantity = (action: AvailableAction) => {
  const current = quantities.value[action.type] ?? 1;
  const max = getMaxQuantity(action);
  return Math.min(Math.max(current, 1), max);
};

const setQuantity = (action: AvailableAction, next: number) => {
  const max = getMaxQuantity(action);
  quantities.value[action.type] = Math.min(Math.max(next, 1), max);
};

const increaseQuantity = (action: AvailableAction) => {
  setQuantity(action, getQuantity(action) + 1);
};

const decreaseQuantity = (action: AvailableAction) => {
  setQuantity(action, getQuantity(action) - 1);
};

const onQuantityInput = (action: AvailableAction, event: Event) => {
  const target = event.target as HTMLInputElement;
  const parsed = Number(target.value);
  setQuantity(action, Number.isFinite(parsed) ? parsed : 1);
};

const emitAction = (action: AvailableAction) => {
  emit('selectAction', {
    action,
    quantity: supportsQuantity(action) ? getQuantity(action) : 1,
  });
};

const actionClasses = (action: AvailableAction) => {
  if (action.isRecommended) {
    return 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400';
  }
  if (action.discountPercent) {
    return 'border-sky-500/50 bg-sky-500/5 hover:border-sky-400';
  }
  if (action.pointsCost) {
    return 'border-amber-500/40 bg-amber-500/5 hover:border-amber-400';
  }
  if (action.pointsGain) {
    return 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400';
  }
  return 'border-slate-700 bg-slate-900/70 hover:border-slate-500';
};
</script>


