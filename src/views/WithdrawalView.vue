<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()
const currentPage = ref(1)
const pageSize = ref(10)
const showCreateDialog = ref(false)
const createForm = reactive({
  amount: 0,
  remark: '',
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(Number(app.withdrawalTotal.value || 0) / pageSize.value)),
)

function setMessage(text, type = 'info') {
  showToast(text, type)
}

function statusText(status) {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已驳回'
    default: return status
  }
}

function formatTableTime(value) {
  const text = app.formatDateTime(value)
  if (!text || text === '--') return '--'
  return text.replace(/:\d{2}$/, '')
}

async function handlePageChange(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  await app.fetchWithdrawalRequests(page, pageSize.value)
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
  } else {
    setMessage(result.message || '提交失败', 'error')
  }
}

onMounted(async () => {
  await Promise.all([
    app.fetchWallet(),
    app.fetchWithdrawalRequests(currentPage.value, pageSize.value),
  ])
})
</script>

<template>
  <div class="withdrawal-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">提现</h2>
        <p class="page-subtitle">申请提取你的收益余额，提交后等待主账户审批。</p>
      </div>
      <button type="button" class="primary-button" @click="openCreateDialog">申请提现</button>
    </div>

    <div class="balance-banner app-shell-card">
      <div class="balance-copy">
        <span class="balance-label">当前可用余额</span>
        <span class="balance-value">{{ app.formatMoney(app.wallet.value?.balance) }}</span>
      </div>
      <span class="balance-note">审批通过后会从子账户余额中扣减</span>
    </div>

    <article class="page-card">
      <div class="page-card__body">
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
                  <span class="pill status-pill" :class="record.status">{{ statusText(record.status) }}</span>
                </td>
                <td class="muted-text">{{ record.remark || '--' }}</td>
                <td class="muted-text">{{ record.admin_remark || '--' }}</td>
                <td class="time-text">{{ record.reviewed_at ? formatTableTime(record.reviewed_at) : '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="app.withdrawalTotal.value > 0" class="list-foot">
          <span class="page-meta">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <div class="foot-actions">
            <button type="button" class="secondary-button" :disabled="currentPage <= 1 || app.withdrawalLoading.value" @click="handlePageChange(currentPage - 1)">上一页</button>
            <button type="button" class="secondary-button" :disabled="currentPage >= totalPages || app.withdrawalLoading.value" @click="handlePageChange(currentPage + 1)">下一页</button>
          </div>
        </footer>
      </div>
    </article>

    <div v-if="showCreateDialog" class="dialog-overlay" @mousedown.self="closeCreateDialog">
      <div class="dialog-card">
        <div class="dialog-header">
          <div>
            <h3>申请提现</h3>
            <p class="dialog-subtitle">提交后将等待主账户审批，审批通过后余额将扣减。</p>
          </div>
          <button type="button" class="dialog-close-icon" :disabled="app.withdrawalLoading.value" @click="closeCreateDialog">
            <svg viewBox="0 0 1024 1024" aria-hidden="true">
              <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <label>
            <span>提现金额</span>
            <input v-model.number="createForm.amount" type="number" min="0.01" step="0.01" placeholder="请输入提现金额" required />
          </label>
          <label>
            <span>备注</span>
            <input v-model.trim="createForm.remark" type="text" maxlength="200" placeholder="请填写提现备注" required />
          </label>
          <p class="hint-text">当前余额：{{ app.formatMoney(app.wallet.value?.balance) }}</p>

          <div class="dialog-actions">
            <button type="button" class="secondary-button" :disabled="app.withdrawalLoading.value" @click="closeCreateDialog">取消</button>
            <button type="submit" class="primary-button" :disabled="app.withdrawalLoading.value">
              {{ app.withdrawalLoading.value ? '提交中...' : '确认申请' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.withdrawal-page {
  display: grid;
  gap: 18px;
  max-width: 1120px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.03em;
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.balance-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
}

.balance-copy {
  display: grid;
  gap: 8px;
}

.balance-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.balance-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.04em;
}

.balance-note,
.page-meta,
.muted-text,
.time-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.amount-cell {
  color: var(--accent);
}

.status-pill.pending {
  background: var(--warning-soft);
  color: var(--warning);
}

.status-pill.approved {
  background: var(--success-soft);
  color: var(--success);
}

.status-pill.rejected {
  background: var(--danger-soft);
  color: var(--danger);
}

.list-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.foot-actions {
  display: inline-flex;
  gap: 8px;
}

.hint-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
