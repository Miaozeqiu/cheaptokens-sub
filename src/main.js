import { createApp } from 'vue'
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/900.css'
import '@fontsource/noto-sans-sc/400.css'
import './assets/base.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
