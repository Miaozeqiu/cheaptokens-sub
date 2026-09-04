<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])
</script>

<template>
  <div v-if="open" class="dialog-overlay" @mousedown.self="emit('close')">
    <div class="dialog-card contact-prompt-card">
      <div class="dialog-header">
        <div>
          <h3>请联系主账户提现</h3>
          <p class="dialog-subtitle">
            请先联系主账户，再跟进这次提现。如未联系，主账户可能会拒绝申请。
          </p>
        </div>
        <button type="button" class="dialog-close-icon" @click="emit('close')">
          <svg viewBox="0 0 1024 1024" aria-hidden="true">
            <path d="M566.97558594 521.09667969L856.8828125 231.18945312c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355468l-1.58203125-1.58203125c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0L512 466.51660156 222.09277344 176.21386719c-14.63378906-14.63378906-38.75976563-14.63378906-53.39355469 0l-1.58203125 1.58203125c-15.02929688 14.63378906-15.02929688 38.75976563 0 53.39355469l289.90722656 289.90722656L167.1171875 811.00390625c-14.63378906 14.63378906-14.63378906 38.75976563 0 53.39355469l1.58203125 1.58203125c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0L512 576.07226563 801.90722656 865.97949219c14.63378906 14.63378906 38.75976563 14.63378906 53.39355469 0l1.58203125-1.58203125c14.63378906-14.63378906 14.63378906-38.75976563 0-53.39355469L566.97558594 521.09667969z" fill="currentColor"></path>
          </svg>
        </button>
      </div>

      <div class="contact-prompt-actions">
        <button type="button" class="secondary-button" @click="emit('close')">稍后</button>
        <RouterLink class="primary-button contact-prompt-link" to="/app/me/contact" @click="emit('close')">
          查看主账户联系方式
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-prompt-card {
  width: min(100%, 420px);
}

.contact-prompt-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.contact-prompt-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
</style>
