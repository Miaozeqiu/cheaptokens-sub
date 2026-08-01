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

const hasParentContact = computed(() =>
  Boolean(
    String(app.parentContact.value?.wechat_account || '').trim() ||
    String(app.parentContact.value?.wechat_image_proxy_path || '').trim(),
  ),
)

const parentContactImageUrl = computed(() => {
  const path = String(app.parentContact.value?.wechat_image_proxy_path || '').trim()
  if (!path) return ''
  const token = String(app.authToken.value || '').trim()
  const baseUrl = app.apiUrl(path)
  if (!token) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`
})

async function handleLogout() {
  await app.logout()
  router.replace('/login')
}

onMounted(() => {
  Promise.all([app.fetchWallet(), app.fetchParentContact()])
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

        <section class="parent-contact-card" aria-label="主账户联系方式">
          <header class="parent-contact-card__head">
            <h3 class="parent-contact-card__title">主账户联系方式</h3>
          </header>
          <div v-if="app.parentContactLoading.value" class="parent-contact-card__empty">
            正在加载…
          </div>
          <div v-else-if="!hasParentContact" class="parent-contact-card__empty">
            主账户暂未设置联系方式
          </div>
          <div v-else class="parent-contact-card__body">
            <div v-if="app.parentContact.value.wechat_account" class="parent-contact-row">
              <span class="my-label">微信号</span>
              <strong class="my-value">{{ app.parentContact.value.wechat_account }}</strong>
            </div>
            <div class="parent-contact-image-block">
              <span class="my-label">微信图片</span>
              <a
                v-if="parentContactImageUrl"
                class="parent-contact-image-link"
                :href="parentContactImageUrl"
                target="_blank"
                rel="noreferrer"
              >
                <img class="parent-contact-image" :src="parentContactImageUrl" alt="主账户微信图片" />
              </a>
              <div v-else class="parent-contact-image-empty">未上传</div>
            </div>
          </div>
        </section>

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

.parent-contact-card {
  margin-top: 22px;
  padding: 16px 0 4px;
  border-top: 1px solid var(--border-color);
}

.parent-contact-card__head {
  margin-bottom: 10px;
}

.parent-contact-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.parent-contact-card__empty {
  padding: 8px 0 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.parent-contact-card__body {
  display: grid;
  gap: 14px;
}

.parent-contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 40px;
}

.parent-contact-image-block {
  display: grid;
  gap: 8px;
}

.parent-contact-image-link {
  display: inline-flex;
  width: fit-content;
}

.parent-contact-image,
.parent-contact-image-empty {
  width: 148px;
  height: 148px;
  border-radius: 12px;
  object-fit: cover;
  background: #f4f4f6;
}

.parent-contact-image-empty {
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-size: 13px;
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
