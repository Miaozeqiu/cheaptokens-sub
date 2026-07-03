<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useSubApp } from '../composables/useSubApp'

const route = useRoute()
useSubApp()
const navCenterRef = ref(null)
const indicatorStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: 0,
})

const navigationItems = [
  { key: 'wallet', label: '提现', path: '/app/wallet' },
  { key: 'provider-keys', label: 'KEY', path: '/app/provider-keys' },
  { key: 'me', label: '我的', path: '/app/me' },
]

function isRouteActive(basePath) {
  return route.path === basePath || route.path.startsWith(`${basePath}/`)
}

function updateIndicator(target) {
  if (!navCenterRef.value || !target) {
    return
  }

  const navRect = navCenterRef.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  indicatorStyle.value = {
    width: `${targetRect.width}px`,
    transform: `translateX(${targetRect.left - navRect.left}px)`,
    opacity: 1,
  }
}

function resetIndicatorToActive() {
  const activeLink = navCenterRef.value?.querySelector('.nav-link.active')
  if (activeLink) {
    updateIndicator(activeLink)
    return
  }

  indicatorStyle.value = {
    ...indicatorStyle.value,
    opacity: 0,
  }
}

function handleNavMouseEnter(event) {
  if (window.innerWidth <= 980) {
    return
  }
  updateIndicator(event.currentTarget)
}

function handleNavMouseLeave() {
  if (window.innerWidth <= 980) {
    return
  }
  resetIndicatorToActive()
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    resetIndicatorToActive()
  },
)

onMounted(async () => {
  await nextTick()
  resetIndicatorToActive()
  window.addEventListener('resize', resetIndicatorToActive)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resetIndicatorToActive)
})
</script>

<template>
  <div class="app-layout">
    <header class="top-navbar">
      <div class="navbar-container">
        <nav id="sub-dashboard-mobile-nav" class="navbar-nav">
          <div class="nav-pill" ref="navCenterRef" @mouseleave="handleNavMouseLeave">
            <div class="nav-indicator" :style="indicatorStyle" />
            <RouterLink
              v-for="item in navigationItems"
              :key="item.key"
              :to="item.path"
              class="nav-link"
              :class="{ active: isRouteActive(item.path) }"
              @mouseenter="handleNavMouseEnter"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </nav>

      </div>
    </header>

    <main class="app-main">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="sub-page" mode="out-in">
          <component :is="Component" :key="currentRoute.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-navbar {
  background: transparent;
  border-bottom: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding-top: env(safe-area-inset-top, 0);
}

.navbar-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 24px 12px;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  pointer-events: none;
}

.navbar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  pointer-events: auto;
}

.nav-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  width: auto;
  max-width: 100%;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    4px 8px 20px rgba(0, 0, 0, 0.085),
    1px 3px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-pill::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.42),
    rgba(255, 255, 255, 0.08) 45%,
    rgba(255, 255, 255, 0) 72%
  );
  pointer-events: none;
  z-index: 0;
}

.nav-pill:hover {
  transform: translateY(-1px);
  box-shadow:
    6px 10px 24px rgba(0, 0, 0, 0.1),
    2px 4px 10px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.nav-indicator {
  position: absolute;
  top: 6px;
  left: 0;
  height: calc(100% - 12px);
  border-radius: 999px;
  background: rgba(236, 236, 241, 0.78);
  transition:
    transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
    width 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.2s ease;
  pointer-events: none;
  z-index: 0;
}

.nav-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 18px;
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active {
  color: #6b6b6b;
  font-weight: 600;
}

.app-main {
  width: 100%;
  flex: 1;
  min-width: 0;
  padding: 92px 18px 18px;
}

.sub-page-enter-active,
.sub-page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.sub-page-enter-from,
.sub-page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 980px) {
  .navbar-container {
    justify-content: center;
  }

  .nav-pill {
    width: auto;
    margin: 0 auto;
  }

  .nav-link {
    justify-content: center;
  }

  .top-navbar,
  .app-main {
    position: relative;
    z-index: 21;
  }
}

@media (max-width: 640px) {
  .top-navbar {
    padding: 12px 12px 0;
  }

  .navbar-container {
    padding: 10px 12px;
  }

  .app-main {
    padding: 12px;
  }
}
</style>
