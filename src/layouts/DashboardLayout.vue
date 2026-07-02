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
      <div class="logo-area">
        <span class="logo-sub">子账户工作台</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
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
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="dashboard-header">
        <div class="header-user">
          <span class="user-name">{{ app.currentUser.value?.name || '子账户' }}</span>
        </div>
        <a-button type="text" class="logout-btn" @click="handleLogout">
          <template #icon><LogoutOutlined /></template>
          退出
        </a-button>
      </a-layout-header>

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
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  height: 56px;
  line-height: 56px;
}

.header-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.user-email {
  font-size: 12px;
  color: #8c8c8c;
}

.logout-btn {
  color: #ff4d4f;
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

  .header-user {
    display: none;
  }
}
</style>
