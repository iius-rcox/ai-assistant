/**
 * Vue Router Configuration
 * Feature: 003-correction-ui
 * Task: T015
 *
 * Routes:
 * - / : Classification list (main page)
 * - /classification/:id : Classification detail/edit
 * - /analytics : Correction history and analytics
 */

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
      meta: { title: 'Email Classifications' }
    },
    {
      path: '/classification/:id',
      name: 'classification-detail',
      component: () => import('../views/ClassificationDetailPage.vue'),
      meta: { title: 'Edit Classification' }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/AnalyticsPage.vue'),
      meta: { title: 'Correction History' }
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestConnection.vue'),
      meta: { title: 'Connection Test' }
    }
  ]
})

// Update document title on route change
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || 'Email Classification Corrections'
  next()
})

export default router
