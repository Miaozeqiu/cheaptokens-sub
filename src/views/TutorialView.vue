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
  display: flex;
  justify-content: center;
  padding: 8px 0 28px;
}

@media (max-width: 640px) {
  .tutorial-page {
    padding: 0 0 20px;
  }
}
</style>
