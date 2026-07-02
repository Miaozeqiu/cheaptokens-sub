import { computed, ref } from 'vue'
import { apiUrl } from '../utils/apiConfig'

const AUTH_STORAGE_KEY = 'cheaptokens-sub.auth'

const DEFAULT_PROVIDER_BASE_URL = 'https://dashscope.aliyuncs.com'

const loginForm = ref({
  name: '',
  password: '',
})

const createProviderKeyForm = ref({
  remark: '',
  api_key: '',
  base_url: DEFAULT_PROVIDER_BASE_URL,
  ratio: 0.8,
})

const authToken = ref('')
const currentUser = ref(null)
const sessionExpiresAt = ref('')

const loginLoading = ref(false)
const sessionLoading = ref(false)
const walletLoading = ref(false)
const providerKeyLoading = ref(false)
const revenueSharesLoading = ref(false)

const wallet = ref({
  balance: 0,
  public_balance: 0,
  currency: 'CNY',
  updated_at: '',
})

const providerKeys = ref([])
const revenueShares = ref([])
const revenueSharesTotal = ref(0)

const withdrawalRequests = ref([])
const withdrawalTotal = ref(0)
const withdrawalLoading = ref(false)

const isAuthenticated = computed(() => Boolean(authToken.value && currentUser.value))

function hasSession() {
  return Boolean(authToken.value && currentUser.value)
}

function saveSession(payload) {
  authToken.value = payload.token
  currentUser.value = payload.user
  sessionExpiresAt.value = payload.expires_at || ''
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: authToken.value,
      user: currentUser.value,
      expiresAt: sessionExpiresAt.value,
    }),
  )
}

function clearSession() {
  authToken.value = ''
  currentUser.value = null
  sessionExpiresAt.value = ''
  wallet.value = {
    balance: 0,
    public_balance: 0,
    currency: 'CNY',
    updated_at: '',
  }
  providerKeys.value = []
  revenueShares.value = []
  revenueSharesTotal.value = 0
  withdrawalRequests.value = []
  withdrawalTotal.value = 0
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    authToken.value = parsed.token || ''
    currentUser.value = parsed.user || null
    sessionExpiresAt.value = parsed.expiresAt || ''
  } catch {
    clearSession()
  }
}

async function authFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (authToken.value) {
    headers.set('Authorization', `Bearer ${authToken.value}`)
  }
  return fetch(apiUrl(path), {
    ...options,
    headers,
  })
}

async function restoreSession() {
  loadStoredSession()
  if (!authToken.value) {
    return
  }
  sessionLoading.value = true
  try {
    const response = await authFetch('/api/me')
    const data = await response.json()
    if (!response.ok) {
      clearSession()
      return
    }
    saveSession({
      token: authToken.value,
      user: data.user,
      expires_at: data.expires_at,
    })
  } catch {
    // 保留本地会话，避免后端短暂不可用时强制登出
  } finally {
    sessionLoading.value = false
  }
}

async function submitLogin() {
  loginLoading.value = true
  try {
    const response = await fetch(apiUrl('/api/sub-accounts/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: loginForm.value.name.trim(),
        password: loginForm.value.password,
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '登录失败，请稍后重试' }
    }
    saveSession(data)
    loginForm.value.password = ''
    return { ok: true, message: data.message || '登录成功' }
  } catch (error) {
    return { ok: false, message: error.message || '登录失败，请稍后重试' }
  } finally {
    loginLoading.value = false
  }
}

async function logout() {
  try {
    if (authToken.value) {
      await authFetch('/api/logout', { method: 'POST' })
    }
  } catch {
    // 优先清理本地会话
  }
  clearSession()
}

async function fetchWallet() {
  walletLoading.value = true
  try {
    const response = await authFetch('/api/wallet')
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '读取余额失败' }
    }
    wallet.value = data.wallet || {
      balance: 0,
      public_balance: 0,
      currency: 'CNY',
      updated_at: '',
    }
    return { ok: true }
  } catch {
    return { ok: false, message: '无法连接后端钱包接口' }
  } finally {
    walletLoading.value = false
  }
}

async function fetchProviderKeys() {
  providerKeyLoading.value = true
  try {
    const response = await authFetch('/api/provider-keys')
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '读取百炼 Key 列表失败' }
    }
    providerKeys.value = data.items || []
    return { ok: true }
  } catch {
    return { ok: false, message: '无法连接后端百炼 Key 接口' }
  } finally {
    providerKeyLoading.value = false
  }
}

async function createProviderKey() {
  providerKeyLoading.value = true
  try {
    const response = await authFetch('/api/provider-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createProviderKeyForm.value),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '创建百炼 Key 失败' }
    }
    createProviderKeyForm.value.remark = ''
    createProviderKeyForm.value.api_key = ''
    createProviderKeyForm.value.base_url = DEFAULT_PROVIDER_BASE_URL
    createProviderKeyForm.value.ratio = 0.8
    await fetchProviderKeys()
    return { ok: true, message: data.message || '创建成功' }
  } catch {
    return { ok: false, message: '创建百炼 Key 失败，请确认后端服务可用' }
  } finally {
    providerKeyLoading.value = false
  }
}

async function deleteProviderKey(id) {
  providerKeyLoading.value = true
  try {
    const response = await authFetch(`/api/provider-keys/${id}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '删除失败' }
    }
    await fetchProviderKeys()
    return { ok: true, message: data.message || '删除成功' }
  } catch {
    return { ok: false, message: '删除百炼 Key 失败' }
  } finally {
    providerKeyLoading.value = false
  }
}

async function updateProviderKeyRatio(id, ratio) {
  providerKeyLoading.value = true
  try {
    const response = await authFetch(`/api/provider-keys/${id}/ratio`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratio: Number(ratio) }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '更新倍率失败' }
    }
    await fetchProviderKeys()
    return { ok: true, message: data.message || '更新成功' }
  } catch {
    return { ok: false, message: '更新收益倍率失败' }
  } finally {
    providerKeyLoading.value = false
  }
}

async function updateProviderKeyRemark(id, remark) {
  providerKeyLoading.value = true
  try {
    const response = await authFetch(`/api/provider-keys/${id}/remark`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remark: String(remark || '').trim() }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '更新备注失败' }
    }
    await fetchProviderKeys()
    return { ok: true, message: data.message || '更新成功' }
  } catch {
    return { ok: false, message: '更新备注失败' }
  } finally {
    providerKeyLoading.value = false
  }
}

async function fetchRevenueShares(page = 1, pageSize = 20) {
  revenueSharesLoading.value = true
  try {
    const response = await authFetch(
      `/api/sub-accounts/revenue-shares?page=${page}&page_size=${pageSize}`,
    )
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '读取收益分成记录失败' }
    }
    revenueShares.value = data.items || []
    revenueSharesTotal.value = Number(data.total || 0)
    return { ok: true }
  } catch {
    return { ok: false, message: '无法连接收益分成接口' }
  } finally {
    revenueSharesLoading.value = false
  }
}

function formatDateTime(value) {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleString('zh-CN')
}

function formatMoney(value) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function formatRatio(value) {
  const numeric = Number(value || 0)
  return `${(numeric * 100).toFixed(1)}%`
}

async function fetchWithdrawalRequests(page = 1, pageSize = 20) {
  withdrawalLoading.value = true
  try {
    const response = await authFetch(
      `/api/wallet/withdraw-requests?page=${page}&page_size=${pageSize}`,
    )
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '读取提现记录失败' }
    }
    withdrawalRequests.value = data.items || []
    withdrawalTotal.value = Number(data.total || 0)
    return { ok: true }
  } catch {
    return { ok: false, message: '无法连接提现记录接口' }
  } finally {
    withdrawalLoading.value = false
  }
}

async function createWithdrawalRequest(amount, remark) {
  withdrawalLoading.value = true
  try {
    const response = await authFetch('/api/wallet/withdraw-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        remark: String(remark || '').trim(),
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, message: data.message || '提交提现申请失败' }
    }
    await fetchWithdrawalRequests()
    await fetchWallet()
    return { ok: true, message: data.message || '提现申请已提交' }
  } catch {
    return { ok: false, message: '提交提现申请失败，请确认后端服务可用' }
  } finally {
    withdrawalLoading.value = false
  }
}

loadStoredSession()

export function useSubApp() {
  return {
    loginForm,
    createProviderKeyForm,
    authToken,
    currentUser,
    sessionExpiresAt,
    loginLoading,
    sessionLoading,
    walletLoading,
    providerKeyLoading,
    revenueSharesLoading,
    wallet,
    providerKeys,
    revenueShares,
    revenueSharesTotal,
    isAuthenticated,
    hasSession,
    saveSession,
    clearSession,
    restoreSession,
    submitLogin,
    logout,
    fetchWallet,
    fetchProviderKeys,
    createProviderKey,
    deleteProviderKey,
    updateProviderKeyRatio,
    updateProviderKeyRemark,
    fetchRevenueShares,
    fetchWithdrawalRequests,
    createWithdrawalRequest,
    withdrawalRequests,
    withdrawalTotal,
    withdrawalLoading,
    formatDateTime,
    formatMoney,
    formatRatio,
  }
}
