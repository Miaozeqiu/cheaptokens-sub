<script setup>
import { onMounted, ref, computed } from 'vue'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()

const currentPage = ref(1)
const pageSize = ref(20)

const columns = [
  { title: '时段', dataIndex: 'hour_bucket', key: 'hour_bucket', width: 180 },
  { title: 'Key 备注', dataIndex: 'provider_key_remark', key: 'provider_key_remark', width: 160, ellipsis: true },
  { title: '子收益', dataIndex: 'sub_income', key: 'sub_income', width: 120 },
  { title: '主账户分成', dataIndex: 'parent_share', key: 'parent_share', width: 120 },
  { title: '自己所得', dataIndex: 'sub_share', key: 'sub_share', width: 120 },
  { title: '分成比例', dataIndex: 'revenue_share_rate', key: 'revenue_share_rate', width: 100 },
  { title: '请求数', dataIndex: 'request_count', key: 'request_count', width: 80 },
]

const totalPages = computed(() => {
  return Math.ceil(Number(app.revenueSharesTotal.value) / pageSize.value) || 1
})

async function handlePageChange(page) {
  currentPage.value = page
  await app.fetchRevenueShares(page, pageSize.value)
}

onMounted(() => {
  app.fetchRevenueShares(currentPage.value, pageSize.value)
})
</script>

<template>
  <div class="revenue-shares-page">
    <div class="page-header">
      <h2 class="page-title">收益分成记录</h2>
      <p class="page-subtitle">查看你的百炼 Key 调度产生的收益分成明细。</p>
    </div>

    <a-card class="table-card">
      <a-table
        :data-source="app.revenueShares.value"
        :columns="columns"
        :loading="app.revenueSharesLoading.value"
        row-key="id"
        size="middle"
        :scroll="{ x: 800 }"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: app.revenueSharesTotal.value,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
          onChange: handlePageChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'hour_bucket'">
            {{ app.formatDateTime(record.hour_bucket) }}
          </template>
          <template v-else-if="column.key === 'provider_key_remark'">
            {{ record.provider_key_remark || '--' }}
          </template>
          <template v-else-if="column.key === 'sub_income'">
            {{ app.formatMoney(record.sub_income) }}
          </template>
          <template v-else-if="column.key === 'parent_share'">
            <span class="parent-share">{{ app.formatMoney(record.parent_share) }}</span>
          </template>
          <template v-else-if="column.key === 'sub_share'">
            <span class="sub-share">{{ app.formatMoney(record.sub_share) }}</span>
          </template>
          <template v-else-if="column.key === 'revenue_share_rate'">
            <a-tag color="blue">{{ app.formatRatio(record.revenue_share_rate) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'request_count'">
            {{ Number(record.request_count || 0) }}
          </template>
        </template>

        <template #emptyText>
          <div class="empty-text">暂无收益分成记录。</div>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.revenue-shares-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
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

.table-card {
  border-radius: 8px;
}

.parent-share {
  color: #fa8c16;
  font-weight: 500;
}

.sub-share {
  color: #52c41a;
  font-weight: 600;
}

.empty-text {
  padding: 32px 0;
  color: #8c8c8c;
  text-align: center;
}
</style>
