import { createRouter, createWebHistory } from 'vue-router'
import { useSubApp } from '../composables/useSubApp'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import OverviewView from '../views/OverviewView.vue'
import ProviderKeysView from '../views/ProviderKeysView.vue'
import WalletBalanceView from '../views/WalletBalanceView.vue'
import MyView from '../views/MyView.vue'

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
          redirect: '/app/wallet',
        },
        {
          path: 'wallet',
          name: 'sub-wallet',
          component: WalletBalanceView,
        },
        {
          path: 'overview',
          redirect: '/app/me/overview',
        },
        {
          path: 'payout-settings',
          redirect: '/app/me/payout-settings',
        },
        {
          path: 'withdrawal',
          redirect: '/app/wallet',
        },
        {
          path: 'provider-keys',
          name: 'sub-provider-keys',
          component: ProviderKeysView,
        },
        {
          path: 'me',
          name: 'sub-me',
          component: MyView,
        },
        {
          path: 'me/profile',
          redirect: '/app/me',
        },
        {
          path: 'me/overview',
          name: 'sub-me-overview',
          component: OverviewView,
        },
        {
          path: 'me/payout-settings',
          name: 'sub-me-payout-settings',
          component: OverviewView,
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
    return '/app/wallet'
  }
  return true
})

export default router
