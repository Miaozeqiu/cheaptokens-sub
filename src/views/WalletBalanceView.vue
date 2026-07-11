<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()
const withdrawalPage = ref(1)
const withdrawalPageSize = ref(10)
const showCreateDialog = ref(false)
const showWithdrawalHistoryDialog = ref(false)
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
            <p>提交提现申请后，可在此查看审批进度。</p>
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
</style>
