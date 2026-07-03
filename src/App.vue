<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppToast from './components/AppToast.vue'
import { useSubApp } from './composables/useSubApp'

const app = useSubApp()

onMounted(async () => {
  await app.restoreSession()
})
</script>

<template>
  <AppToast />
  <RouterView />
</template>
