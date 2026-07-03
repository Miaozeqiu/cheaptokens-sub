import { apiUrl } from './apiConfig'

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function solveWorkload(prefix, difficulty, options = {}) {
  const target = '0'.repeat(Math.max(1, Number(difficulty || 4)))
  const maxAttempts = options.maxAttempts || 8000000
  for (let index = 0; index < maxAttempts; index += 1) {
    if (options.signal?.aborted) {
      throw new Error('工作量验证已取消')
    }
    const nonce = String(index)
    const hex = await sha256Hex(`${prefix}${nonce}`)
    if (hex.startsWith(target)) {
      return nonce
    }
    if (index > 0 && index % 2500 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
  throw new Error('工作量验证超时，请刷新页面后重试')
}

export async function fetchAuthCaptcha() {
  const response = await fetch(apiUrl('/api/auth/captcha'))
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || '获取图形验证码失败')
  }
  return data
}

export async function fetchAuthWorkload() {
  const response = await fetch(apiUrl('/api/auth/workload'))
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || '获取工作量验证失败')
  }
  return data
}
