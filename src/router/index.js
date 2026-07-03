import { createRouter, createWebHistory } from 'vue-router'
import { useSubApp } from '../composables/useSubApp'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import OverviewView from '../views/OverviewView.vue'
import ProviderKeysView from '../views/ProviderKeysView.vue'

const { hasSession } = useSubApp()

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'sub-login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/app',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/app/withdrawal',
        },
        {
          path: 'overview',
          name: 'sub-overview',
          component: OverviewView,
        },
        {
          path: 'payout-settings',
          name: 'sub-payout-settings',
          component: OverviewView,
        },
        {
          path: 'withdrawal',
          name: 'sub-withdrawal',
          component: OverviewView,
        },
        {
          path: 'provider-keys',
          name: 'sub-provider-keys',
          component: ProviderKeysView,
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !hasSession()) {
    return '/login'
  }
  if (to.meta.guestOnly && hasSession()) {
    return '/app/withdrawal'
  }
  return true
})

export default router
