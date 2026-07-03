<script setup>
import { computed } from 'vue'
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()

const visibleToasts = computed(() => [...toasts.value].slice(-3).reverse())

function getToastStyle(index) {
  const offset = index * 10
  const scale = Math.max(0.9, 1 - index * 0.04)
  const opacity = Math.max(0.45, 1 - index * 0.14)

  return {
    '--toast-offset-y': `-${offset}px`,
    '--toast-scale': scale,
    '--toast-opacity': opacity,
    zIndex: 100 - index,
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="app-toast-stack" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast">
        <div
          v-for="(item, index) in visibleToasts"
          :key="item.id"
          class="app-toast"
          :class="item.type"
          :style="getToastStyle(index)"
          role="status"
        >
          <span class="app-toast-text">{{ item.text }}</span>
          <button type="button" class="app-toast-close" aria-label="关闭" @click="removeToast(item.id)">
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.app-toast-stack {
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 12000;
  width: min(92vw, 420px);
  min-height: 72px;
  transform: translateX(-50%);
  pointer-events: none;
}

.app-toast {
  --toast-offset-y: 0px;
  --toast-shift-y: 0px;
  --toast-scale: 1;
  --toast-opacity: 1;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(12px);
  pointer-events: auto;
  transform-origin: top center;
  transform: translateY(calc(var(--toast-offset-y) + var(--toast-shift-y))) scale(var(--toast-scale));
  opacity: var(--toast-opacity);
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.app-toast.success {
  border-color: rgba(22, 163, 74, 0.24);
  background: rgba(240, 253, 244, 0.95);
}

.app-toast.error {
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(254, 242, 242, 0.96);
}

.app-toast.info {
  border-color: rgba(37, 99, 235, 0.18);
  background: rgba(239, 246, 255, 0.95);
}

.app-toast-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

.app-toast.success .app-toast-text {
  color: var(--success);
}

.app-toast.error .app-toast-text {
  color: var(--danger);
}

.app-toast.info .app-toast-text {
  color: var(--accent);
}

.app-toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.app-toast-close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  --toast-shift-y: 14px;
  opacity: 0;
}

.toast-leave-to {
  --toast-shift-y: -10px;
}

.toast-move {
  transition: transform 0.22s ease;
}
</style>
