<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'
import WithdrawContactPrompt from '../components/WithdrawContactPrompt.vue'

const app = useSubApp()
const withdrawalPage = ref(1)
const withdrawalPageSize = ref(10)
const showCreateDialog = ref(false)
const showWithdrawalHistoryDialog = ref(false)
const showContactPrompt = ref(false)
const createForm = reactive({
  amount: 0,
  remark: '',
})

const withdrawalTotalPages = computed(() =>
  Math.max(1, Math.ceil(Number(app.withdrawalTotal.value || 0) / Number(withdrawalPageSize.value || 10))),
)

const hasPaymentMethod = computed(() => {
  const p = app.payoutSettings.value || {}
  const hasWechat = Boolean(p.wechat_account?.trim()) || Boolean(p.wechat_qr_code_proxy_path?.trim())
  const hasAlipay = Boolean(p.alipay_account?.trim()) || Boolean(p.alipay_qr_code_proxy_path?.trim())
  return hasWechat || hasAlipay
})

function formatTableTime(value) {
  const text = app.formatDateTime(value)
  if (!text || text === '--') return '--'
  return text.replace(/:\d{2}$/, '')
}

function statusText(status) {
  switch (status) {
    case 'pending':
      return '待审核'
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已驳回'
    default:
      return status
  }
}

function setMessage(text, type = 'info') {
  showToast(text, type)
}

function openCreateDialog() {
  createForm.amount = 0
  createForm.remark = ''
  setMessage('', 'info')
  showCreateDialog.value = true
}

function closeCreateDialog() {
  if (app.withdrawalLoading.value) return
  showCreateDialog.value = false
}

function openWithdrawalHistoryDialog() {
  showWithdrawalHistoryDialog.value = true
}

function closeWithdrawalHistoryDialog() {
  if (app.withdrawalLoading.value) return
  showWithdrawalHistoryDialog.value = false
}

function fillAllAmount() {
  createForm.amount = Number(Number(app.wallet.value?.balance || 0).toFixed(2))
}

async function handleSubmit() {
  const amount = Number(createForm.amount)
  const remark = String(createForm.remark || '').trim()
  if (!amount || amount <= 0) {
    setMessage('请输入有效的提现金额', 'error')
    return
  }
  if (amount > Number(app.wallet.value?.balance || 0)) {
    setMessage('提现金额不能超过当前余额', 'error')
    return
  }
  if (!remark) {
    setMessage('请填写提现备注', 'error')
    return
  }
  setMessage('', 'info')
  const result = await app.createWithdrawalRequest(amount, remark)
  if (result.ok) {
    showCreateDialog.value = false
    if (result.require_contact_main_for_withdraw) {
      showContactPrompt.value = true
      return
    }
    setMessage(result.message || '提现申请已提交', 'success')
    return
  }
  setMessage(result.message || '提交失败', 'error')
}

async function handleWithdrawalPageChange(page) {
  if (page < 1 || page > withdrawalTotalPages.value || page === withdrawalPage.value) return
  withdrawalPage.value = page
  await app.fetchWithdrawalRequests(page, withdrawalPageSize.value)
}

onMounted(async () => {
  await Promise.all([
    app.fetchWallet(),
    app.fetchWithdrawalRequests(withdrawalPage.value, withdrawalPageSize.value),
    app.fetchPayoutSettings(),
  ])
})
</script>

<template>
  <div class="wallet-balance-page">
    <h2 class="wallet-title">钱包余额</h2>
    <p class="wallet-line">
      <span class="wallet-value">
        {{ app.walletLoading.value ? '加载中...' : app.formatMoney(app.wallet.value?.balance) }}
      </span>
    </p>
    <button
      v-if="hasPaymentMethod"
      type="button"
      class="wallet-action"
      @click="openCreateDialog"
    >
      提现
    </button>
    <RouterLink
      v-else
      to="/app/me/payout-settings"
      class="payout-hint"
    >
      填写收款方式 ›
    </RouterLink>
    <button type="button" class="wallet-history" @click="openWithdrawalHistoryDialog">
      记录
    </button>
    <Transition name="wallet-dialog">
      <div v-if="showCreateDialog" class="dialog-overlay" @mousedown.self="closeCreateDialog">
        <div class="dialog-card">
        <div class="dialog-header">
          <div class="wallet-create-header-actions">
            <button type="button" class="dialog-close-icon" :disabled="app.withdrawalLoading.value" @click="closeCreateDialog">
              <svg viewBox="0 0 1024 1024" aria-hidden="true">
                <path d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z" fill="currentColor"></path>
              </svg>
            </button>
            <button
              type="submit"
              form="wallet-create-form"
              class="primary-button wallet-create-submit"
              :disabled="app.withdrawalLoading.value"
            >
              {{ app.withdrawalLoading.value ? '提交中...' : '确认申请' }}
            </button>
          </div>
        </div>

          <form id="wallet-create-form" class="form-grid" @submit.prevent="handleSubmit">
            <label>
              <span class="wallet-field-head">
                <span>提现金额</span>
                <button type="button" class="wallet-fill-all" @click="fillAllAmount">全部提现</button>
              </span>
              <input v-model.number="createForm.amount" type="number" min="0.01" step="0.01" placeholder="请输入提现金额" required />
            </label>
            <label>
              <span>备注</span>
              <input v-model.trim="createForm.remark" type="text" maxlength="200" placeholder="请填写提现备注" required />
            </label>

            <p class="wallet-dialog-hint">当前余额：{{ app.formatMoney(app.wallet.value?.balance) }}</p>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="wallet-dialog">
      <div v-if="showWithdrawalHistoryDialog" class="dialog-overlay" @mousedown.self="closeWithdrawalHistoryDialog">
        <div class="dialog-card dialog-card--wide">
        <div class="dialog-header wallet-history-header">
          <button type="button" class="dialog-close-icon" :disabled="app.withdrawalLoading.value" @click="closeWithdrawalHistoryDialog">
            <svg viewBox="0 0 1024 1024" aria-hidden="true">
              <path d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z" fill="currentColor"></path>
            </svg>
          </button>
        </div>

        <div class="wallet-table-body">
          <div v-if="app.withdrawalLoading.value && !app.withdrawalRequests.value.length" class="empty-state">
            <h4>正在加载…</h4>
          </div>
          <div v-else-if="!app.withdrawalRequests.value.length" class="empty-state">
            <h4>暂无提现记录</h4>
            <p>提交后由主账户审核；通过后余额转入主账户钱包，可在此查看进度。</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>备注</th>
                  <th>审批备注</th>
                  <th>审批时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in app.withdrawalRequests.value" :key="record.id">
                  <td class="time-text">{{ formatTableTime(record.created_at) }}</td>
                  <td><strong class="amount-cell">{{ app.formatMoney(record.amount) }}</strong></td>
                  <td>
                    <span class="status-pill" :class="record.status">{{ statusText(record.status) }}</span>
                  </td>
                  <td class="muted-text">{{ record.remark || '--' }}</td>
                  <td class="muted-text">{{ record.admin_remark || '--' }}</td>
                  <td class="time-text">{{ record.reviewed_at ? formatTableTime(record.reviewed_at) : '--' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

          <footer v-if="app.withdrawalTotal.value > 0" class="wallet-history-foot">
            <div class="wallet-history-meta">
              <span class="muted-text">第 {{ withdrawalPage }} / {{ withdrawalTotalPages }} 页</span>
              <span class="muted-text">共 {{ app.withdrawalTotal.value }} 条</span>
            </div>
            <div class="wallet-history-actions">
              <button type="button" class="wallet-history-page-button" :disabled="withdrawalPage <= 1 || app.withdrawalLoading.value" @click="handleWithdrawalPageChange(withdrawalPage - 1)">上一页</button>
              <button type="button" class="wallet-history-page-button" :disabled="withdrawalPage >= withdrawalTotalPages || app.withdrawalLoading.value" @click="handleWithdrawalPageChange(withdrawalPage + 1)">下一页</button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>

    <WithdrawContactPrompt :open="showContactPrompt" @close="showContactPrompt = false" />

    <Teleport to="body">
      <a
        class="wallet-qq-entry"
        href="https://qm.qq.com/q/januXhbqfY"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="加入QQ群"
      >
        <svg viewBox="0 0 1024 1024" aria-hidden="true">
          <path d="M511.09761 957.257c-80.159 0-153.737-25.019-201.11-62.386-24.057 6.702-54.831 17.489-74.252 30.864-16.617 11.439-14.546 23.106-11.55 27.816 13.15 20.689 225.583 13.211 286.912 6.767v-3.061z" fill="#FAAD08" />
          <path d="M496.65061 957.257c80.157 0 153.737-25.019 201.11-62.386 24.057 6.702 54.83 17.489 74.253 30.864 16.616 11.439 14.543 23.106 11.55 27.816-13.15 20.689-225.584 13.211-286.914 6.767v-3.061z" fill="#FAAD08" />
          <path d="M497.12861 474.524c131.934-0.876 237.669-25.783 273.497-35.34 8.541-2.28 13.11-6.364 13.11-6.364 0.03-1.172 0.542-20.952 0.542-31.155C784.27761 229.833 701.12561 57.173 496.64061 57.162 292.15661 57.173 209.00061 229.832 209.00061 401.665c0 10.203 0.516 29.983 0.547 31.155 0 0 3.717 3.821 10.529 5.67 33.078 8.98 140.803 35.139 276.08 36.034h0.972z" fill="#000000" />
          <path d="M860.28261 619.782c-8.12-26.086-19.204-56.506-30.427-85.72 0 0-6.456-0.795-9.718 0.148-100.71 29.205-222.773 47.818-315.792 46.695h-0.962C410.88561 582.017 289.65061 563.617 189.27961 534.698 185.44461 533.595 177.87261 534.063 177.87261 534.063 166.64961 563.276 155.56661 593.696 147.44761 619.782 108.72961 744.168 121.27261 795.644 130.82461 796.798c20.496 2.474 79.78-93.637 79.78-93.637 0 97.66 88.324 247.617 290.576 248.996a718.01 718.01 0 0 1 5.367 0C708.80161 950.778 797.12261 800.822 797.12261 703.162c0 0 59.284 96.111 79.783 93.637 9.55-1.154 22.093-52.63-16.623-177.017" fill="#000000" />
          <path d="M434.38261 316.917c-27.9 1.24-51.745-30.106-53.24-69.956-1.518-39.877 19.858-73.207 47.764-74.454 27.875-1.224 51.703 30.109 53.218 69.974 1.527 39.877-19.853 73.2-47.742 74.436m206.67-69.956c-1.494 39.85-25.34 71.194-53.24 69.956-27.888-1.238-49.269-34.559-47.742-74.435 1.513-39.868 25.341-71.201 53.216-69.974 27.909 1.247 49.285 34.576 47.767 74.453" fill="#FFFFFF" />
          <path d="M683.94261 368.627c-7.323-17.609-81.062-37.227-172.353-37.227h-0.98c-91.29 0-165.031 19.618-172.352 37.227a6.244 6.244 0 0 0-0.535 2.505c0 1.269 0.393 2.414 1.006 3.386 6.168 9.765 88.054 58.018 171.882 58.018h0.98c83.827 0 165.71-48.25 171.881-58.016a6.352 6.352 0 0 0 1.002-3.395c0-0.897-0.2-1.736-0.531-2.498" fill="#FAAD08" />
          <path d="M467.63161 256.377c1.26 15.886-7.377 30-19.266 31.542-11.907 1.544-22.569-10.083-23.836-25.978-1.243-15.895 7.381-30.008 19.25-31.538 11.927-1.549 22.607 10.088 23.852 25.974m73.097 7.935c2.533-4.118 19.827-25.77 55.62-17.886 9.401 2.07 13.75 5.116 14.668 6.316 1.355 1.77 1.726 4.29 0.352 7.684-2.722 6.725-8.338 6.542-11.454 5.226-2.01-0.85-26.94-15.889-49.905 6.553-1.579 1.545-4.405 2.074-7.085 0.242-2.678-1.834-3.786-5.553-2.196-8.135" fill="#000000" />
          <path d="M504.33261 584.495h-0.967c-63.568 0.752-140.646-7.504-215.286-21.92-6.391 36.262-10.25 81.838-6.936 136.196 8.37 137.384 91.62 223.736 220.118 224.996H506.48461c128.498-1.26 211.748-87.612 220.12-224.996 3.314-54.362-0.547-99.938-6.94-136.203-74.654 14.423-151.745 22.684-215.332 21.927" fill="#FFFFFF" />
          <path d="M323.27461 577.016v137.468s64.957 12.705 130.031 3.91V591.59c-41.225-2.262-85.688-7.304-130.031-14.574" fill="#EB1C26" />
          <path d="M788.09761 432.536s-121.98 40.387-283.743 41.539h-0.962c-161.497-1.147-283.328-41.401-283.744-41.539l-40.854 106.952c102.186 32.31 228.837 53.135 324.598 51.926l0.96-0.002c95.768 1.216 222.4-19.61 324.6-51.924l-40.855-106.952z" fill="#EB1C26" />
        </svg>
      </a>
    </Teleport>
  </div>
</template>

<style scoped>
.wallet-balance-page {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  min-height: calc(100vh - 160px);
  text-align: center;
}

.wallet-dialog-enter-active,
.wallet-dialog-leave-active {
  transition: opacity 0.22s ease;
}

.wallet-dialog-enter-active .dialog-card,
.wallet-dialog-leave-active .dialog-card {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.wallet-dialog-enter-from,
.wallet-dialog-leave-to {
  opacity: 0;
}

.wallet-dialog-enter-from .dialog-card,
.wallet-dialog-leave-to .dialog-card {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.wallet-title {
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--text-secondary);
}

.wallet-line {
  margin: 0;
  color: #475467;
  font-size: 64px;
  font-weight: 400;
  line-height: 1.2;
}

.wallet-value {
  font-size: 64px;
  font-weight: 400;
  letter-spacing: 0;
  color: #475467;
}

.wallet-action {
  min-width: 120px;
  min-height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #eaecf0;
  color: #475467;
  font-size: 13px;
  font-weight: 400;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.wallet-action:hover {
  background: #dfe3e8;
  color: #344054;
}

.wallet-history {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 400;
}

.wallet-history:hover {
  color: var(--text-primary);
}

.payout-hint {
  justify-self: center;
  margin: 0;
  padding: 10px 16px;
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 400;
  color: hsl(19, 69.9%, 40.4%);
  background: hsla(19, 69.9%, 40.4%, 0.1);
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.15s ease;
}

.payout-hint:hover {
  background: hsla(19, 69.9%, 40.4%, 0.16);
}

.wallet-message {
  margin: 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
}

.wallet-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.wallet-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.wallet-dialog-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: right;
  justify-self: end;
}

#wallet-create-form label {
  justify-items: start;
  text-align: left;
}

#wallet-create-form label > span {
  width: 100%;
  text-align: left;
  font-weight: 400;
}

.wallet-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wallet-fill-all {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  font-weight: 400;
  box-shadow: none;
}

.wallet-fill-all:hover:not(:disabled) {
  background: transparent;
  color: var(--accent-hover);
  transform: none;
  box-shadow: none;
}

#wallet-create-form input {
  box-shadow: none;
}

#wallet-create-form input:focus {
  box-shadow: none;
}

#wallet-create-form input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

#wallet-create-form input[type='number']::-webkit-outer-spin-button,
#wallet-create-form input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.wallet-create-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.wallet-create-submit {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #2783de;
  box-shadow: none;
  font-weight: 400;
}

.wallet-create-submit:hover:not(:disabled) {
  background: #1f72c6;
  transform: none;
  box-shadow: none;
}

.dialog-card--wide {
  width: min(100%, 980px);
}

.wallet-table-body {
  max-height: min(60vh, 520px);
  margin-top: 4px;
  overflow: auto;
}

.wallet-table-body .table-wrap {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.wallet-history-header {
  justify-content: flex-start;
}

.wallet-history-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 12px;
}

.wallet-history-meta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.wallet-history-actions {
  display: inline-flex;
  gap: 8px;
}

.wallet-history-page-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2783de;
  font-size: 13px;
  font-weight: 400;
  box-shadow: none;
}

.wallet-history-page-button:hover:not(:disabled) {
  background: transparent;
  color: #1f72c6;
  transform: none;
  box-shadow: none;
}

.wallet-history-page-button:disabled {
  color: var(--text-tertiary);
}

.muted-text,
.time-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.amount-cell {
  font-variant-numeric: tabular-nums;
  color: #0284c7;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-pill.pending {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.status-pill.approved {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.status-pill.rejected {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.wallet-qq-entry {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 40;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow:
    0 8px 22px rgba(15, 23, 42, 0.12),
    0 1px 3px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(10px);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.wallet-qq-entry svg {
  width: 36px;
  height: 36px;
}

.wallet-qq-entry:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.16),
    0 2px 6px rgba(15, 23, 42, 0.08);
}

.wallet-qq-entry:active {
  transform: scale(0.96);
}
</style>
