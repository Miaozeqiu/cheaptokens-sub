<script setup>
import { computed, onMounted, ref } from 'vue'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()

const showCreateDialog = ref(false)
const showRatioDialog = ref(false)
const showRemarkDialog = ref(false)
const showDeleteDialog = ref(false)
const editingKeyId = ref(null)
const editingRatio = ref(0.8)
const editingRemark = ref('')
const deletingKeyId = ref(null)

const activeKeyCount = computed(() =>
  app.providerKeys.value.filter((item) => item.status === 'active').length,
)

const totalIncome = computed(() =>
  app.providerKeys.value.reduce((sum, item) => sum + Number((item.net_income ?? item.total_income) || 0), 0),
)

function getDisplayIncome(record) {
  return Number((record?.net_income ?? record?.total_income) || 0)
}

function setNotice(text, type = 'info') {
  showToast(text, type)
}

function formatProviderKeyStatus(status) {
  const map = {
    active: '可用',
    insufficient_balance: '余额不足',
    invalid: 'Key 无效',
    disabled: '已停用',
  }
  return map[status] || status || '未知'
}

function statusChipClass(status) {
  if (status === 'active') return 'status-active'
  if (status === 'insufficient_balance' || status === 'invalid') return 'status-warning'
  return 'status-muted'
}

function formatTableTime(value) {
  const text = app.formatDateTime(value)
  if (!text || text === '--') return '--'
  return text.replace(/:\d{2}$/, '')
}

function openCreateDialog() {
  setNotice('', 'info')
  showCreateDialog.value = true
}

function closeCreateDialog() {
  if (app.providerKeyLoading.value) return
  showCreateDialog.value = false
}

function openRatioEditor(record) {
  editingKeyId.value = record.id
  editingRatio.value = Number(record.ratio || 0.8)
  showRatioDialog.value = true
}

function closeRatioEditor() {
  if (app.providerKeyLoading.value) return
  showRatioDialog.value = false
  editingKeyId.value = null
}

function openRemarkEditor(record) {
  editingKeyId.value = record.id
  editingRemark.value = String(record.remark || '')
  showRemarkDialog.value = true
}

function closeRemarkEditor() {
  if (app.providerKeyLoading.value) return
  showRemarkDialog.value = false
  editingKeyId.value = null
}

function openDeleteDialog(id) {
  deletingKeyId.value = id
  showDeleteDialog.value = true
}

function closeDeleteDialog() {
  if (app.providerKeyLoading.value) return
  showDeleteDialog.value = false
  deletingKeyId.value = null
}

async function handleCreate() {
  const result = await app.createProviderKey()
  if (result.ok) {
    setNotice(result.message || '创建成功', 'success')
    closeCreateDialog()
  } else {
    setNotice(result.message || '创建失败', 'error')
  }
}

async function handleDelete() {
  if (!deletingKeyId.value) return
  const result = await app.deleteProviderKey(deletingKeyId.value)
  if (result.ok) {
    setNotice(result.message || '删除成功', 'success')
    closeDeleteDialog()
  } else {
    setNotice(result.message || '删除失败', 'error')
  }
}

async function handleSaveRatio() {
  if (!editingKeyId.value) return
  const result = await app.updateProviderKeyRatio(editingKeyId.value, editingRatio.value)
  if (result.ok) {
    setNotice(result.message || '更新成功', 'success')
    closeRatioEditor()
  } else {
    setNotice(result.message || '更新失败', 'error')
  }
}

async function handleSaveRemark() {
  if (!editingKeyId.value) return
  const result = await app.updateProviderKeyRemark(editingKeyId.value, editingRemark.value)
  if (result.ok) {
    setNotice(result.message || '更新成功', 'success')
    closeRemarkEditor()
  } else {
    setNotice(result.message || '更新失败', 'error')
  }
}

async function reloadList() {
  const result = await app.fetchProviderKeys()
  if (!result.ok) {
    setNotice(result.message || '读取百炼 Key 列表失败', 'error')
  }
}

onMounted(() => {
  reloadList()
})
</script>

<template>
  <div class="provider-keys-page">
    <section class="metrics-grid">
      <article class="metric-card page-card">
        <div class="page-card__body">
          <span class="metric-label">百炼 Key 总数</span>
          <strong class="metric-value">{{ app.providerKeys.value.length }}</strong>
        </div>
      </article>
      <article class="metric-card page-card">
        <div class="page-card__body">
          <span class="metric-label">可用 Key</span>
          <strong class="metric-value">{{ activeKeyCount }}</strong>
        </div>
      </article>
      <article class="metric-card page-card">
        <div class="page-card__body">
          <span class="metric-label">累计收益</span>
          <strong class="metric-value">{{ app.formatMoney(totalIncome) }}</strong>
        </div>
      </article>
    </section>

    <article class="page-card list-card">
      <div class="page-card__body">
        <header class="list-toolbar">
          <div class="toolbar-right">
            <button type="button" class="secondary-button" :disabled="app.providerKeyLoading.value" @click="reloadList">
              刷新
            </button>
            <button type="button" class="primary-button" @click="openCreateDialog">
              添加
            </button>
          </div>
        </header>

        <div class="table-body">
          <div v-if="app.providerKeyLoading.value && !app.providerKeys.value.length" class="empty-state">
            <h4>正在加载…</h4>
          </div>
          <div v-else-if="!app.providerKeys.value.length" class="empty-state">
            <h4>暂无百炼 Key</h4>
            <p>添加一个百炼 API Key 后即可参与平台调度。</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>备注</th>
                  <th>状态</th>
                  <th>倍率</th>
                  <th>总收益</th>
                  <th>Key 预览</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in app.providerKeys.value" :key="record.id">
                  <td>
                    <button type="button" class="text-link-button" @click="openRemarkEditor(record)">
                      {{ record.remark || '添加备注' }}
                    </button>
                  </td>
                  <td>
                    <span class="pill status-pill" :class="statusChipClass(record.status)">
                      {{ formatProviderKeyStatus(record.status) }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="ratio-chip" @click="openRatioEditor(record)">
                      {{ app.formatRatio(record.ratio) }}
                    </button>
                  </td>
                  <td><strong>{{ app.formatMoney(getDisplayIncome(record)) }}</strong></td>
                  <td><code class="key-preview mono-text">{{ record.key_preview }}</code></td>
                  <td class="time-text">{{ formatTableTime(record.created_at) }}</td>
                  <td>
                    <div class="row-actions">
                      <button type="button" class="text-link-button" @click="openRemarkEditor(record)">备注</button>
                      <button type="button" class="text-link-button" @click="openRatioEditor(record)">倍率</button>
                      <button type="button" class="text-link-button danger" @click="openDeleteDialog(record.id)">删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </article>

    <Transition name="provider-dialog">
      <div v-if="showCreateDialog" class="dialog-overlay" @mousedown.self="closeCreateDialog">
        <div class="dialog-card">
          <div class="dialog-header">
            <div class="provider-dialog-header-actions">
              <button type="button" class="dialog-close-icon" :disabled="app.providerKeyLoading.value" @click="closeCreateDialog">
                <svg viewBox="0 0 1024 1024" aria-hidden="true">
                  <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
                </svg>
              </button>
              <button
                type="submit"
                form="provider-create-form"
                class="primary-button provider-dialog-submit"
                :disabled="app.providerKeyLoading.value"
              >
                {{ app.providerKeyLoading.value ? '创建中...' : '创建' }}
              </button>
            </div>
          </div>

          <form id="provider-create-form" class="form-grid provider-dialog-form" @submit.prevent="handleCreate">
          <label>
            <span>备注</span>
            <input
              v-model.trim="app.createProviderKeyForm.value.remark"
              type="text"
              maxlength="80"
              placeholder="我自己的key"
            />
          </label>

          <label>
            <span>阿里云百炼 API Key</span>
            <input
              v-model.trim="app.createProviderKeyForm.value.api_key"
              type="password"
              placeholder="sk-ws-***"
            />
          </label>

          <label>
            <span>API Host</span>
            <input
              v-model.trim="app.createProviderKeyForm.value.base_url"
              type="url"
              placeholder="https://***.maas.aliyuncs.com"
            />
            <span class="hint-text">示例：https://ws-mhshv8llftydyjpf.cn-beijing.maas.aliyuncs.com</span>
          </label>

          <label>
            <span>收益倍率</span>
            <input
              v-model.number="app.createProviderKeyForm.value.ratio"
              type="number"
              min="0.01"
              max="0.8"
              step="0.01"
            />
          </label>

          <p class="hint-text">当前设置：{{ app.formatRatio(app.createProviderKeyForm.value.ratio) }}</p>
          <p class="hint-text">倍率范围 0.01 - 0.80，较低倍率会提高调度优先级。实际收益=300x倍率x抽成</p>

          </form>
        </div>
      </div>
    </Transition>

    <Transition name="provider-dialog">
      <div v-if="showRatioDialog" class="dialog-overlay" @mousedown.self="closeRatioEditor">
        <div class="dialog-card">
          <div class="dialog-header">
            <div class="provider-dialog-header-actions">
              <button type="button" class="dialog-close-icon" :disabled="app.providerKeyLoading.value" @click="closeRatioEditor">
                <svg viewBox="0 0 1024 1024" aria-hidden="true">
                  <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
                </svg>
              </button>
              <button
                type="submit"
                form="provider-ratio-form"
                class="primary-button provider-dialog-submit"
                :disabled="app.providerKeyLoading.value"
              >
                {{ app.providerKeyLoading.value ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>

          <form id="provider-ratio-form" class="form-grid provider-dialog-form" @submit.prevent="handleSaveRatio">
          <label>
            <span>收益倍率</span>
            <input
              v-model.number="editingRatio"
              type="number"
              min="0.01"
              max="0.8"
              step="0.01"
            />
          </label>

          <p class="hint-text">当前设置：{{ app.formatRatio(editingRatio) }}</p>
          <p class="hint-text">倍率范围 0.01 - 0.80，较低倍率会提高调度优先级。实际收益=300x倍率x抽成</p>

          </form>
        </div>
      </div>
    </Transition>

    <Transition name="provider-dialog">
      <div v-if="showRemarkDialog" class="dialog-overlay" @mousedown.self="closeRemarkEditor">
        <div class="dialog-card">
          <div class="dialog-header">
            <div class="provider-dialog-header-actions">
              <button type="button" class="dialog-close-icon" :disabled="app.providerKeyLoading.value" @click="closeRemarkEditor">
                <svg viewBox="0 0 1024 1024" aria-hidden="true">
                  <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
                </svg>
              </button>
              <button
                type="submit"
                form="provider-remark-form"
                class="primary-button provider-dialog-submit"
                :disabled="app.providerKeyLoading.value"
              >
                {{ app.providerKeyLoading.value ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>

          <form id="provider-remark-form" class="form-grid provider-dialog-form" @submit.prevent="handleSaveRemark">
          <label>
            <span>备注</span>
            <input
              v-model.trim="editingRemark"
              type="text"
              maxlength="80"
              placeholder="我自己的key"
            />
          </label>

          </form>
        </div>
      </div>
    </Transition>

    <Transition name="provider-dialog">
      <div v-if="showDeleteDialog" class="dialog-overlay" @mousedown.self="closeDeleteDialog">
        <div class="dialog-card dialog-card--compact">
          <div class="dialog-header">
            <div class="provider-dialog-header-actions">
              <button type="button" class="dialog-close-icon" :disabled="app.providerKeyLoading.value" @click="closeDeleteDialog">
                <svg viewBox="0 0 1024 1024" aria-hidden="true">
                  <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
                </svg>
              </button>
              <button type="button" class="primary-button provider-dialog-submit danger-button" :disabled="app.providerKeyLoading.value" @click="handleDelete">
                {{ app.providerKeyLoading.value ? '删除中...' : '确认删除' }}
              </button>
            </div>
          </div>

          <div class="provider-dialog-form provider-dialog-form--compact">
            <p class="hint-text">删除后该百炼 Key 将不再参与平台调度，此操作不可撤销。</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.provider-dialog-enter-active,
.provider-dialog-leave-active {
  transition: opacity 0.22s ease;
}

.provider-dialog-enter-active .dialog-card,
.provider-dialog-leave-active .dialog-card {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.provider-dialog-enter-from,
.provider-dialog-leave-to {
  opacity: 0;
}

.provider-dialog-enter-from .dialog-card,
.provider-dialog-leave-to .dialog-card {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.provider-keys-page {
  display: grid;
  gap: 18px;
  width: 100%;
  max-width: 1120px;
  min-width: 0;
  margin: 0 auto;
}

.metrics-grid {
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  flex-wrap: nowrap;
  gap: 0;
  width: 100%;
}

.metric-card {
  flex: 1 1 0;
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.metric-card:not(:first-child) {
  position: relative;
}

.metric-card:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12%;
  bottom: 12%;
  width: 1px;
  background: var(--border-color);
}

.metric-card .page-card__body {
  display: grid;
  justify-items: center;
  text-align: center;
}

.metric-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.metric-value {
  display: block;
  font-size: clamp(22px, 2.2vw, 28px);
  letter-spacing: -0.04em;
}

.metric-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.list-card {
  min-height: 420px;
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.list-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 0;
}

.toolbar-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.table-body {
  margin-top: 14px;
  min-width: 0;
}

.page-card__body {
  min-width: 0;
  padding: 22px 24px;
}

.table-wrap table {
  min-width: 860px;
}

.table-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.empty-state {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.status-pill.status-active {
  background: var(--success-soft);
  color: var(--success);
}

.status-pill.status-warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.status-pill.status-muted {
  background: var(--surface-muted);
  color: var(--text-secondary);
}

.ratio-chip {
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.key-preview {
  color: var(--text-secondary);
  font-size: 12px;
}

.time-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.row-actions {
  display: inline-flex;
  gap: 10px;
  white-space: nowrap;
}

.row-actions .text-link-button {
  font-weight: 400;
}

.hint-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.provider-dialog-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.provider-dialog-form {
  display: grid;
  gap: 16px;
}

.provider-dialog-form label {
  justify-items: start;
  text-align: left;
}

.provider-dialog-form label > span {
  width: 100%;
  text-align: left;
  font-weight: 400;
}

.provider-dialog-form input {
  box-shadow: none;
}

.provider-dialog-form input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.provider-dialog-form input[type='number']::-webkit-outer-spin-button,
.provider-dialog-form input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.provider-dialog-form input:focus {
  box-shadow: none;
}

.provider-dialog-form--compact {
  padding-top: 6px;
}

.provider-dialog-submit {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #2783de;
  box-shadow: none;
  font-weight: 400;
}

.provider-dialog-submit:hover:not(:disabled) {
  background: #1f72c6;
  transform: none;
  box-shadow: none;
}

.dialog-card--compact {
  width: min(100%, 460px);
}

.danger-button {
  background: #dc2626;
  box-shadow: none;
}

.danger-button:hover:not(:disabled) {
  background: #b42318;
  transform: none;
  box-shadow: none;
}

.toolbar-right .secondary-button,
.toolbar-right .primary-button {
  border-radius: 6px;
  font-weight: 400;
}

.toolbar-right .secondary-button {
  box-shadow: none;
}

.toolbar-right .primary-button {
  border-radius: 6px;
  background: #2783de;
  box-shadow: none;
}

.toolbar-right .primary-button:hover:not(:disabled) {
  background: #1f72c6;
  box-shadow: none;
}

@media (max-width: 900px) {
  .metrics-grid {
    gap: 0;
    flex-wrap: nowrap;
  }
}
</style>
