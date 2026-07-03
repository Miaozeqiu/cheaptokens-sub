<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useSubApp } from '../composables/useSubApp'

const router = useRouter()
const app = useSubApp()

const accountItems = computed(() => [
  {
    label: '用户名',
    value: app.currentUser.value?.name || '未设置',
  },
  {
    label: '邮箱',
    value: app.currentUser.value?.email || '-',
  },
  {
    label: '钱包余额',
    value: app.walletLoading.value ? '加载中...' : app.formatMoney(app.wallet.value?.balance),
  },
])

const subEntries = [
  {
    key: 'overview',
    label: '收益记录',
    path: '/app/me/overview',
  },
  {
    key: 'payout',
    label: '收款信息',
    path: '/app/me/payout-settings',
  },
]

async function handleLogout() {
  await app.logout()
  router.replace('/login')
}

onMounted(() => {
  app.fetchWallet()
})
</script>

<template>
  <div class="my-page">
    <div class="my-panel">
      <div class="my-content">
        <div class="my-list">
          <div v-for="item in accountItems" :key="item.label" class="my-row">
            <span class="my-label">{{ item.label }}</span>
            <span class="my-value">{{ item.value }}</span>
          </div>
        </div>

        <div class="my-entry-list" aria-label="我的子页面入口">
          <RouterLink
            v-for="item in subEntries"
            :key="item.key"
            :to="item.path"
            class="my-entry"
          >
            <span class="my-entry__label">{{ item.label }}</span>
            <span class="my-entry__arrow" aria-hidden="true">></span>
          </RouterLink>
        </div>

        <div class="my-actions">
          <button type="button" class="secondary-button my-logout-button" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.my-panel {
  display: grid;
}

.my-content {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 180px);
}

.my-list {
  display: grid;
  gap: 0;
}

.my-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0 4px;
  border-bottom: 1px solid var(--border-color);
}

.my-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.my-value {
  color: var(--text-primary);
  font-size: 14px;
  text-align: right;
  word-break: break-all;
}

.my-entry-list {
  display: grid;
  margin-top: 18px;
}

.my-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0 4px;
  color: var(--text-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--border-color);
}

.my-entry__label {
  font-size: 14px;
}

.my-entry__arrow {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1;
}

.my-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.my-logout-button {
  font-weight: 400;
}

@media (max-width: 640px) {
  .my-content {
    min-height: auto;
  }

  .my-row,
  .my-entry {
    align-items: flex-start;
    padding: 14px 4px;
  }

  .my-row {
    flex-direction: column;
  }

  .my-value {
    text-align: left;
  }

}
</style>
