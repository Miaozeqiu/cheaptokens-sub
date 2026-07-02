<script setup>
import { onMounted, ref, computed, reactive } from 'vue'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()

const currentPage = ref(1)
const pageSize = ref(10)

const showCreateDialog = ref(false)
const createForm = reactive({
  amount: 0,
  remark: '',
})
const apiMessage = ref('')
const apiMessageType = ref('info')

const totalPages = computed(() => {
  return Math.ceil(Number(app.withdrawalTotal.value) / pageSize.value) || 1
})

const columns = [
  { title: '申请时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '审批备注', dataIndex: 'admin_remark', key: 'admin_remark', ellipsis: true },
  { title: '审批时间', dataIndex: 'reviewed_at', key: 'reviewed_at', width: 180 },
]

function setMessage(text, type = 'info') {
  apiMessage.value = text
  apiMessageType.value = type
}

function statusText(status) {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已驳回'
    default: return status
  }
}

function statusColor(status) {
  switch (status) {
    case 'pending': return 'orange'
    case 'approved': return 'green'
    case 'rejected': return 'red'
    default: return 'default'
  }
}

async function handlePageChange(page) {
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
  if (!amount || amount <= 0) {
    setMessage('请输入有效的提现金额', 'error')
    return
  }
  if (amount > Number(app.wallet.value?.balance || 0)) {
    setMessage('提现金额不能超过当前余额', 'error')
    return
  }
  setMessage('', 'info')
  const result = await app.createWithdrawalRequest(amount, createForm.remark)
  if (result.ok) {
    showCreateDialog.value = false
    setMessage(result.message || '提现申请已提交', 'success')
  } else {
    setMessage(result.message || '提交失败', 'error')
  }
}

onMounted(() => {
  app.fetchWithdrawalRequests(currentPage.value, pageSize.value)
})
</script>

<template>
  <div class="withdrawal-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">提现</h2>
        <p class="page-subtitle">申请提取你的收益余额，提交后等待主账户审批。</p>
      </div>
      <div class="page-actions">
        <button type="button" class="primary-button" @click="openCreateDialog">申请提现</button>
      </div>
    </div>

    <div class="balance-banner">
      <span class="balance-label">当前可用余额</span>
      <span class="balance-value">{{ app.formatMoney(app.wallet.value?.balance) }}</span>
    </div>

    <p v-if="apiMessage" :class="['message', apiMessageType]">{{ apiMessage }}</p>

    <a-card class="table-card">
      <a-table
        :data-source="app.withdrawalRequests.value"
        :columns="columns"
        :loading="app.withdrawalLoading.value"
        row-key="id"
        size="middle"
        :scroll="{ x: 700 }"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: app.withdrawalTotal.value,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
          onChange: handlePageChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'created_at'">
            {{ app.formatDateTime(record.created_at) }}
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="amount-cell">{{ app.formatMoney(record.amount) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'remark'">
            {{ record.remark || '--' }}
          </template>
          <template v-else-if="column.key === 'admin_remark'">
            {{ record.admin_remark || '--' }}
          </template>
          <template v-else-if="column.key === 'reviewed_at'">
            {{ record.reviewed_at ? app.formatDateTime(record.reviewed_at) : '--' }}
          </template>
        </template>

        <template #emptyText>
          <div class="empty-text">暂无提现记录。</div>
        </template>
      </a-table>
    </a-card>

    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="closeCreateDialog">
      <div class="dialog-card">
        <div class="dialog-header">
          <div>
            <h3>申请提现</h3>
            <p class="dialog-subtitle">提交后将等待主账户审批，审批通过后余额将扣减。</p>
          </div>
          <button type="button" class="dialog-close-icon" :disabled="app.withdrawalLoading.value" @click="closeCreateDialog">
            <svg viewBox="0 0 1024 1024" aria-hidden="true">
              <path d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z" fill="currentColor"></path>
            </svg>
          </button>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <label class="full-width">
              <span>提现金额</span>
              <input v-model.number="createForm.amount" type="number" min="0.01" step="0.01" placeholder="请输入提现金额" required />
            </label>
            <label class="full-width">
              <span>备注（可选）</span>
              <input v-model.trim="createForm.remark" type="text" maxlength="200" placeholder="填写备注信息" />
            </label>
          </div>
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
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.balance-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.balance-value {
  font-size: 24px;
  font-weight: 700;
  color: #1677ff;
}

.message {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.message.success {
  background: #f6ffed;
  color: #52c41a;
}

.message.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.table-card {
  margin-bottom: 24px;
}

.amount-cell {
  font-weight: 600;
  color: #1677ff;
}

.empty-text {
  padding: 32px 0;
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}

.dialog-subtitle {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

.dialog-close-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close-icon svg {
  width: 16px;
  height: 16px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-grid label span {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

.form-grid input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-grid input:focus {
  border-color: #1677ff;
}

.full-width {
  grid-column: 1 / -1;
}

.hint-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin: 8px 0 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.primary-button {
  padding: 6px 16px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-button:hover:not(:disabled) {
  background: #4096ff;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-button {
  padding: 6px 16px;
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover:not(:disabled) {
  border-color: #1677ff;
  color: #1677ff;
}

.secondary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
