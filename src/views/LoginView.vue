<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const route = useRoute()
const router = useRouter()
const app = useSubApp()
const mode = ref('login')
const modeSwitchRef = ref(null)
const modeIndicatorStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: 0,
})
const showSendCodeDialog = ref(false)
const inviteCodeFromQuery = computed(() => String(route.query.invite || route.query.invite_code || '').trim())

const sendCodeDisabled = computed(() => (
  app.sendingCode.value
  || app.cooldown.value > 0
))

const registerSubmitting = computed(() => (
  app.registerLoading.value
  || app.authGuard.refreshing
  || app.authGuard.solving
))

function setStatus(text, type = 'info') {
  showToast(text, type)
}

function applyInviteCodeFromQuery() {
  if (!inviteCodeFromQuery.value) {
    return
  }
  app.registerForm.value.invite_code = inviteCodeFromQuery.value
  mode.value = 'register'
}

function switchMode(nextMode) {
  mode.value = nextMode
  setStatus('', 'info')
}

function updateModeIndicator(target) {
  if (!modeSwitchRef.value || !target) {
    return
  }
  const navRect = modeSwitchRef.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  modeIndicatorStyle.value = {
    width: `${targetRect.width}px`,
    transform: `translateX(${targetRect.left - navRect.left}px)`,
    opacity: 1,
  }
}

function resetModeIndicator() {
  const activeButton = modeSwitchRef.value?.querySelector('.mode-switch__item.active')
  if (!activeButton) {
    modeIndicatorStyle.value = {
      ...modeIndicatorStyle.value,
      opacity: 0,
    }
    return
  }
  updateModeIndicator(activeButton)
}

watch(mode, async () => {
  setStatus('', 'info')
  await nextTick()
  resetModeIndicator()
})

watch(
  () => inviteCodeFromQuery.value,
  (nextInvite) => {
    if (!nextInvite) {
      return
    }
    app.registerForm.value.invite_code = nextInvite
    if (mode.value !== 'register') {
      mode.value = 'register'
    }
  },
  { immediate: true },
)

onMounted(() => {
  applyInviteCodeFromQuery()
  nextTick(() => {
    resetModeIndicator()
  })
  window.addEventListener('resize', resetModeIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resetModeIndicator)
})

async function handleSubmit() {
  setStatus('', 'info')
  if (!app.loginForm.value.email || !app.loginForm.value.password) {
    setStatus('请输入邮箱和密码', 'error')
    return
  }
  const result = await app.submitLogin()
  if (!result.ok) {
    setStatus(result.message, 'error')
    return
  }
  router.replace('/app/withdrawal')
}

async function openSendCodeDialog() {
  const email = String(app.registerForm.value.email || '').trim()
  if (!email) {
    setStatus('请先输入邮箱', 'error')
    return
  }
  setStatus('', 'info')
  app.authGuard.captchaCode = ''
  showSendCodeDialog.value = true
  try {
    await app.refreshAuthGuard()
  } catch (error) {
    setStatus(error.message || '初始化图形验证码失败，请稍后重试', 'error')
  }
}

function closeSendCodeDialog() {
  if (app.sendingCode.value) return
  showSendCodeDialog.value = false
}

async function handleSendCode() {
  setStatus('', 'info')
  const result = await app.sendCode()
  if (!result.ok) {
    setStatus(result.message, 'error')
    return
  }
  showSendCodeDialog.value = false
  setStatus(result.message || '验证码已发送', 'success')
}

async function handleRegister() {
  setStatus('', 'info')
  if (!app.registerForm.value.name.trim()) {
    setStatus('请输入名称', 'error')
    return
  }
  if (!app.registerForm.value.email.trim()) {
    setStatus('请输入邮箱', 'error')
    return
  }
  if (!app.registerForm.value.invite_code.trim()) {
    setStatus('请填写主账户邀请码', 'error')
    return
  }
  if (!app.registerForm.value.code.trim()) {
    setStatus('请输入邮箱验证码', 'error')
    return
  }
  if (!app.registerForm.value.password || app.registerForm.value.password.length < 6) {
    setStatus('密码至少 6 位', 'error')
    return
  }
  const result = await app.submitRegister()
  if (!result.ok) {
    setStatus(result.message, 'error')
    return
  }
  setStatus(result.message || '注册成功，请直接登录', 'success')
  mode.value = 'login'
}
</script>

<template>
  <div class="login-page">
    <section class="auth-panel app-shell-card">
      <div class="mode-switch" ref="modeSwitchRef" role="tablist" aria-label="登录与注册">
        <div class="mode-switch__indicator" :style="modeIndicatorStyle" />
        <button
          type="button"
          class="mode-switch__item"
          :class="{ active: mode === 'login' }"
          role="tab"
          :aria-selected="mode === 'login'"
          @click="switchMode('login')"
        >
          登录
        </button>
        <button
          type="button"
          class="mode-switch__item"
          :class="{ active: mode === 'register' }"
          role="tab"
          :aria-selected="mode === 'register'"
          @click="switchMode('register')"
        >
          注册
        </button>
      </div>

      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>邮箱</span>
          <input
            v-model.trim="app.loginForm.value.email"
            type="email"
            autocomplete="email"
          />
        </label>

        <label class="field">
          <span>密码</span>
          <input
            v-model="app.loginForm.value.password"
            type="password"
            autocomplete="current-password"
          />
        </label>

        <button type="submit" class="primary-button submit-button" :disabled="app.loginLoading.value">
          {{ app.loginLoading.value ? '登录中...' : '进入工作台' }}
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="handleRegister">
        <label class="field">
          <span>名称</span>
          <input
            v-model.trim="app.registerForm.value.name"
            type="text"
            maxlength="32"
            placeholder="给这个子账户起个名字"
          />
        </label>

        <label class="field">
          <span>邮箱</span>
          <input
            v-model.trim="app.registerForm.value.email"
            type="email"
            autocomplete="email"
          />
        </label>

        <label class="field">
          <span>主账户邀请码</span>
          <input
            v-model.trim="app.registerForm.value.invite_code"
            type="text"
            maxlength="64"
          />
        </label>

        <div class="field">
          <span>邮箱验证码</span>
          <div class="code-row">
            <input
              v-model.trim="app.registerForm.value.code"
              type="text"
              maxlength="6"
            />

            <button
              type="button"
              class="secondary-button code-button"
              :disabled="sendCodeDisabled"
              @click="openSendCodeDialog"
            >
              {{
                app.sendingCode.value
                  ? '发送中...'
                  : app.cooldown.value > 0
                    ? `${app.cooldown.value}s`
                    : '发送验证码'
              }}
            </button>
          </div>
        </div>

        <label class="field">
          <span>密码</span>
          <input
            v-model="app.registerForm.value.password"
            type="password"
            autocomplete="new-password"
            placeholder="至少 6 位"
          />
        </label>

        <button type="submit" class="primary-button submit-button" :disabled="registerSubmitting">
          {{ registerSubmitting ? '处理中...' : '注册并绑定主账户' }}
        </button>
      </form>
    </section>

    <Transition name="auth-guard-dialog">
      <div v-if="showSendCodeDialog" class="dialog-overlay" @click.self="closeSendCodeDialog">
        <div class="dialog-card auth-guard-dialog">
          <div class="dialog-header auth-guard-dialog__header">
            <button type="button" class="dialog-close-icon" :disabled="app.sendingCode.value" @click="closeSendCodeDialog">
              <svg viewBox="0 0 1024 1024" aria-hidden="true">
                <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
              </svg>
            </button>
            <button type="button" class="primary-button auth-guard-dialog__submit" :disabled="app.sendingCode.value || app.authGuard.refreshing || app.authGuard.solving" @click="handleSendCode">
              {{ app.sendingCode.value ? '发送中...' : '确认发送' }}
            </button>
          </div>

          <div class="auth-guard-dialog__body">
            <div class="field auth-guard-field">
              <span>图形验证码</span>
              <div class="captcha-row auth-guard-row">
                <button
                  type="button"
                  class="captcha-preview"
                  :disabled="app.authGuard.refreshing"
                  @click="app.refreshAuthGuard"
                >
                  <img
                    v-if="app.authGuard.captchaImage"
                    :key="app.authGuard.captchaId"
                    :src="app.authGuard.captchaImage"
                    alt="图形验证码"
                  />
                  <span v-else class="captcha-preview__placeholder">加载中</span>
                </button>

                <input
                  v-model.trim="app.authGuard.captchaCode"
                  type="text"
                  maxlength="6"
                />

                <button
                  type="button"
                  class="secondary-button refresh-button"
                  :disabled="app.authGuard.refreshing"
                  @click="app.refreshAuthGuard"
                >
                  刷新
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.auth-guard-dialog-enter-active,
.auth-guard-dialog-leave-active {
  transition: opacity 0.22s ease;
}

.auth-guard-dialog-enter-active .dialog-card,
.auth-guard-dialog-leave-active .dialog-card {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.auth-guard-dialog-enter-from,
.auth-guard-dialog-leave-to {
  opacity: 0;
}

.auth-guard-dialog-enter-from .dialog-card,
.auth-guard-dialog-leave-to .dialog-card {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.auth-panel {
  display: grid;
  align-content: center;
  gap: 18px;
  width: min(100%, 460px);
  min-height: calc(100vh - 40px);
  padding: 32px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.mode-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  justify-self: center;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    4px 8px 20px rgba(0, 0, 0, 0.085),
    1px 3px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.mode-switch::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.42),
    rgba(255, 255, 255, 0.08) 45%,
    rgba(255, 255, 255, 0) 72%
  );
  pointer-events: none;
  z-index: 0;
}

.mode-switch__indicator {
  position: absolute;
  top: 6px;
  left: 0;
  height: calc(100% - 12px);
  border-radius: 999px;
  background: rgba(236, 236, 241, 0.78);
  transition:
    transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
    width 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.2s ease;
  pointer-events: none;
  z-index: 0;
}

.mode-switch__item {
  position: relative;
  z-index: 1;
  min-height: 42px;
  border: 0;
  padding: 8px 18px;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.mode-switch__item:hover {
  color: var(--text-primary);
}

.mode-switch__item.active {
  color: #6b6b6b;
  font-weight: 600;
}

.auth-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field > span {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

.field input {
  min-height: 46px;
  padding: 10px 14px;
  border: 0;
  box-shadow: none;
}

.field input:focus {
  border: 0;
  box-shadow: none;
}

.captcha-row {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.captcha-preview {
  height: 46px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: #f8fafc;
  overflow: hidden;
}

.captcha-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-preview__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-tertiary);
  font-size: 12px;
}

.refresh-button,
.code-button {
  white-space: nowrap;
}

.code-button {
  min-height: 46px;
  padding: 0 18px;
  font-weight: 400;
  align-self: stretch;
}

.auth-guard-dialog {
  width: min(100%, 560px);
}

.auth-guard-dialog__header {
  justify-content: space-between;
}

.auth-guard-dialog__submit {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #2783de;
  box-shadow: none;
  font-weight: 400;
}

.auth-guard-dialog__submit:hover:not(:disabled) {
  background: #1f72c6;
  transform: none;
  box-shadow: none;
}

.auth-guard-dialog__body {
  display: grid;
  gap: 14px;
}

.auth-guard-field {
  gap: 10px;
}

.auth-guard-row {
  grid-template-columns: 132px minmax(0, 1fr) auto;
}

.auth-guard-row input {
  background: #f3f3f3;
}

.auth-guard-row input:focus {
  background: #f3f3f3;
}

.submit-button {
  width: 100%;
  min-height: 46px;
  margin-top: 4px;
  border-radius: 6px;
  background: #2783de;
  box-shadow: none;
  font-weight: 400;
}

.submit-button:hover:not(:disabled) {
  background: #1f76cd;
  transform: none;
  box-shadow: none;
}

@media (max-width: 1100px) {
  .auth-panel {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 12px;
    gap: 12px;
  }

  .auth-panel {
    padding: 20px;
    border-radius: 22px;
  }

  .captcha-row,
  .auth-guard-row,
  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
