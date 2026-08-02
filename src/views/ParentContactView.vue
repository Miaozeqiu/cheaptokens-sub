<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const app = useSubApp()
const copied = ref(false)
let copiedTimer = null

const breadcrumbItems = [
  { label: '我的', path: '/app/me' },
  { label: '主账户联系方式', path: '/app/me/contact' },
]

const wechatAccount = computed(() =>
  String(app.parentContact.value?.wechat_account || '').trim(),
)

const hasParentContact = computed(() =>
  Boolean(
    wechatAccount.value ||
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

async function handleCopyWechat() {
  if (!wechatAccount.value) {
    showToast('当前没有可复制的微信号', 'error')
    return
  }
  try {
    await navigator.clipboard.writeText(wechatAccount.value)
    copied.value = true
    showToast('微信号已复制', 'success')
    if (copiedTimer) window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    showToast('复制失败，请手动复制', 'error')
  }
}

onMounted(() => {
  app.fetchParentContact()
})
</script>

<template>
  <div class="parent-contact-page">
    <div class="section-topbar">
      <RouterLink class="section-back-link" to="/app/me">
        <svg viewBox="0 0 1097 1024" aria-hidden="true">
          <path
            d="M357.083429 15.945143a54.930286 54.930286 0 0 1 0 77.019428L190.390857 262.144h530.944a384.950857 384.950857 0 0 1 375.881143 380.928A384.950857 384.950857 0 0 1 721.334857 1024H484.059429a54.418286 54.418286 0 0 1 0-108.836571h237.348571a272.164571 272.164571 0 1 0 0-544.256H175.908571l181.248 183.954285a55.003429 55.003429 0 0 1-1.828571 75.337143 53.101714 53.101714 0 0 1-73.801143 1.974857L15.725714 362.496a54.930286 54.930286 0 0 1 0-76.946286L281.526857 15.945143a53.101714 53.101714 0 0 1 75.849143 0z"
            fill="currentColor"
          />
        </svg>
        <span>返回</span>
      </RouterLink>

      <nav class="section-breadcrumb" aria-label="页面路径">
        <template v-for="(item, index) in breadcrumbItems" :key="item.path">
          <RouterLink class="section-breadcrumb__link" :to="item.path">
            {{ item.label }}
          </RouterLink>
          <span
            v-if="index < breadcrumbItems.length - 1"
            class="section-breadcrumb__separator"
            aria-hidden="true"
          >></span>
        </template>
      </nav>
    </div>

    <article class="contact-card">
      <div v-if="app.parentContactLoading.value" class="contact-empty">正在加载…</div>
      <div v-else-if="!hasParentContact" class="contact-empty">主账户暂未设置联系方式</div>
      <div v-else class="contact-form">
        <div class="contact-field">
          <span class="contact-field__label">微信号</span>
          <div class="contact-field__value-row">
            <strong class="contact-field__value">
              {{ wechatAccount || '未设置' }}
            </strong>
            <button
              v-if="wechatAccount"
              type="button"
              class="copy-button"
              :title="copied ? '已复制' : '复制微信号'"
              :aria-label="copied ? '已复制' : '复制微信号'"
              @click="handleCopyWechat"
            >
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M96 224l160-160h351.872C643.296 64 672 92.48 672 128.128V192h-64V159.968A31.776 31.776 0 0 0 576.032 128H352v160H160v448.032c0 17.92 14.304 31.968 31.968 31.968H256v64H160.128A63.968 63.968 0 0 1 96 767.872V224z m192-96L192 224h96V128z m64 288l160-160h352.16C899.424 256 928 284.512 928 319.712V896.32A63.744 63.744 0 0 1 864.16 960h-448.32A63.776 63.776 0 0 1 352 896.288V416z m192-96l-128 128h128v-128z m64 192h-192v352.224a32 32 0 0 0 32.224 31.776h383.552A32 32 0 0 0 864 864.224V351.776A32 32 0 0 0 831.776 320H608v192z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="contact-divider" aria-hidden="true" />

        <div class="contact-field">
          <span class="contact-field__label">微信图片</span>
          <a
            v-if="parentContactImageUrl"
            class="contact-image-link"
            :href="parentContactImageUrl"
            target="_blank"
            rel="noreferrer"
          >
            <img class="contact-image" :src="parentContactImageUrl" alt="主账户微信图片" />
          </a>
          <div v-else class="contact-image contact-image--empty">未上传</div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.parent-contact-page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
}

.section-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.section-back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #488eff;
  text-decoration: none;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.section-back-link svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.section-back-link span {
  font-size: 14px;
  line-height: 1.5;
}

.section-back-link:hover {
  color: #2f6fd5;
}

.section-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.section-breadcrumb__link {
  color: var(--text-secondary);
  text-decoration: none;
}

.section-breadcrumb__link:hover {
  color: var(--text-primary);
}

.section-breadcrumb__separator {
  color: var(--text-secondary);
}

.contact-card {
  min-width: 0;
}

.contact-empty {
  padding: 8px 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.contact-form {
  display: grid;
  gap: 0;
  margin-top: 8px;
}

.contact-field {
  display: grid;
  gap: 8px;
  padding: 16px 0;
}

.contact-field__label {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

.contact-field__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.contact-field__value-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.contact-field__value-row .contact-field__value {
  flex: 1 1 auto;
  min-width: 0;
}

.copy-button {
  width: 32px;
  min-width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: #e9eaef;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  cursor: pointer;
}

.copy-button svg {
  width: 16px;
  height: 16px;
}

.copy-button:hover {
  background: #dcdce2;
  color: var(--text-primary);
}

.contact-divider {
  height: 0;
  border: 0;
  border-top: 1px solid var(--border-color);
}

.contact-image-link {
  display: inline-block;
  width: 160px;
}

.contact-image {
  display: block;
  width: 160px;
  aspect-ratio: 207 / 281;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  object-fit: contain;
  background: #fafafa;
}

.contact-image--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
