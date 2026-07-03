<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  DashboardOutlined,
  KeyOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useSubApp } from '../composables/useSubApp'

const router = useRouter()
const app = useSubApp()

const selectedKeys = computed(() => {
  const path = router.currentRoute.value.path
  if (path.startsWith('/app/provider-keys')) return ['provider-keys']
  return ['overview']
})

async function handleLogout() {
  await app.logout()
  router.replace('/login')
}
</script>

<template>
  <a-layout class="dashboard-layout">
    <a-layout-sider
      breakpoint="lg"
      collapsible
      :trigger="null"
      class="dashboard-sider"
      width="232"
    >
      <div class="sider-inner">
        <div class="logo-area">
          <span class="logo-title">子账户工作台</span>
          <span class="logo-sub">百炼 Key 调度与收益</span>
        </div>
        <a-menu
          :selectedKeys="selectedKeys"
          mode="inline"
          class="dashboard-menu"
        >
          <a-menu-item key="overview" @click="router.push('/app/overview')">
            <template #icon><DashboardOutlined /></template>
            收益与提现
          </a-menu-item>
          <a-menu-item key="provider-keys" @click="router.push('/app/provider-keys')">
            <template #icon><KeyOutlined /></template>
            百炼 Key
          </a-menu-item>
        </a-menu>
        <div class="sider-user-panel">
          <div class="sider-user-meta">
            <span class="sider-user-label">当前账号</span>
            <strong class="sider-user-name">{{ app.currentUser.value?.name || '子账户' }}</strong>
            <span v-if="app.currentUser.value?.email" class="sider-user-email">{{ app.currentUser.value.email }}</span>
          </div>
          <button type="button" class="logout-btn" @click="handleLogout">
            <LogoutOutlined />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-content class="dashboard-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: var(--bg-color);
}

.dashboard-sider {
  background: #fff !important;
  border-right: 1px solid var(--border-color);
  box-shadow: 6px 0 18px rgba(15, 23, 42, 0.04);
}

.dashboard-sider :deep(.ant-layout-sider-children) {
  background: transparent;
}

.sider-inner {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px 20px 18px;
  border-bottom: 1px solid var(--border-color);
}

.logo-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.logo-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.dashboard-menu {
  flex: 1;
  min-height: 0;
  padding: 12px 10px;
  border-inline-end: none !important;
  background: transparent !important;
}

.dashboard-menu :deep(.ant-menu-item) {
  height: 42px;
  margin: 4px 0;
  border-radius: 10px;
  color: var(--text-secondary);
  font-weight: 500;
}

.dashboard-menu :deep(.ant-menu-item-selected) {
  background: var(--accent-soft) !important;
  color: #0284c7 !important;
}

.dashboard-menu :deep(.ant-menu-item:hover) {
  color: var(--text-primary) !important;
}

.sider-user-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.sider-user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sider-user-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sider-user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sider-user-email {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: #fff;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  border-color: #fca5a5;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
}

.dashboard-content {
  padding: 24px 28px;
  background: var(--bg-color);
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 16px;
  }
}
</style>
