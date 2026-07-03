<script setup>
import { onMounted, ref, computed, reactive, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()
const route = useRoute()
const router = useRouter()

const activeTab = ref('withdrawal')
const isMySection = computed(() => route.path.startsWith('/app/me/'))
const mySectionBreadcrumb = computed(() => {
  if (route.path.startsWith('/app/me/payout-settings')) {
    return '我的 > 收款信息'
  }
  if (route.path.startsWith('/app/me/overview')) {
    return '我的 > 收益'
  }
  return '我的'
})
const mySectionBreadcrumbItems = computed(() => {
  if (route.path.startsWith('/app/me/payout-settings')) {
    return [
      { label: '我的', path: '/app/me' },
      { label: '收款信息', path: '/app/me/payout-settings' },
    ]
  }
  if (route.path.startsWith('/app/me/overview')) {
    return [
      { label: '我的', path: '/app/me' },
      { label: '收益', path: '/app/me/overview' },
    ]
  }
  return [{ label: '我的', path: '/app/me' }]
})

function resolveTabFromPath(path) {
  if (path.startsWith('/app/withdrawal')) {
    return 'withdrawal'
  }
  if (path.startsWith('/app/me/payout-settings')) {
    return 'payout'
  }
  if (path.startsWith('/app/me/overview')) {
    return 'overview'
  }
  if (path.startsWith('/app/payout-settings')) {
    return 'payout'
  }
  return 'overview'
}

function routePathForTab(tabKey) {
  if (isMySection.value) {
    switch (tabKey) {
      case 'payout':
        return '/app/me/payout-settings'
      case 'overview':
        return '/app/me/overview'
      default:
        return '/app/me'
    }
  }
  switch (tabKey) {
    case 'payout':
      return '/app/me/payout-settings'
    case 'withdrawal':
      return '/app/withdrawal'
    case 'overview':
      return '/app/me/overview'
    default:
      return '/app/withdrawal'
  }
}

function handleTabChange(nextTab) {
  const tabKey = String(nextTab || 'withdrawal')
  activeTab.value = tabKey
  const nextPath = routePathForTab(tabKey)
  if (route.path !== nextPath) {
    router.replace(nextPath)
  }
}

watch(
  () => route.path,
  (path) => {
    activeTab.value = resolveTabFromPath(path)
  },
  { immediate: true },
)

// ---- 统计卡片 ----
const totalRevenue = computed(() => {
  return app.revenueShares.value.reduce((sum, item) => sum + Number(item.sub_share || 0), 0)
})

const activeKeyCount = computed(() => {
  return app.providerKeys.value.filter((item) => item.status === 'active').length
})

const withdrawalTotalPages = computed(() =>
  Math.max(1, Math.ceil(Number(app.withdrawalTotal.value || 0) / Number(withdrawalPageSize.value || 10))),
)

const revenueTotalPages = computed(() =>
  Math.max(1, Math.ceil(Number(app.revenueSharesTotal.value || 0) / Number(revenuePageSize.value || 10))),
)

function formatTableTime(value) {
  const text = app.formatDateTime(value)
  if (!text || text === '--') return '--'
  return text.replace(/:\d{2}$/, '')
}

// ---- 收益记录 ----
const revenuePage = ref(1)
const revenuePageSize = ref(10)

async function handleRevenuePageChange(page) {
  if (page < 1 || page > revenueTotalPages.value || page === revenuePage.value) return
  revenuePage.value = page
  await app.fetchRevenueShares(page, revenuePageSize.value)
}

// ---- 提现 ----
const withdrawalPage = ref(1)
const withdrawalPageSize = ref(10)

const showCreateDialog = ref(false)
const showWithdrawalHistoryDialog = ref(false)
const createForm = reactive({
  amount: 0,
  remark: '',
})
const payoutForm = reactive({
  wechat_account: '',
  alipay_account: '',
  wechat_qr_code_url: '',
  alipay_qr_code_url: '',
  wechat_qr_code_proxy_path: '',
  alipay_qr_code_proxy_path: '',
})
const wechatQRCodeInput = ref(null)
const alipayQRCodeInput = ref(null)
const subAccountID = computed(() => Number(app.currentUser.value?.id || 0))

const hasWechatQR = computed(() => hasQRCode(payoutForm.wechat_qr_code_proxy_path))
const hasAlipayQR = computed(() => hasQRCode(payoutForm.alipay_qr_code_proxy_path))

function setMessage(text, type = 'info') {
  showToast(text, type)
}

function syncPayoutForm() {
  payoutForm.wechat_account = String(app.payoutSettings.value?.wechat_account || '')
  payoutForm.alipay_account = String(app.payoutSettings.value?.alipay_account || '')
  payoutForm.wechat_qr_code_url = String(app.payoutSettings.value?.wechat_qr_code_url || '')
  payoutForm.alipay_qr_code_url = String(app.payoutSettings.value?.alipay_qr_code_url || '')
  payoutForm.wechat_qr_code_proxy_path = String(app.payoutSettings.value?.wechat_qr_code_proxy_path || '')
  payoutForm.alipay_qr_code_proxy_path = String(app.payoutSettings.value?.alipay_qr_code_proxy_path || '')
}

function buildQRCodePreviewUrl(proxyPath) {
  const path = String(proxyPath || '').trim()
  if (!path) {
    return ''
  }
  const token = String(app.authToken.value || '').trim()
  const baseUrl = app.apiUrl(path)
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}

function hasQRCode(proxyPath) {
  return Boolean(String(proxyPath || '').trim())
}

function statusText(status) {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已驳回'
    default: return status
  }
}

async function handleWithdrawalPageChange(page) {
  if (page < 1 || page > withdrawalTotalPages.value || page === withdrawalPage.value) return
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

function openWithdrawalHistoryDialog() {
  showWithdrawalHistoryDialog.value = true
}

function closeWithdrawalHistoryDialog() {
  if (app.withdrawalLoading.value) return
  showWithdrawalHistoryDialog.value = false
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

async function handleSavePayoutSettings() {
  setMessage('', 'info')
  const result = await app.updatePayoutSettings({ ...payoutForm })
  if (result.ok) {
    syncPayoutForm()
    setMessage(result.message || '收款信息已保存', 'success')
    return
  }
  setMessage(result.message || '保存失败', 'error')
}

function openQRCodePicker(kind) {
  if (kind === 'wechat') {
    wechatQRCodeInput.value?.click()
    return
  }
  alipayQRCodeInput.value?.click()
}

async function handleQRCodeSelected(kind, event) {
  const input = event?.target
  const file = input?.files?.[0]
  if (!file) {
    return
  }
  setMessage('', 'info')
  const result = await app.uploadPayoutQRCode(kind, file)
  input.value = ''
  if (!result.ok) {
    setMessage(result.message || '上传失败', 'error')
    return
  }
  if (kind === 'wechat') {
    payoutForm.wechat_qr_code_url = result.url || ''
    payoutForm.wechat_qr_code_proxy_path = result.proxy_path || ''
  } else {
    payoutForm.alipay_qr_code_url = result.url || ''
    payoutForm.alipay_qr_code_proxy_path = result.proxy_path || ''
  }
  const saveResult = await app.updatePayoutSettings({ ...payoutForm })
  if (!saveResult.ok) {
    setMessage(saveResult.message || '图片已上传，但自动保存失败', 'error')
    return
  }
  syncPayoutForm()
  setMessage(saveResult.message || '图片已上传并自动保存', 'success')
}

onMounted(async () => {
  await Promise.all([
    app.fetchWallet(),
    app.fetchRevenueShares(1, revenuePageSize.value),
    app.fetchProviderKeys(),
    app.fetchWithdrawalRequests(1, withdrawalPageSize.value),
    app.fetchPayoutSettings(),
  ])
  syncPayoutForm()
})
</script>

<template>
  <div class="overview-page">
    <div v-if="isMySection" class="section-topbar">
      <RouterLink class="section-back-link" to="/app/me">
        <svg viewBox="0 0 1097 1024" aria-hidden="true">
          <path
            d="M357.083429 15.945143a54.930286 54.930286 0 0 1 0 77.019428L190.390857 262.144h530.944a384.950857 384.950857 0 0 1 375.881143 380.928A384.950857 384.950857 0 0 1 721.334857 1024H484.059429a54.418286 54.418286 0 0 1 0-108.836571h237.348571a272.164571 272.164571 0 1 0 0-544.256H175.908571l181.248 183.954285a55.003429 55.003429 0 0 1-1.828571 75.337143 53.101714 53.101714 0 0 1-73.801143 1.974857L15.725714 362.496a54.930286 54.930286 0 0 1 0-76.946286L281.526857 15.945143a53.101714 53.101714 0 0 1 75.849143 0z"
            fill="currentColor"
          />
        </svg>
        <span>返回</span>
      </RouterLink>

      <nav class="section-breadcrumb" aria-label="页面路径">
        <template v-for="(item, index) in mySectionBreadcrumbItems" :key="item.path">
          <RouterLink class="section-breadcrumb__link" :to="item.path">
            {{ item.label }}
          </RouterLink>
          <span v-if="index < mySectionBreadcrumbItems.length - 1" class="section-breadcrumb__separator" aria-hidden="true">></span>
        </template>
      </nav>
    </div>

    <article v-if="activeTab === 'withdrawal'" class="list-card">
      <div class="withdrawal-entry">
        <button type="button" class="action-button withdrawal-entry__button" @click="openCreateDialog">提现</button>
        <button type="button" class="withdrawal-entry__history" @click="openWithdrawalHistoryDialog">记录</button>
      </div>
    </article>

    <article v-else-if="activeTab === 'overview'" class="page-card list-card overview-record-card">
      <div class="page-card__body">
        <header class="list-toolbar">
          <div class="toolbar-left">
            <h3 class="list-title">收益分成</h3>
          </div>
        </header>

        <div class="table-body">
          <div v-if="app.revenueSharesLoading.value && !app.revenueShares.value.length" class="empty-state">
            <h4>正在加载…</h4>
          </div>
          <div v-else-if="!app.revenueShares.value.length" class="empty-state">
            <h4>暂无收益分成记录</h4>
            <p>百炼 Key 参与调度后，收益将按小时汇总显示。</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>时段</th>
                  <th>请求数</th>
                  <th>主账户分成</th>
                  <th>自己所得</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in app.revenueShares.value" :key="record.id">
                  <td class="time-text">{{ formatTableTime(record.hour_bucket) }}</td>
                  <td>{{ Number(record.request_count || 0).toLocaleString('zh-CN') }}</td>
                  <td><span class="parent-share">{{ app.formatMoney(record.parent_share) }}</span></td>
                  <td><strong class="sub-share">{{ app.formatMoney(record.sub_share) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer v-if="app.revenueSharesTotal.value > 0" class="list-foot">
          <div class="list-foot__meta">
            <span class="muted-text">第 {{ revenuePage }} / {{ revenueTotalPages }} 页</span>
            <span class="muted-text">共 {{ app.revenueSharesTotal.value }} 条</span>
            <span class="muted-text">总收益 {{ app.formatMoney(totalRevenue) }}</span>
          </div>
          <div class="action-group">
            <button type="button" class="action-button wide" :disabled="revenuePage <= 1 || app.revenueSharesLoading.value" @click="handleRevenuePageChange(revenuePage - 1)">上一页</button>
            <button type="button" class="action-button wide" :disabled="revenuePage >= revenueTotalPages || app.revenueSharesLoading.value" @click="handleRevenuePageChange(revenuePage + 1)">下一页</button>
          </div>
        </footer>
      </div>
    </article>

    <article v-else class="list-card payout-card">
      <form class="payout-form" @submit.prevent="handleSavePayoutSettings">
        <div class="payout-col">
          <label class="payout-field">
            <span>微信号</span>
            <input
              v-model.trim="payoutForm.wechat_account"
              type="text"
              maxlength="120"
              placeholder="请输入微信号"
            />
          </label>

          <div class="payout-field">
            <div class="payout-field__head">
              <span>微信收款码</span>
            </div>
            <input
              ref="wechatQRCodeInput"
              class="hidden-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="handleQRCodeSelected('wechat', $event)"
            />
            <div v-if="hasWechatQR" class="qr-thumb-wrap">
              <a
                class="qr-thumb"
                :href="buildQRCodePreviewUrl(payoutForm.wechat_qr_code_proxy_path)"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  :src="buildQRCodePreviewUrl(payoutForm.wechat_qr_code_proxy_path)"
                  alt="微信收款码"
                />
              </a>
              <button
                type="button"
                class="qr-thumb-overlay"
                :disabled="app.payoutUploadLoading.wechat"
                @click="openQRCodePicker('wechat')"
              >
                {{ app.payoutUploadLoading.wechat ? '上传中...' : '更换' }}
              </button>
            </div>
            <button
              v-else
              type="button"
              class="qr-thumb qr-thumb--empty"
              :disabled="app.payoutUploadLoading.wechat"
              @click="openQRCodePicker('wechat')"
            >
              点击上传
            </button>
          </div>
        </div>

        <div class="payout-col">
          <label class="payout-field">
            <span>支付宝账号</span>
            <input
              v-model.trim="payoutForm.alipay_account"
              type="text"
              maxlength="120"
              placeholder="请输入支付宝账号"
            />
          </label>

          <div class="payout-field">
            <div class="payout-field__head">
              <span>支付宝收款码</span>
            </div>
            <input
              ref="alipayQRCodeInput"
              class="hidden-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="handleQRCodeSelected('alipay', $event)"
            />
            <div v-if="hasAlipayQR" class="qr-thumb-wrap">
              <a
                class="qr-thumb"
                :href="buildQRCodePreviewUrl(payoutForm.alipay_qr_code_proxy_path)"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  :src="buildQRCodePreviewUrl(payoutForm.alipay_qr_code_proxy_path)"
                  alt="支付宝收款码"
                />
              </a>
              <button
                type="button"
                class="qr-thumb-overlay"
                :disabled="app.payoutUploadLoading.alipay"
                @click="openQRCodePicker('alipay')"
              >
                {{ app.payoutUploadLoading.alipay ? '上传中...' : '更换' }}
              </button>
            </div>
            <button
              v-else
              type="button"
              class="qr-thumb qr-thumb--empty"
              :disabled="app.payoutUploadLoading.alipay"
              @click="openQRCodePicker('alipay')"
            >
              点击上传
            </button>
          </div>
        </div>
      </form>

      <div class="payout-actions">
        <button
          type="button"
          class="action-button"
          :disabled="app.payoutSettingsLoading.value"
          @click="handleSavePayoutSettings"
        >
          {{ app.payoutSettingsLoading.value ? '保存中...' : '保存' }}
        </button>
      </div>
    </article>

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

    <div v-if="showWithdrawalHistoryDialog" class="dialog-overlay" @click.self="closeWithdrawalHistoryDialog">
      <div class="dialog-card dialog-card--wide">
        <div class="dialog-header">
          <div>
            <h3>提现记录</h3>
            <p class="dialog-subtitle">共 {{ app.withdrawalTotal.value }} 条</p>
          </div>
          <button type="button" class="dialog-close-icon" :disabled="app.withdrawalLoading.value" @click="closeWithdrawalHistoryDialog">
            <svg viewBox="0 0 1024 1024" aria-hidden="true">
              <path d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z" fill="currentColor"></path>
            </svg>
          </button>
        </div>

        <div class="table-body dialog-table-body">
          <div v-if="app.withdrawalLoading.value && !app.withdrawalRequests.value.length" class="table-state">
            <span>正在加载…</span>
          </div>
          <div v-else-if="!app.withdrawalRequests.value.length" class="table-state">
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

        <footer v-if="app.withdrawalTotal.value > 0" class="list-foot dialog-list-foot">
          <span class="muted-text">第 {{ withdrawalPage }} / {{ withdrawalTotalPages }} 页</span>
          <div class="action-group">
            <button type="button" class="action-button wide" :disabled="withdrawalPage <= 1 || app.withdrawalLoading.value" @click="handleWithdrawalPageChange(withdrawalPage - 1)">上一页</button>
            <button type="button" class="action-button wide" :disabled="withdrawalPage >= withdrawalTotalPages || app.withdrawalLoading.value" @click="handleWithdrawalPageChange(withdrawalPage + 1)">下一页</button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-page {
  display: grid;
  gap: 20px;
  width: 100%;
  max-width: 1120px;
  min-width: 0;
  margin: 0 auto;
}

.section-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.section-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.section-back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #488eff;
  text-decoration: none;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.section-back-link svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.section-back-link span {
  font-size: 14px;
  line-height: 1.5;
}

.section-back-link:hover {
  color: #2f6fd5;
}

.section-breadcrumb__link {
  color: var(--text-secondary);
  text-decoration: none;
}

.section-breadcrumb__link:hover {
  color: var(--text-primary);
}

.section-breadcrumb__separator {
  color: var(--text-secondary);
}

.section-tabs {
  display: flex;
  align-items: flex-end;
  gap: 28px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.section-tab {
  position: relative;
  padding: 0 0 10px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 400;
}

.section-tab::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -13px;
  height: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background-color 0.2s ease;
}

.section-tab:hover {
  color: var(--text-primary);
}

.section-tab.active {
  color: var(--text-primary);
  font-weight: 600;
}

.section-tab.active::after {
  background: var(--text-primary);
}

.list-card {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  min-width: 0;
  padding: 16px 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-card);
}

.overview-record-card {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.overview-record-card .page-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 420px;
  min-width: 0;
}

.overview-record-card .list-toolbar {
  padding-bottom: 14px;
  border-bottom: 0;
}

.overview-record-card .table-body {
  margin-top: 0;
}

.overview-record-card .table-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.payout-card {
  min-height: auto;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.payout-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.payout-col {
  display: grid;
  gap: 16px;
  align-content: start;
}

.payout-col + .payout-col {
  padding-left: 24px;
  border-left: 1px solid var(--border-color);
}

.payout-field {
  display: grid;
  gap: 8px;
}

.payout-field span {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

.payout-field__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.payout-field input {
  min-height: 40px;
  padding: 8px 12px;
  border: 0;
  border-radius: 6px;
  background: #fff;
  outline: none;
  box-shadow: none;
}

.payout-field input:focus {
  border-color: transparent;
}

.qr-thumb {
  display: block;
  width: 160px;
  aspect-ratio: 207 / 281;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: #fafafa;
}

.qr-thumb-wrap {
  position: relative;
  display: inline-block;
  width: 160px;
}

.qr-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-thumb-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.qr-thumb-wrap:hover .qr-thumb-overlay,
.qr-thumb-wrap:focus-within .qr-thumb-overlay {
  opacity: 1;
  pointer-events: auto;
}

.qr-thumb--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.text-link-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
}

.payout-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.hidden-file-input {
  display: none;
}

.list-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.list-title {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.list-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.withdrawal-entry {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  flex: 1;
  min-height: 280px;
}

.withdrawal-entry__button {
  min-width: 120px;
}

.withdrawal-entry__history {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 400;
}

.withdrawal-entry__history:hover {
  color: var(--text-primary);
}

.action-button {
  min-height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
  background: #039be5;
  color: #fff;
}

.action-button.compact {
  min-height: 30px;
  padding: 0 12px;
  font-size: 12px;
}

.action-button.wide {
  min-width: 72px;
}

.table-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  margin-top: 12px;
  overflow: auto;
}

.table-wrap {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.table-wrap table {
  min-width: 720px;
}

.list-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.list-foot__meta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-group {
  display: inline-flex;
  gap: 8px;
}

.muted-text,
.time-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.parent-share {
  color: #ef4444;
}

.sub-share {
  color: #10b981;
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

.message {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 10, 10, 0.34);
}

.dialog-card {
  width: min(100%, 420px);
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: #fff;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.dialog-card--wide {
  width: min(100%, 980px);
}

.dialog-table-body {
  max-height: min(60vh, 520px);
  margin-top: 0;
}

.dialog-list-foot {
  margin-top: 16px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.dialog-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.dialog-close-icon {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  padding: 4px;
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
  color: var(--text-secondary);
  font-weight: 600;
}

.form-grid input {
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: #fff;
  outline: none;
}

.form-grid input:focus {
  border-color: #93c5fd;
}

.full-width {
  grid-column: 1 / -1;
}

.hint-text {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.primary-button,
.secondary-button {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.primary-button {
  border: 0;
  background: var(--accent);
  color: #fff;
}

.primary-button:hover:not(:disabled) {
  background: #039be5;
}

.secondary-button {
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-primary);
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .payout-form {
    grid-template-columns: 1fr;
  }

  .payout-col + .payout-col {
    padding-left: 0;
    border-left: 0;
  }
}
</style>
