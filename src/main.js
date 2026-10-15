import { createApp } from 'vue'
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/900.css'
import '@fontsource/noto-sans-sc/400.css'
import './assets/base.css'
import App from './App.vue'
import router from './router'

window.openSavings50Dialog = function openSavings50Dialog() {
  window.dispatchEvent(new Event('cheaptokens:open-savings50-dialog'))
}

createApp(App).use(router).mount('#app')
