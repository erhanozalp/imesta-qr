<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#1E1618] shadow-2xl"
    >
      <!-- BAŞLIK: avatar + isim -->
      <header class="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5">
        <div
          v-if="data"
          class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#773030] text-[15px] font-semibold text-[#F6E9E9]"
        >{{ initial }}</div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[16px] font-semibold leading-tight text-[#F3EAEA]">
            {{ data ? (data.customer.name || 'İsimsiz Müşteri') : 'Müşteri' }}
          </p>
          <p v-if="data" class="truncate text-xs text-[#A89597]">{{ data.customer.email }}</p>
        </div>
        <button
          type="button"
          aria-label="Kapat"
          class="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#9A8A8A] transition hover:bg-white/[0.06] hover:text-[#F3EAEA]"
          @click="emit('close')"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" /></svg>
        </button>
      </header>

      <section class="max-h-[80vh] overflow-y-auto px-5 py-4">
        <div v-if="loading" class="py-12 text-center text-sm text-[#A89597]">
          <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#CE8181]" />
          Müşteri bilgileri yükleniyor...
        </div>

        <div v-else-if="data" class="space-y-3.5">
          <!-- MÜŞTERİ KARTI: rütbe/rozet + puan + ilerleme + bugün -->
          <div class="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3.5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-wrap gap-1.5 pt-0.5">
                <span
                  v-if="data.rank"
                  class="rounded-full bg-[#773030]/50 px-2.5 py-1 text-[11px] font-semibold text-[#E6B8B8]"
                >{{ data.rank.title }}</span>
                <span
                  v-if="isStudent"
                  class="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#C9BABA]"
                >Öğrenci</span>
                <span
                  v-if="isPartner"
                  class="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#C9BABA]"
                >İşbirlikçi</span>
              </div>
              <div class="flex-none text-right">
                <p class="text-[30px] font-bold leading-none text-[#CE8181]">{{ data.customer.points }}</p>
                <p class="mt-0.5 text-[10px] uppercase tracking-wider text-[#A89597]">puan</p>
              </div>
            </div>

            <!-- İlerleme: ⭐⭐⭐☆☆ 3/5 · bedava hak -->
            <div v-if="rewardCost" class="mt-3 flex items-center justify-between rounded-xl bg-black/25 px-3 py-2">
              <div class="flex items-center gap-1 text-[15px] leading-none">
                <template v-if="rewardCost <= 10">
                  <span v-for="i in rewardCost" :key="i" :class="i <= progressPoints ? '' : 'opacity-30'">{{ i <= progressPoints ? '⭐' : '☆' }}</span>
                </template>
                <span class="ml-1.5 text-xs font-semibold text-[#C9BABA]">{{ progressPoints }} / {{ rewardCost }}</span>
              </div>
              <span
                class="flex items-center gap-1.5 text-xs font-semibold"
                :class="freeCoffees > 0 ? 'text-[#E0B15E]' : 'text-[#A89597]'"
              >
                ☕ {{ freeCoffees > 0 ? `${freeCoffees} bedava hak` : 'bedava hak yok' }}
              </span>
            </div>

            <!-- Bugünkü işlem durumu -->
            <div
              v-if="todayVisit"
              class="mt-2 rounded-xl px-3 py-2 text-xs font-medium"
              :class="todayVisit.grantCount > 0
                ? 'border border-[#E0B15E]/35 bg-[#E0B15E]/10 text-[#E7C185]'
                : 'text-[#8DB49B]'"
            >
              <template v-if="todayVisit.grantCount > 0">
                ⚠ Bu müşteriye bugün <b>{{ todayVisit.grantCount }} kez</b> puan verildi
                (+{{ todayVisit.pointsToday }} puan<span v-if="lastGrantTime">, son {{ lastGrantTime }}</span>)
              </template>
              <template v-else>✓ Bugün henüz işlem yapılmamış</template>
            </div>
          </div>

          <!-- KAMPANYA (Happy Hour vb.) — admin'den otomatik gelir, öne çıkar -->
          <div v-if="campaignActions.length" class="space-y-2">
            <p class="flex items-center gap-2 text-xs font-semibold text-[#C9BABA]">
              Kampanya
              <span class="rounded-full bg-[#E8894A]/15 px-2 py-0.5 text-[10px] font-semibold text-[#F2A868]">şimdi geçerli</span>
            </p>
            <button
              v-for="a in campaignActions"
              :key="`${a.type}-${a.campaignId}`"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-[#E8894A]/55 bg-[#E8894A]/[0.12] px-3.5 py-3 text-left transition hover:bg-[#E8894A]/20 active:scale-[0.99]"
              @click="emitAction(a, 1)"
            >
              <span class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#E8894A]/20 text-[#F2A868]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-bold text-[#F4C4A0]">{{ a.label }}</span>
                <span v-if="a.description" class="block truncate text-[11px] text-[#C9A98F]">{{ a.description }}</span>
              </span>
              <svg viewBox="0 0 20 20" class="h-5 w-5 flex-none text-[#E8894A]" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </div>

          <!-- PUAN VER: tek tık +1..+5 -->
          <div v-if="grantAction" class="space-y-2">
            <p class="text-xs font-semibold text-[#C9BABA]">Puan ver <span class="font-normal text-[#7E6E6E]">· tek tık</span></p>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="h-14 rounded-2xl text-[19px] font-bold transition active:scale-95"
                :class="n === 1
                  ? 'border border-[#9A4B4B] bg-[#7C3434] text-[#F6E4E4] hover:bg-[#8A3B3B]'
                  : 'border border-[#9A4B4B]/55 bg-[#7C3434]/30 text-[#E3AFAF] hover:bg-[#7C3434]/45'"
                @click="grantQuick(n)"
              >
                +{{ n }}
              </button>
            </div>
          </div>

          <!-- ÖDÜL KULLAN: bedava kahve -->
          <div v-if="redeemAction" class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-[#C9BABA]">Bedava kahve</p>
              <div v-if="freeCoffees > 1" class="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  class="h-6 w-6 rounded-lg border border-white/12 text-[#E3D6D6] transition hover:bg-white/[0.06] disabled:opacity-40"
                  :disabled="redeemQty <= 1"
                  @click="redeemQty--"
                >−</button>
                <span class="w-6 text-center font-semibold text-[#F3EAEA]">{{ redeemQty }}</span>
                <button
                  type="button"
                  class="h-6 w-6 rounded-lg border border-white/12 text-[#E3D6D6] transition hover:bg-white/[0.06] disabled:opacity-40"
                  :disabled="redeemQty >= maxRedeem"
                  @click="redeemQty++"
                >+</button>
              </div>
            </div>
            <button
              type="button"
              class="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#E0B15E]/50 bg-[#E0B15E]/[0.12] text-[15px] font-bold text-[#EAC079] transition hover:bg-[#E0B15E]/20 active:scale-[0.99]"
              @click="redeem"
            >
              ☕ {{ redeemQty }} bedava kahve kullan
            </button>
          </div>

          <!-- DOĞUM GÜNÜ / KAMPANYA HEDİYELERİ -->
          <div v-if="giftActions.length" class="space-y-2">
            <p class="text-xs font-semibold text-[#C9BABA]">Hediye</p>
            <button
              v-for="a in giftActions"
              :key="a.type"
              type="button"
              class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#B8536E]/45 bg-[#B8536E]/[0.14] text-sm font-semibold text-[#E6A0B8] transition hover:bg-[#B8536E]/[0.22] active:scale-[0.99]"
              @click="emitAction(a, 1)"
            >
              🎂 {{ a.label.replace(/^🎂\s*/, '') }}
            </button>
          </div>

          <!-- İNDİRİMLER (öğrenci / işbirlikçi) -->
          <div v-if="discountActions.length" class="space-y-2">
            <p class="text-xs font-semibold text-[#C9BABA]">İndirim</p>
            <button
              v-for="a in discountActions"
              :key="a.type"
              type="button"
              class="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-[#D3C4C4] transition hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.99]"
              @click="emitAction(a, 1)"
            >
              {{ a.label }}
            </button>
          </div>

          <!-- İPTAL -->
          <button
            type="button"
            class="h-11 w-full rounded-2xl border border-white/[0.12] text-sm font-medium text-[#A89597] transition hover:border-white/25 hover:text-[#F3EAEA]"
            @click="emit('close')"
          >
            İptal
          </button>
        </div>

        <div v-else class="py-10 text-center text-xs text-[#A89597]">
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

const initial = computed(() => {
  const n = data.value?.customer.name?.trim();
  return n ? n.charAt(0).toUpperCase() : 'M';
});

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
// Kampanya indirimleri (Happy Hour vb.) — kendi öne çıkan alanında gösterilir
const campaignActions = computed(
  () => data.value?.availableActions.filter((a) => a.type === 'CAMPAIGN_DISCOUNT') ?? [],
);
// Sıradan indirimler (öğrenci / işbirlikçi) — kampanya HARİÇ
const discountActions = computed(
  () =>
    data.value?.availableActions.filter(
      (a) => a.type.endsWith('_DISCOUNT') && a.type !== 'CAMPAIGN_DISCOUNT',
    ) ?? [],
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
