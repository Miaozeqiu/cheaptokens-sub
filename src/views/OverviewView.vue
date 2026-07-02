<script setup>
import { onMounted, ref, computed, reactive } from 'vue'
import { WalletOutlined, DollarOutlined, KeyOutlined } from '@ant-design/icons-vue'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()

const activeTab = ref('overview')

// ---- 统计卡片 ----
const totalRevenue = computed(() => {
  return app.revenueShares.value.reduce((sum, item) => sum + Number(item.sub_share || 0), 0)
})

const activeKeyCount = computed(() => {
  return app.providerKeys.value.filter((item) => item.status === 'active').length
})

// ---- 收益记录 ----
const revenuePage = ref(1)
const revenuePageSize = ref(10)

const revenueColumns = [
  { title: '时段', dataIndex: 'hour_bucket', key: 'hour_bucket', width: 180 },
  { title: '请求数', dataIndex: 'request_count', key: 'request_count', width: 80 },
  { title: '主账户分成', dataIndex: 'parent_share', key: 'parent_share', width: 120 },
  { title: '自己所得', dataIndex: 'sub_share', key: 'sub_share', width: 120 },
]

async function handleRevenuePageChange(page) {
  revenuePage.value = page
  await app.fetchRevenueShares(page, revenuePageSize.value)
}

// ---- 提现 ----
const withdrawalPage = ref(1)
const withdrawalPageSize = ref(10)

const showCreateDialog = ref(false)
const createForm = reactive({
  amount: 0,
  remark: '',
})
const apiMessage = ref('')
const apiMessageType = ref('info')

const withdrawalColumns = [
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

async function handleWithdrawalPageChange(page) {
  withdrawalPage.value = page
  await app.fetchWithdrawalRequests(page, withdrawalPageSize.value)
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

onMounted(async () => {
  await Promise.all([
    app.fetchWallet(),
    app.fetchRevenueShares(1, revenuePageSize.value),
    app.fetchProviderKeys(),
    app.fetchWithdrawalRequests(1, withdrawalPageSize.value),
  ])
})
</script>

<template>
  <div class="overview-page">
    <h2 class="page-title">收益与提现</h2>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-row">
      <a-col :xs="24" :sm="12" :lg="8">
        <a-card :loading="app.walletLoading.value" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon wallet-icon">
              <WalletOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">钱包余额</div>
              <div class="stat-value">{{ app.formatMoney(app.wallet.value.balance) }}</div>
              <div class="stat-sub">公共余额：{{ app.formatMoney(app.wallet.value.public_balance) }}</div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="8">
        <a-card :loading="app.revenueSharesLoading.value" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon revenue-icon">
              <DollarOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">总收益分成</div>
              <div class="stat-value">{{ app.formatMoney(totalRevenue) }}</div>
              <div class="stat-sub">来自百炼 Key 调度分成</div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="8">
        <a-card :loading="app.providerKeyLoading.value" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon key-icon">
              <KeyOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-label">可用百炼 Key</div>
              <div class="stat-value">{{ activeKeyCount }} / {{ app.providerKeys.value.length }}</div>
              <div class="stat-sub">可用 / 总计</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 子标签页 -->
    <a-tabs v-model:activeKey="activeTab" class="content-tabs">
      <a-tab-pane key="overview" tab="收益记录">
        <a-table
          :data-source="app.revenueShares.value"
          :columns="revenueColumns"
          :loading="app.revenueSharesLoading.value"
          row-key="id"
          size="middle"
          :scroll="{ x: 800 }"
          :pagination="{
            current: revenuePage,
            pageSize: revenuePageSize,
            total: app.revenueSharesTotal.value,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handleRevenuePageChange,
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'hour_bucket'">
              {{ app.formatDateTime(record.hour_bucket) }}
            </template>
            <template v-else-if="column.key === 'parent_share'">
              <span class="parent-share">{{ app.formatMoney(record.parent_share) }}</span>
            </template>
            <template v-else-if="column.key === 'sub_share'">
              <span class="sub-share">{{ app.formatMoney(record.sub_share) }}</span>
            </template>
            <template v-else-if="column.key === 'request_count'">
              {{ Number(record.request_count || 0) }}
            </template>
          </template>

          <template #emptyText>
            <div class="empty-text">暂无收益分成记录。</div>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="withdrawal" tab="提现">
        <div class="withdrawal-header">
          <button type="button" class="primary-button" @click="openCreateDialog">申请提现</button>
        </div>

        <p v-if="apiMessage" :class="['message', apiMessageType]">{{ apiMessage }}</p>

        <a-table
          :data-source="app.withdrawalRequests.value"
          :columns="withdrawalColumns"
          :loading="app.withdrawalLoading.value"
          row-key="id"
          size="middle"
          :scroll="{ x: 700 }"
          :pagination="{
            current: withdrawalPage,
            pageSize: withdrawalPageSize,
            total: app.withdrawalTotal.value,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handleWithdrawalPageChange,
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
      </a-tab-pane>
    </a-tabs>

    <!-- 申请提现弹窗 -->
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
.overview-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: 600;
  color: #262626;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 24px;
  flex-shrink: 0;
}

.wallet-icon {
  background: rgba(22, 119, 255, 0.1);
  color: #1677ff;
}

.revenue-icon {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.key-icon {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.stat-info {
  min-width: 0;
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #262626;
  line-height: 1.2;
}

.stat-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #bfbfbf;
}

.content-tabs {
  margin-bottom: 24px;
}

.withdrawal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.balance-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-radius: 8px;
}

.balance-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.balance-value {
  font-size: 22px;
  font-weight: 700;
  color: #1677ff;
}

.parent-share {
  color: #ff4d4f;
}

.sub-share {
  color: #52c41a;
  font-weight: 600;
}

.amount-cell {
  font-variant-numeric: tabular-nums;
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
