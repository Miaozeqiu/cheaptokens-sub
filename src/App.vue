<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useSubApp } from './composables/useSubApp'

const app = useSubApp()

onMounted(async () => {
  await app.restoreSession()
})
</script>

<template>
  <RouterView />
</template>
