<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, MailOutlined, ReloadOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useSubApp } from '../composables/useSubApp'

const route = useRoute()
const router = useRouter()
const app = useSubApp()
const mode = ref('login')
const errorMessage = ref('')
const inviteCodeFromQuery = computed(() => String(route.query.invite || route.query.invite_code || '').trim())

const sendCodeDisabled = computed(() => (
  app.sendingCode.value
  || app.authGuard.refreshing
  || app.authGuard.solving
  || app.cooldown.value > 0
))

const registerSubmitting = computed(() => (
  app.registerLoading.value
  || app.authGuard.refreshing
  || app.authGuard.solving
))

async function ensureRegisterGuard() {
  if (app.authGuard.captchaId || app.authGuard.refreshing) {
    return
  }
  try {
    await app.refreshAuthGuard()
  } catch (error) {
    errorMessage.value = error.message || '初始化图形验证码失败，请稍后重试'
  }
}

function applyInviteCodeFromQuery() {
  if (!inviteCodeFromQuery.value) {
    return
  }
  app.registerForm.value.invite_code = inviteCodeFromQuery.value
  mode.value = 'register'
}

watch(mode, (nextMode) => {
  errorMessage.value = ''
  if (nextMode === 'register') {
    ensureRegisterGuard()
  }
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
  if (mode.value === 'register') {
    ensureRegisterGuard()
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  if (!app.loginForm.value.email || !app.loginForm.value.password) {
    errorMessage.value = '请输入邮箱和密码'
    return
  }
  const result = await app.submitLogin()
  if (!result.ok) {
    errorMessage.value = result.message
    return
  }
  message.success(result.message || '登录成功')
  router.replace('/app/overview')
}

async function handleSendCode() {
  errorMessage.value = ''
  const result = await app.sendCode()
  if (!result.ok) {
    errorMessage.value = result.message
    return
  }
  message.success(result.message || '验证码已发送')
}

async function handleRegister() {
  errorMessage.value = ''
  if (!app.registerForm.value.name.trim()) {
    errorMessage.value = '请输入名称'
    return
  }
  if (!app.registerForm.value.email.trim()) {
    errorMessage.value = '请输入邮箱'
    return
  }
  if (!app.registerForm.value.invite_code.trim()) {
    errorMessage.value = '请填写主账户邀请码'
    return
  }
  if (!app.registerForm.value.code.trim()) {
    errorMessage.value = '请输入邮箱验证码'
    return
  }
  if (!app.registerForm.value.password || app.registerForm.value.password.length < 6) {
    errorMessage.value = '密码至少 6 位'
    return
  }
  const result = await app.submitRegister()
  if (!result.ok) {
    errorMessage.value = result.message
    return
  }
  message.success(result.message || '注册成功')
  mode.value = 'login'
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>子账户工作台</h1>
        <p>{{ mode === 'login' ? '使用子账户邮箱登录' : '使用主账户邀请码完成注册绑定' }}</p>
      </div>

      <div class="mode-switch">
        <button type="button" :class="['mode-switch__item', { active: mode === 'login' }]" @click="mode = 'login'">
          登录
        </button>
        <button type="button" :class="['mode-switch__item', { active: mode === 'register' }]" @click="mode = 'register'">
          注册
        </button>
      </div>

      <a-form v-if="mode === 'login'" layout="vertical" @submit.prevent="handleSubmit">
        <a-form-item label="邮箱" name="email">
          <a-input
            v-model:value="app.loginForm.value.email"
            size="large"
            placeholder="请输入注册邮箱"
            @pressEnter="handleSubmit"
          >
            <template #prefix>
              <MailOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="app.loginForm.value.password"
            size="large"
            placeholder="请输入密码"
            @pressEnter="handleSubmit"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

        <a-button
          type="primary"
          size="large"
          block
          :loading="app.loginLoading.value"
          @click="handleSubmit"
        >
          登录
        </a-button>
      </a-form>

      <a-form v-else layout="vertical" @submit.prevent="handleRegister">
        <a-form-item label="名称" name="name">
          <a-input
            v-model:value="app.registerForm.value.name"
            size="large"
            placeholder="给这个子账户起个名字"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="邮箱" name="email">
          <a-input
            v-model:value="app.registerForm.value.email"
            size="large"
            placeholder="请输入邮箱"
          >
            <template #prefix>
              <MailOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="主账户邀请码" name="invite_code">
          <a-input
            v-model:value="app.registerForm.value.invite_code"
            size="large"
            placeholder="必须填写主账户的邀请码"
          />
        </a-form-item>

        <a-form-item label="图形验证码" name="captcha">
          <div class="captcha-row">
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
            <a-input
              v-model:value="app.authGuard.captchaCode"
              size="large"
              placeholder="输入图中字符"
              maxlength="6"
            >
              <template #prefix>
                <SafetyCertificateOutlined />
              </template>
            </a-input>
            <a-button size="large" :disabled="app.authGuard.refreshing" @click="app.refreshAuthGuard">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </div>
          <p class="guard-text">
            {{ app.authGuard.solving ? '正在进行工作量校验，请稍候…' : (app.authGuard.workloadReady ? '人机校验已完成' : '准备人机校验…') }}
          </p>
        </a-form-item>

        <a-form-item label="邮箱验证码" name="code">
          <div class="code-row">
            <a-input
              v-model:value="app.registerForm.value.code"
              size="large"
              maxlength="6"
              placeholder="6 位数字验证码"
            />
            <a-button size="large" :disabled="sendCodeDisabled" @click="handleSendCode">
              {{
                app.sendingCode.value
                  ? '发送中...'
                  : app.cooldown.value > 0
                    ? `${app.cooldown.value}s`
                    : (app.authGuard.solving ? '校验中...' : '发送验证码')
              }}
            </a-button>
          </div>
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="app.registerForm.value.password"
            size="large"
            placeholder="至少 6 位"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

        <a-button
          type="primary"
          size="large"
          block
          :loading="app.registerLoading.value"
          :disabled="registerSubmitting"
          @click="handleRegister"
        >
          {{ app.authGuard.solving ? '校验中...' : '注册并绑定主账户' }}
        </a-button>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  padding: 24px;
}

.login-card {
  width: min(100%, 420px);
  padding: 40px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1677ff;
}

.login-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 24px;
}

.mode-switch__item {
  min-height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  background: #fff;
  color: #595959;
  transition: all 0.2s ease;
}

.mode-switch__item.active {
  border-color: #1677ff;
  background: rgba(22, 119, 255, 0.08);
  color: #1677ff;
}

.captcha-row,
.code-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.captcha-preview {
  min-height: 40px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  background: #fafafa;
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
  height: 100%;
  color: #8c8c8c;
  font-size: 12px;
}

.guard-text {
  margin: 8px 0 0;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.5;
}

.error-text {
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 77, 79, 0.08);
  color: #ff4d4f;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .captcha-row,
  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
