<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppToast from './components/AppToast.vue'
import Savings50DebugHost from './components/Savings50DebugHost.vue'
import { useSubApp } from './composables/useSubApp'

const app = useSubApp()

onMounted(async () => {
  await app.restoreSession()
})
</script>

<template>
  <AppToast />
  <Savings50DebugHost />
  <RouterView />
</template>
