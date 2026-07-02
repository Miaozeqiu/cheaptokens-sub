<script setup>
import { onMounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()

const showCreateDialog = ref(false)
const showRatioDialog = ref(false)
const showRemarkDialog = ref(false)
const editingKeyId = ref(null)
const editingRatio = ref(0.8)
const editingRemark = ref('')

const columns = [
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 160, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '倍率', dataIndex: 'ratio', key: 'ratio', width: 90 },
  { title: '总收益', dataIndex: 'total_income', key: 'total_income', width: 120 },
  { title: 'Key 预览', dataIndex: 'key_preview', key: 'key_preview', width: 160 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]

function formatProviderKeyStatus(status) {
  const map = {
    active: '可用',
    insufficient_balance: '余额不足',
    invalid: 'Key 无效',
    disabled: '已停用',
  }
  return map[status] || status || '未知'
}

function statusColor(status) {
  const map = {
    active: 'green',
    insufficient_balance: 'orange',
    invalid: 'red',
    disabled: 'default',
  }
  return map[status] || 'default'
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
    <div class="page-header">
      <div>
        <h2 class="page-title">百炼 Key 管理</h2>
        <p class="page-subtitle">管理你的百炼 API Key，参与平台调度获取收益分成。</p>
      </div>
      <div class="header-actions">
        <a-button :loading="app.providerKeyLoading.value" @click="app.fetchProviderKeys">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="openCreateDialog">
          <template #icon><PlusOutlined /></template>
          添加 Key
        </a-button>
      </div>
    </div>

    <a-table
      class="provider-table"
      :data-source="app.providerKeys.value"
      :columns="columns"
      :loading="app.providerKeyLoading.value"
      :pagination="false"
      row-key="id"
      size="middle"
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'remark'">
          <a-button type="link" size="small" @click="openRemarkEditor(record)">
            {{ record.remark || '添加备注' }}
          </a-button>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            {{ formatProviderKeyStatus(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'ratio'">
          <a-button type="link" size="small" @click="openRatioEditor(record)">
            {{ app.formatRatio(record.ratio) }}
          </a-button>
        </template>
        <template v-else-if="column.key === 'total_income'">
          {{ app.formatMoney(record.total_income) }}
        </template>
        <template v-else-if="column.key === 'key_preview'">
          <code class="key-preview">{{ record.key_preview }}</code>
        </template>
        <template v-else-if="column.key === 'created_at'">
          {{ app.formatDateTime(record.created_at) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openRemarkEditor(record)">
              <template #icon><EditOutlined /></template>
              备注
            </a-button>
            <a-button type="link" size="small" @click="openRatioEditor(record)">
              <template #icon><EditOutlined /></template>
              倍率
            </a-button>
            <a-button type="link" danger size="small" @click="handleDelete(record.id)">
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </a-space>
        </template>
      </template>

      <template #emptyText>
        <div class="empty-text">暂无百炼 Key，可先添加一个用于参与调度。</div>
      </template>
    </a-table>

    <!-- 创建 Key 对话框 -->
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

    <!-- 修改倍率对话框 -->
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

    <!-- 修改备注对话框 -->
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
  max-width: 1200px;
  margin: 0 auto;
  min-width: 0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #262626;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #8c8c8c;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.key-preview {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #595959;
}

.empty-text {
  padding: 32px 0;
  color: #8c8c8c;
  text-align: center;
}

.hint-text {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.dialog-hint {
  margin: 0 0 16px;
  color: #8c8c8c;
  font-size: 14px;
}

.provider-table {
  max-width: 100%;
}

.provider-table :deep(.ant-table-wrapper) {
  max-width: 100%;
}

.provider-table :deep(.ant-table-container) {
  max-width: 100%;
}

.provider-table :deep(.ant-table-content) {
  max-width: 100%;
  overflow-x: auto;
}
</style>
