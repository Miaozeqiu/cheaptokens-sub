<script setup>
import lottie from 'lottie-web'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from '../composables/useToast'
import { useSubApp } from '../composables/useSubApp'

const route = useRoute()
const router = useRouter()
const app = useSubApp()
const mode = ref('login')
const modeSwitchRef = ref(null)
const authAnimationRef = ref(null)
const activeCarouselIndex = ref(0)
const modeIndicatorStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: 0,
})
const showSendCodeDialog = ref(false)
const inviteCodeFromQuery = computed(() => String(route.query.invite || route.query.invite_code || '').trim())
let authAnimationInstance = null

const carouselImages = [
  {
    src: '/aliyun-coupon-check-step-1.png',
    alt: '阿里云页面中查看卡券入口的截图',
  },
  {
    src: '/aliyun-coupon-check-step-2.png',
    alt: '阿里云卡券页面中查看300元优惠券的截图',
  },
]

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

function initAuthAnimation() {
  if (!authAnimationRef.value || authAnimationInstance) {
    return
  }
  authAnimationInstance = lottie.loadAnimation({
    container: authAnimationRef.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/blue-working-cat-animation.json',
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet',
    },
  })
}

function destroyAuthAnimation() {
  authAnimationInstance?.destroy()
  authAnimationInstance = null
}

function selectCarouselItem(index) {
  if (index < 0 || index >= carouselImages.length) {
    return
  }
  activeCarouselIndex.value = index
}

function handleWindowResize() {
  resetModeIndicator()
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
    handleWindowResize()
    initAuthAnimation()
  })
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  destroyAuthAnimation()
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
      <div v-if="showSendCodeDialog" class="dialog-overlay" @mousedown.self="closeSendCodeDialog">
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

    <div class="login-animation" aria-hidden="true">
      <div ref="authAnimationRef" class="login-animation__canvas" />
      <p class="login-animation__caption">分享你的Tokens给其他人</p>
    </div>

    <div class="login-guide">
      <img
        class="login-guide__image"
        src="/aliyun-student-coupon.png"
        alt="阿里云学生优惠券领取页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text">1. 领取阿里云学生优惠券</p>
        <p class="login-guide__desc">
          阿里云赠送了学生300的优惠券，这个优惠券可以当作余额使用。在消耗Tokens时，优惠券额度会实时抵扣。需要注意的是，每个模型有免费额度，而优惠券抵扣的额度，实际上是付费额度。
        </p>
      </div>
    </div>

    <section class="login-guide-carousel" aria-label="优惠券领取检查示意图">
      <div
        class="login-guide-carousel__stage"
        :class="`is-active-${activeCarouselIndex}`"
      >
        <button
          v-for="(image, index) in carouselImages"
          :key="image.src"
          type="button"
          class="login-guide-carousel__item"
          :class="{ 'is-active': activeCarouselIndex === index }"
          @click="selectCarouselItem(index)"
        >
          <span class="login-guide-carousel__media">
            <img
              class="login-guide-carousel__image"
              :src="image.src"
              :alt="image.alt"
            />
          </span>
        </button>
      </div>
      <p class="login-guide-carousel__caption">可以通过这里，检查券是否领取完成</p>
    </section>

    <div class="login-guide login-guide--secondary">
      <img
        class="login-guide__image"
        src="/aliyun-api-key-guide.png"
        alt="阿里云百炼平台创建 API KEY 的页面截图"
      />
      <div class="login-guide__content">
        <p class="login-guide__text">2. 在此处创建一个API_KEY</p>
        <p class="login-guide__desc">
          进入阿里云百炼平台，通过右上角的齿轮，进入API KEY的设置，创建一个KEY，业务空间选择默认即可。
        </p>
      </div>
    </div>

    <div class="login-guide-pair">
      <img
        class="login-guide-pair__image"
        src="/aliyun-key-created-result.png"
        alt="创建后显示 API Key 与 API Host 的结果截图"
      />
      <div class="login-guide-pair__arrow" aria-hidden="true">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M332.501333 183.168a42.666667 42.666667 0 0 1 57.621334-2.496l2.709333 2.496 298.666667 298.666667a42.666667 42.666667 0 0 1 2.496 57.621333l-2.496 2.709333-298.666667 298.666667a42.666667 42.666667 0 0 1-62.826667-57.621333l2.496-2.709334L600.96 512 332.501333 243.498667a42.666667 42.666667 0 0 1-2.496-57.621334l2.496-2.709333z" fill="currentColor" />
        </svg>
      </div>
      <img
        class="login-guide-pair__image"
        src="/aliyun-key-form-fields.png"
        alt="填写 API Key 与 API Host 的表单截图"
      />
    </div>

    <div class="login-guide-step">
      <p class="login-guide-step__title">3. 将API_KEY 与 API_HOST填入网站</p>
      <p class="login-guide-step__desc">网站会将你的tokens通过API调用的方式，分享给有需要的人</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 4px;
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
  min-height: auto;
  padding: 32px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.login-animation {
  width: min(100%, 520px);
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  pointer-events: none;
}

.login-animation__canvas {
  width: 100%;
  height: clamp(220px, 28vw, 320px);
  position: relative;
  z-index: 0;
}

.login-animation__caption {
  margin: 0;
  text-align: center;
  font-size: 64px;
  font-weight: 900;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  line-height: 1.4;
  font-family: "Source Han Serif SC", "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif;
  position: relative;
  z-index: 1;
}

.login-guide {
  width: min(100%, 900px);
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(220px, 0.9fr);
  align-items: center;
  gap: 24px;
  margin-top: 8px;
}

.login-guide--secondary {
  margin-top: 18px;
}

.login-guide-pair {
  width: min(100%, 1120px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 22px;
  margin-top: 72px;
}

.login-guide-pair__image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.login-guide-pair__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  color: #9ca3af;
}

.login-guide-pair__arrow svg {
  display: block;
  width: 52px;
  height: 52px;
}

.login-guide-step {
  width: min(100%, 1120px);
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.login-guide-step__title,
.login-guide-step__desc {
  margin: 0;
  text-align: center;
}

.login-guide-step__title {
  font-size: 24px;
  line-height: 1.45;
  color: var(--text-primary);
  font-family: "Source Han Serif SC", "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif;
}

.login-guide-step__desc {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.login-guide__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
}

.login-guide__content {
  display: grid;
  gap: 14px;
}

.login-guide__text {
  margin: 0;
  font-size: 24px;
  line-height: 1.45;
  color: var(--text-primary);
  font-family: "Source Han Serif SC", "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif;
}

.login-guide__desc {
  margin: 0;
  font-size: 18px;
  line-height: 1.8;
  color: var(--text-secondary);
  font-family: "SimSun", "Songti SC", "STSong", serif;
}

.login-guide-carousel {
  width: min(100%, 920px);
  margin-top: 32px;
  margin-bottom: 64px;
  display: grid;
  gap: 2px;
}

.login-guide-carousel__stage {
  display: grid;
  grid-template-columns: minmax(0, 0.74fr) minmax(0, 1.26fr);
  align-items: flex-end;
  gap: 20px;
  height: clamp(320px, 44vw, 460px);
  box-sizing: border-box;
  padding: 28px 0 6px;
  transition: grid-template-columns 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.login-guide-carousel__stage.is-active-0 {
  grid-template-columns: minmax(0, 1.42fr) minmax(0, 0.58fr);
}

.login-guide-carousel__stage.is-active-1 {
  grid-template-columns: minmax(0, 0.58fr) minmax(0, 1.42fr);
}

.login-guide-carousel__item {
  width: 100%;
  margin: 0;
  align-self: end;
  border: 0;
  background: transparent;
  transition:
    opacity 0.24s ease,
    filter 0.24s ease,
    margin 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.56;
  filter: saturate(0.88);
  margin-top: 72px;
}

.login-guide-carousel__item.is-active {
  opacity: 1;
  filter: saturate(1);
  margin-top: 0;
}

.login-guide-carousel__media {
  display: block;
  width: 100%;
  aspect-ratio: 2055 / 1248;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
}

.login-guide-carousel__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-guide-carousel__caption {
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif;
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
    gap: 8px;
  }

  .auth-panel {
    padding: 20px;
    border-radius: 22px;
  }

  .login-animation {
    width: min(100%, 420px);
    margin-top: 6px;
    gap: 10px;
  }

  .login-animation__caption {
    font-size: 26px;
  }

  .login-guide {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 6px;
  }

  .login-guide--secondary {
    margin-top: 14px;
  }

  .login-guide-pair {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .login-guide-pair__image {
    height: auto;
  }

  .login-guide-pair__arrow {
    width: 100%;
    transform: rotate(90deg);
  }

  .login-guide-step {
    margin-top: 14px;
    gap: 8px;
  }

  .login-guide-step__title {
    font-size: 22px;
  }

  .login-guide-step__desc {
    font-size: 15px;
    text-align: center;
  }

  .login-guide__text {
    font-size: 22px;
    text-align: center;
  }

  .login-guide__content {
    gap: 10px;
  }

  .login-guide__desc {
    font-size: 16px;
    line-height: 1.75;
    text-align: center;
  }

  .login-guide-carousel {
    margin-top: 12px;
    gap: 10px;
  }

  .login-guide-carousel__stage,
  .login-guide-carousel__stage.is-active-0,
  .login-guide-carousel__stage.is-active-1 {
    grid-template-columns: 1fr;
    gap: 12px;
    height: auto;
    padding: 10px 0 18px;
  }

  .login-guide-carousel__item {
    height: auto;
    opacity: 0.9;
  }

  .login-guide-carousel__item.is-active {
    opacity: 1;
  }

  .login-guide-carousel__caption {
    font-size: 16px;
    line-height: 1.45;
  }

  .captcha-row,
  .auth-guard-row,
  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
