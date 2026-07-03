<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

async function handleLogout() {
  await app.logout()
  router.replace('/login')
}

onMounted(() => {
  app.fetchWallet()
})
</script>

<template>
  <div class="my-panel">
    <header class="my-header">
      <div>
        <h2>我的</h2>
        <p>查看当前账户信息并退出登录。</p>
      </div>
      <button type="button" class="secondary-button" @click="handleLogout">退出登录</button>
    </header>

    <div class="my-list">
      <div v-for="item in accountItems" :key="item.label" class="my-row">
        <span class="my-label">{{ item.label }}</span>
        <span class="my-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-panel {
  min-height: calc(100vh - 180px);
}

.my-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-color);
}

.my-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.my-header p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.my-list {
  display: grid;
  gap: 0;
  margin-top: 18px;
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

@media (max-width: 640px) {
  .my-panel {
    min-height: auto;
  }

  .my-header {
    flex-direction: column;
  }

  .my-header .secondary-button {
    width: 100%;
  }

  .my-row {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 4px;
  }

  .my-value {
    text-align: left;
  }
}
</style>
