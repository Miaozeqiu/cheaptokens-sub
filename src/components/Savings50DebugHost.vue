<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const open = ref(false)

function openSavings50Dialog() {
  open.value = true
}

function closeSavings50Dialog() {
  open.value = false
}

onMounted(() => {
  window.openSavings50Dialog = openSavings50Dialog
  window.addEventListener('cheaptokens:open-savings50-dialog', openSavings50Dialog)
})

onUnmounted(() => {
  if (window.openSavings50Dialog === openSavings50Dialog) {
    delete window.openSavings50Dialog
  }
  window.removeEventListener('cheaptokens:open-savings50-dialog', openSavings50Dialog)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-overlay" @mousedown.self="closeSavings50Dialog">
      <div class="dialog-card savings-dialog">
        <div class="dialog-header">
          <div class="provider-dialog-header-actions">
            <button type="button" class="dialog-close-icon" @click="closeSavings50Dialog">
              <svg viewBox="0 0 1024 1024" aria-hidden="true">
                <path d="M566.98 521.1 856.88 231.19c14.64-14.63 14.64-38.76 0-53.39l-1.58-1.58c-14.63-14.64-38.76-14.64-53.39 0L512 466.52 222.09 176.21c-14.63-14.64-38.76-14.64-53.39 0l-1.58 1.58c-15.03 14.63-15.03 38.76 0 53.39l289.91 289.91L167.12 811c-14.64 14.63-14.64 38.76 0 53.39l1.58 1.58c14.63 14.63 38.76 14.63 53.39 0L512 576.07l289.91 289.91c14.63 14.63 38.76 14.63 53.39 0l1.58-1.58c14.64-14.63 14.64-38.76 0-53.39L566.98 521.1z" fill="currentColor" />
              </svg>
            </button>
            <button type="button" class="primary-button provider-dialog-submit" @click="closeSavings50Dialog">确认开启</button>
          </div>
        </div>
        <div class="provider-dialog-form provider-dialog-form--compact">
          <h3 class="savings-dialog-title">开启 50 节省计划</h3>
          <p class="savings-earn">大约可以多拿 10 块</p>
          <p class="savings-warn">
            开启后5分钟内购买<br>
            剩下最后25-30元余额再买<br>
            <strong>千万不要只开不买！！！</strong><br>
            <strong>千万不要只开不买！！！</strong><br>
            <strong>千万不要只开不买！！！</strong>
          </p>
          <p class="savings-buy">
            请在
            <a href="https://university.aliyun.com/buycenter/?spm=5176.28623341.J_dE6iKTQZWCaqh5bpcaeTX.2.61d13180Oo9OhV" target="_blank" rel="noreferrer">此处</a>
            购买「大模型服务」中的【高校】入门型 AI 通用节省计划，点「立即购买」。
          </p>
          <img
            class="savings-shot"
            src="/savings50-plan.png"
            alt="云工开物学生权益页：先点顶部学生权益，再在大模型服务里购买入门型 AI 通用节省计划"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.savings-dialog {
  width: min(100%, 640px);
  max-height: min(86dvh, 760px);
  overflow: auto;
}

.provider-dialog-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.provider-dialog-form {
  display: grid;
  gap: 0;
}

.provider-dialog-form--compact {
  padding-top: 6px;
}

.provider-dialog-submit {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #2783de;
  box-shadow: none;
  font-weight: 400;
}

.provider-dialog-submit:hover:not(:disabled) {
  background: #1f72c6;
  transform: none;
  box-shadow: none;
}

.savings-dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 750;
}

.savings-earn {
  margin: 8px 0 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--success, #059669);
}

.savings-warn {
  margin: 10px 0 0;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.7;
}

.savings-warn strong {
  color: #c62828;
  font-weight: 800;
}

.savings-buy {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
}

.savings-buy a {
  color: var(--accent, #0284c7);
  font-weight: 800;
}

.savings-shot {
  display: block;
  width: 100%;
  margin-top: 12px;
  border-radius: 12px;
}
</style>
