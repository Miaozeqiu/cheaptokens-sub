<script setup>
import { computed, onMounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()

const showCreateDialog = ref(false)
const showRatioDialog = ref(false)
const showRemarkDialog = ref(false)
const editingKeyId = ref(null)
const editingRatio = ref(0.8)
const editingRemark = ref('')

const activeKeyCount = computed(() =>
  app.providerKeys.value.filter((item) => item.status === 'active').length,
)

const totalIncome = computed(() =>
  app.providerKeys.value.reduce((sum, item) => sum + Number(item.total_income || 0), 0),
)

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

async function handleCreate() {
  const result = await app.createProviderKey()
  if (result.ok) {
    message.success(result.message || '创建成功')
    closeCreateDialog()
  } else {
    message.error(result.message || '创建失败')
  }
}

function handleDelete(id) {
  Modal.confirm({
    title: '确认删除',
    content: '确认删除这个百炼 Key 吗？删除后将不再参与平台调度。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      const result = await app.deleteProviderKey(id)
      if (result.ok) {
        message.success(result.message || '删除成功')
      } else {
        message.error(result.message || '删除失败')
      }
    },
  })
}

async function handleSaveRatio() {
  if (!editingKeyId.value) return
  const result = await app.updateProviderKeyRatio(editingKeyId.value, editingRatio.value)
  if (result.ok) {
    message.success(result.message || '更新成功')
    closeRatioEditor()
  } else {
    message.error(result.message || '更新失败')
  }
}

async function handleSaveRemark() {
  if (!editingKeyId.value) return
  const result = await app.updateProviderKeyRemark(editingKeyId.value, editingRemark.value)
  if (result.ok) {
    message.success(result.message || '更新成功')
    closeRemarkEditor()
  } else {
    message.error(result.message || '更新失败')
  }
}

onMounted(() => {
  app.fetchProviderKeys()
})
</script>

<template>
  <div class="provider-keys-page">
    <section class="metrics-grid">
      <article class="metric-card">
        <span class="metric-label">百炼 Key 总数</span>
        <strong class="metric-value">{{ app.providerKeys.value.length }}</strong>
        <p class="metric-hint">已添加的 Key 数量</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">可用 Key</span>
        <strong class="metric-value">{{ activeKeyCount }}</strong>
        <p class="metric-hint">当前可参与调度</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">累计收益</span>
        <strong class="metric-value">{{ app.formatMoney(totalIncome) }}</strong>
        <p class="metric-hint">所有 Key 汇总</p>
      </article>
    </section>

    <article class="list-card">
      <header class="list-toolbar">
        <div class="toolbar-left">
          <h3 class="list-title">百炼 Key 列表</h3>
          <span class="list-meta">管理 API Key，参与平台调度获取收益</span>
        </div>
        <div class="toolbar-right">
          <button type="button" class="icon-action-button" :disabled="app.providerKeyLoading.value" aria-label="刷新" @click="app.fetchProviderKeys">
            <ReloadOutlined />
          </button>
          <button type="button" class="action-button" @click="openCreateDialog">
            <PlusOutlined />
            <span>添加 Key</span>
          </button>
        </div>
      </header>

      <div class="table-body">
        <div v-if="app.providerKeyLoading.value && !app.providerKeys.value.length" class="table-state">
          <span>正在加载…</span>
        </div>
        <div v-else-if="!app.providerKeys.value.length" class="table-state">
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
                  <span class="status-pill" :class="statusChipClass(record.status)">
                    {{ formatProviderKeyStatus(record.status) }}
                  </span>
                </td>
                <td>
                  <button type="button" class="ratio-chip" @click="openRatioEditor(record)">
                    {{ app.formatRatio(record.ratio) }}
                  </button>
                </td>
                <td><strong>{{ app.formatMoney(record.total_income) }}</strong></td>
                <td><code class="key-preview">{{ record.key_preview }}</code></td>
                <td class="time-text">{{ formatTableTime(record.created_at) }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="text-link-button" @click="openRemarkEditor(record)">备注</button>
                    <button type="button" class="text-link-button" @click="openRatioEditor(record)">倍率</button>
                    <button type="button" class="text-link-button danger" @click="handleDelete(record.id)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>

    <a-modal
      v-model:open="showCreateDialog"
      title="添加百炼 Key"
      :confirm-loading="app.providerKeyLoading.value"
      ok-text="创建"
      cancel-text="取消"
      :mask-closable="false"
      @ok="handleCreate"
      @cancel="closeCreateDialog"
    >
      <a-form layout="vertical">
        <a-form-item label="备注">
          <a-input
            v-model:value="app.createProviderKeyForm.value.remark"
            placeholder="例如：主账号 / 北京地域"
            :maxlength="80"
          />
        </a-form-item>
        <a-form-item label="阿里云百炼 API Key">
          <a-input-password
            v-model:value="app.createProviderKeyForm.value.api_key"
            placeholder="粘贴百炼 API Key"
          />
        </a-form-item>
        <a-form-item label="API Host">
          <a-input
            v-model:value="app.createProviderKeyForm.value.base_url"
            placeholder="https://dashscope.aliyuncs.com"
          />
        </a-form-item>
        <a-form-item label="收益倍率">
          <a-input-number
            v-model:value="app.createProviderKeyForm.value.ratio"
            :min="0.01"
            :max="0.8"
            :step="0.01"
            style="width: 100%"
          />
          <div class="hint-text">倍率范围 0.01 - 0.80，较低倍率会提高调度优先级。</div>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="showRatioDialog"
      title="调整收益倍率"
      :confirm-loading="app.providerKeyLoading.value"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSaveRatio"
      @cancel="closeRatioEditor"
    >
      <p class="dialog-hint">较低倍率会提高调度优先级，但单次调用收入也会相应降低。</p>
      <a-form layout="vertical">
        <a-form-item label="收益倍率">
          <a-input-number
            v-model:value="editingRatio"
            :min="0.01"
            :max="0.8"
            :step="0.01"
            style="width: 100%"
          />
          <div class="hint-text">当前设置：{{ app.formatRatio(editingRatio) }}</div>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="showRemarkDialog"
      title="编辑备注"
      :confirm-loading="app.providerKeyLoading.value"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSaveRemark"
      @cancel="closeRemarkEditor"
    >
      <a-form layout="vertical">
        <a-form-item label="备注">
          <a-input
            v-model:value="editingRemark"
            placeholder="例如：主账号 / 北京地域"
            :maxlength="80"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.provider-keys-page {
  display: grid;
  gap: 20px;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-card);
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.metric-value {
  font-size: clamp(20px, 2.2vw, 26px);
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.metric-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.list-card {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-card);
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
  display: grid;
  gap: 4px;
}

.toolbar-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
}

.action-button:hover:not(:disabled) {
  background: #039be5;
  color: #fff;
}

.icon-action-button {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-action-button:hover:not(:disabled) {
  background: #039be5;
  color: #fff;
}

.table-body {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
  overflow: auto;
}

.table-wrap {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.table-wrap table {
  min-width: 860px;
}

.table-state {
  display: grid;
  gap: 8px;
  place-content: center;
  min-height: 220px;
  padding: 24px;
  border: 1px dashed var(--border-color);
  border-radius: 14px;
  text-align: center;
}

.table-state h4 {
  margin: 0;
}

.table-state p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.key-preview {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.time-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-pill.status-active {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.status-pill.status-warning {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.status-pill.status-muted {
  background: #f4f4f6;
  color: var(--text-secondary);
}

.ratio-chip {
  padding: 3px 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(3, 169, 244, 0.1);
  color: #0284c7;
  font-size: 12px;
  font-weight: 700;
}

.row-actions {
  display: inline-flex;
  gap: 8px;
  white-space: nowrap;
}

.text-link-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.text-link-button.danger {
  color: #ef4444;
}

.hint-text,
.dialog-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dialog-hint {
  margin: 0 0 16px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
