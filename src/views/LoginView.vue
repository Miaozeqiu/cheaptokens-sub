<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useSubApp } from '../composables/useSubApp'

const router = useRouter()
const app = useSubApp()
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  if (!app.loginForm.value.name || !app.loginForm.value.password) {
    errorMessage.value = '请输入用户名和密码'
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
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>子账户工作台</h1>
        <p>请使用子账户用户名和密码登录</p>
      </div>

      <a-form layout="vertical" @submit.prevent="handleSubmit">
        <a-form-item label="用户名" name="name">
          <a-input
            v-model:value="app.loginForm.value.name"
            size="large"
            placeholder="请输入用户名"
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

.error-text {
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 77, 79, 0.08);
  color: #ff4d4f;
  font-size: 13px;
  line-height: 1.5;
}
</style>
