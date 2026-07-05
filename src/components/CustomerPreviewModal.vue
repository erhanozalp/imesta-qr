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
          Müşteri
        </h3>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <section class="max-h-[80vh] overflow-y-auto px-5 py-4 text-sm text-slate-100">
        <div v-if="loading" class="py-10 text-center text-slate-400">
          <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          Müşteri bilgileri yükleniyor...
        </div>

        <div v-else-if="data" class="space-y-3">
          <!-- MÜŞTERİ KARTI -->
          <div class="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-lg font-bold text-slate-50">
                  {{ data.customer.name || 'İsimsiz Müşteri' }}
                </p>
                <div class="mt-1 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  <span
                    v-if="isStudent"
                    class="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-300"
                  >🎓 Öğrenci</span>
                  <span
                    v-if="isPartner"
                    class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300"
                  >🤝 İşbirlikçi</span>
                  <span
                    v-if="data.rank"
                    class="rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-2 py-0.5 font-semibold text-slate-950"
                  >{{ data.rank.title }}</span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase tracking-wide text-slate-400">Puan</p>
                <p class="text-2xl font-extrabold leading-none text-emerald-300">{{ data.customer.points }}</p>
              </div>
            </div>

            <!-- İlerleme: ⭐⭐⭐☆☆ 3/5 -->
            <div v-if="rewardCost" class="mt-3 flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
              <div class="flex items-center gap-1 text-base leading-none">
                <template v-if="rewardCost <= 10">
                  <span v-for="i in rewardCost" :key="i">{{ i <= progressPoints ? '⭐' : '☆' }}</span>
                </template>
                <span class="ml-1 text-xs font-semibold text-slate-300">{{ progressPoints }}/{{ rewardCost }}</span>
              </div>
              <span
                class="text-xs font-semibold"
                :class="freeCoffees > 0 ? 'text-amber-300' : 'text-slate-400'"
              >
                ☕ {{ freeCoffees > 0 ? `${freeCoffees} bedava hak` : 'bedava hak yok' }}
              </span>
            </div>

            <!-- Bugünkü işlem durumu (#12) -->
            <div
              v-if="todayVisit"
              class="mt-2 rounded-lg px-3 py-2 text-xs font-medium"
              :class="todayVisit.grantCount > 0
                ? 'border border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'bg-slate-900 text-slate-400'"
            >
              <template v-if="todayVisit.grantCount > 0">
                ⚠️ Bu müşteriye bugün <b>{{ todayVisit.grantCount }} kez</b> puan verildi
                (+{{ todayVisit.pointsToday }} puan<span v-if="lastGrantTime">, son {{ lastGrantTime }}</span>)
              </template>
              <template v-else>✓ Bugün işlem yapılmamış</template>
            </div>

            <!-- Aktif kampanyalar (#13) -->
            <div v-if="campaigns.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="c in campaigns"
                :key="c.id"
                class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                :class="c.isApplicableNow
                  ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                  : 'border border-slate-700 bg-slate-900 text-slate-400'"
                :title="c.description || c.name"
              >
                🎉 {{ c.name }} · {{ c.summary }}<span v-if="!c.isApplicableNow"> (şu an değil)</span>
              </span>
            </div>
          </div>

          <!-- PUAN VER: tek tık +1..+5 -->
          <div v-if="grantAction" class="space-y-1.5">
            <p class="text-xs font-medium text-slate-300">➕ Puan Ver <span class="text-slate-500">(tek tık)</span></p>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="h-14 rounded-xl border border-emerald-500/40 bg-emerald-500/5 text-lg font-bold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/15 active:scale-95"
                @click="grantQuick(n)"
              >
                +{{ n }}
              </button>
            </div>
          </div>

          <!-- ÖDÜL KULLAN -->
          <div v-if="redeemAction" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-slate-300">☕ Bedava Kahve</p>
              <div v-if="freeCoffees > 1" class="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  class="h-6 w-6 rounded border border-slate-700 text-slate-200 disabled:opacity-40"
                  :disabled="redeemQty <= 1"
                  @click="redeemQty--"
                >−</button>
                <span class="w-6 text-center font-semibold text-slate-100">{{ redeemQty }}</span>
                <button
                  type="button"
                  class="h-6 w-6 rounded border border-slate-700 text-slate-200 disabled:opacity-40"
                  :disabled="redeemQty >= maxRedeem"
                  @click="redeemQty++"
                >+</button>
              </div>
            </div>
            <button
              type="button"
              class="h-14 w-full rounded-xl border border-amber-500/50 bg-amber-500/10 text-base font-bold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20 active:scale-95"
              @click="redeem"
            >
              ☕ {{ redeemQty }} Bedava Kahve Kullan
            </button>
          </div>

          <!-- İNDİRİMLER -->
          <div v-if="discountActions.length" class="space-y-1.5">
            <p class="text-xs font-medium text-slate-300">💸 İndirim</p>
            <button
              v-for="a in discountActions"
              :key="a.type"
              type="button"
              class="h-12 w-full rounded-xl border border-sky-500/40 bg-sky-500/5 text-sm font-semibold text-sky-200 transition hover:border-sky-400 hover:bg-sky-500/15 active:scale-95"
              @click="emitAction(a, 1)"
            >
              {{ a.icon }} {{ a.label }}
            </button>
          </div>

          <!-- KAMPANYA HEDİYELERİ (D1) — doğum günü vb. -->
          <div v-if="giftActions.length" class="space-y-1.5">
            <p class="text-xs font-medium text-slate-300">🎁 Kampanya</p>
            <button
              v-for="a in giftActions"
              :key="a.type"
              type="button"
              class="h-12 w-full rounded-xl border border-pink-500/40 bg-pink-500/5 text-sm font-semibold text-pink-200 transition hover:border-pink-400 hover:bg-pink-500/15 active:scale-95"
              @click="emitAction(a, 1)"
            >
              {{ a.icon }} {{ a.label }}
            </button>
          </div>

          <!-- İPTAL -->
          <button
            type="button"
            class="h-11 w-full rounded-xl border border-slate-700 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            @click="emit('close')"
          >
            İptal
          </button>
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
  campaignId?: string; // D1: kampanya aksiyonları (CAMPAIGN_DISCOUNT / BIRTHDAY_GIFT)
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
    pointsForReward?: number;
    freeCoffeesAvailable: number;
    hasStudentDiscount: boolean;
    hasPartnerDiscount: boolean;
    studentDiscountPercent: number;
    partnerDiscountPercent: number;
  };
  todayVisit?: {
    visitedToday: boolean;
    grantCount: number;
    pointsToday: number;
    lastGrantAt: string | null;
  };
  activeCampaigns?: Array<{
    id: string;
    name: string;
    type: string;
    description: string | null;
    summary: string;
    isApplicableNow: boolean;
  }>;
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

const isStudent = computed(
  () => data.value?.customerType === 'STUDENT' || data.value?.customerType === 'STUDENT_PARTNER',
);
const isPartner = computed(
  () => data.value?.customerType === 'PARTNER' || data.value?.customerType === 'STUDENT_PARTNER',
);

// Aksiyon grupları (tipe göre — mevcut backend action tipleriyle birebir uyumlu)
const grantAction = computed(
  () => data.value?.availableActions.find((a) => a.type.endsWith('GRANT_POINT')) ?? null,
);
const redeemAction = computed(
  () => data.value?.availableActions.find((a) => a.type.endsWith('REDEEM_REWARD')) ?? null,
);
const discountActions = computed(
  () => data.value?.availableActions.filter((a) => a.type.endsWith('_DISCOUNT')) ?? [],
);
// D1: kampanya hediyeleri (doğum günü vb. — grant/redeem/discount grubuna girmez)
const giftActions = computed(
  () => data.value?.availableActions.filter((a) => a.type === 'BIRTHDAY_GIFT') ?? [],
);

// İlerleme: puan % ödül maliyeti (eski backend pointsForReward göndermez -> redeem aksiyonundaki pointsCost'a düş)
const rewardCost = computed(
  () => data.value?.summary.pointsForReward ?? redeemAction.value?.pointsCost ?? 0,
);
const progressPoints = computed(() =>
  rewardCost.value > 0 && data.value ? data.value.customer.points % rewardCost.value : 0,
);
const freeCoffees = computed(() => data.value?.summary.freeCoffeesAvailable ?? 0);
const maxRedeem = computed(() => Math.min(freeCoffees.value, 10));

const todayVisit = computed(() => data.value?.todayVisit ?? null);
const lastGrantTime = computed(() => {
  const at = todayVisit.value?.lastGrantAt;
  if (!at) return null;
  return new Date(at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
});
const campaigns = computed(() => data.value?.activeCampaigns ?? []);

// Ödül adedi (birden fazla hak varsa)
const redeemQty = ref(1);
watch(
  () => props.visible,
  (visible) => {
    if (visible) redeemQty.value = 1; // her yeni müşteri açılışında sıfırla (yanlış adet riski)
  },
);

const emitAction = (action: AvailableAction, quantity: number) => {
  emit('selectAction', { action, quantity });
};

const grantQuick = (n: number) => {
  if (grantAction.value) emitAction(grantAction.value, n);
};

const redeem = () => {
  if (redeemAction.value) emitAction(redeemAction.value, redeemQty.value);
};
</script>
