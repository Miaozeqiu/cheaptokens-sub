<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()
const currentPage = ref(1)
const pageSize = ref(20)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(Number(app.revenueSharesTotal.value || 0) / pageSize.value)),
)

function formatTableTime(value) {
  const text = app.formatDateTime(value)
  if (!text || text === '--') return '--'
  return text.replace(/:\d{2}$/, '')
}

async function handlePageChange(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
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
      <div>
        <h2 class="page-title">收益分成记录</h2>
        <p class="page-subtitle">查看你的百炼 Key 调度产生的收益分成明细。</p>
      </div>
      <button type="button" class="secondary-button" :disabled="app.revenueSharesLoading.value" @click="app.fetchRevenueShares(currentPage, pageSize)">
        刷新
      </button>
    </div>

    <article class="page-card">
      <div class="page-card__body">
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

        <footer v-if="app.revenueSharesTotal.value > 0" class="list-foot">
          <span class="page-meta">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <div class="foot-actions">
            <button type="button" class="secondary-button" :disabled="currentPage <= 1 || app.revenueSharesLoading.value" @click="handlePageChange(currentPage - 1)">上一页</button>
            <button type="button" class="secondary-button" :disabled="currentPage >= totalPages || app.revenueSharesLoading.value" @click="handlePageChange(currentPage + 1)">下一页</button>
          </div>
        </footer>
      </div>
    </article>
  </div>
</template>

<style scoped>
.revenue-shares-page {
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

.parent-share {
  color: var(--warning);
}

.sub-share {
  color: var(--success);
}

.time-text,
.page-meta {
  color: var(--text-secondary);
  font-size: 12px;
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
</style>
