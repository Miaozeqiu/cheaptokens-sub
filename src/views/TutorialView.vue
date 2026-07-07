<script setup>
import LoginTutorialContent from '../components/LoginTutorialContent.vue'
</script>

<template>
  <div class="tutorial-page">
    <p class="tutorial-page__caption" aria-hidden="true">分享你的Tokens给其他人</p>
    <LoginTutorialContent />
  </div>
</template>

<style scoped>
.tutorial-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0 28px;
}

.tutorial-page__caption {
  margin: 0 auto 24px;
  width: min(100%, 440px);
  text-align: center;
  font-size: 64px;
  font-weight: 900;
  color: #56301e;
  letter-spacing: 0.02em;
  line-height: 1.4;
  font-family: var(--font-cjk-serif);
}

@media (max-width: 640px) {
  .tutorial-page {
    padding: 0 0 20px;
  }

  .tutorial-page__caption {
    font-size: 26px;
  }
}
</style>
