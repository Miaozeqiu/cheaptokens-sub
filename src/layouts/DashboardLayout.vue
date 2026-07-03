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
      width="220"
    >
      <div class="sider-inner">
        <div class="logo-area">
          <span class="logo-sub">子账户工作台</span>
        </div>
        <a-menu
          :selectedKeys="selectedKeys"
          mode="inline"
          theme="dark"
          class="dashboard-menu"
        >
          <a-menu-item key="overview" @click="router.push('/app/overview')">
            <template #icon><DashboardOutlined /></template>
            总览
          </a-menu-item>
          <a-menu-item key="provider-keys" @click="router.push('/app/provider-keys')">
            <template #icon><KeyOutlined /></template>
            百炼 Key 管理
          </a-menu-item>
        </a-menu>
        <div class="sider-user-panel">
          <div class="sider-user-meta">
            <span class="sider-user-label">当前账号</span>
            <strong class="sider-user-name">{{ app.currentUser.value?.name || '子账户' }}</strong>
          </div>
          <a-button type="text" class="logout-btn" block @click="handleLogout">
            <template #icon><LogoutOutlined /></template>
            退出登录
          </a-button>
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
}

.dashboard-sider {
  background: #001529;
}

.sider-inner {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-sub {
  margin-top: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.dashboard-menu {
  border-inline-end: none;
  flex: 1;
  min-height: 0;
}

.sider-user-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sider-user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sider-user-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.sider-user-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.logout-btn {
  justify-content: flex-start;
  color: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.dashboard-content {
  padding: 24px;
  background: #f5f5f5;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 16px;
  }
}
</style>
