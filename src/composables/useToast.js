import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function showToast(text, type = 'info', duration = 3500) {
  const message = String(text || '').trim()
  if (!message) {
    return
  }

  const id = ++toastId
  toasts.value.push({ id, text: message, type })

  if (duration > 0) {
    window.setTimeout(() => removeToast(id), duration)
  }
}

export function removeToast(id) {
  toasts.value = toasts.value.filter((item) => item.id !== id)
}

export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
  }
}
