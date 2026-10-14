<script setup>
import LoginTutorialContent from '../components/LoginTutorialContent.vue'
</script>

<template>
  <div class="tutorial-page">
    <LoginTutorialContent />
  </div>
</template>

<style scoped>
.tutorial-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0 28px;
  overflow-x: clip;
}

@media (max-width: 640px) {
  .tutorial-page {
    padding: 0 0 20px;
  }
}
</style>
