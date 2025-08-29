import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginForm.vue'
import HatcheryView from "@/views/HatcheryView.vue";
import FloorPlan from "@/views/FloorPlan.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },{
      path: '/login',
      name: 'login',
      component: LoginView
    },{
      path: '/hatchery',
      name: 'hatchery',
      component: HatcheryView
    },{
      path: '/floorplan',
      name: 'floorplan',
      component: FloorPlan
    }
  ],
})

export default router