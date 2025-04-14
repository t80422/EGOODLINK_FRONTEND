<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from '#app'
import { useAuthStore } from '~/stores/auth'
import { provide } from 'vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const activeDropdown = ref(null)

// 取得對應的選單標題
const getMobileMenuTitle = (path) => {
  switch (path) {
    case '/about':
      return '關於我們';
    case '/souvenir-collection':
      return '紀念品代領';
    case '/member':
      return '會員管理';
    default:
      return '';
  }
}

// 取得對應的子選單項目
const getMobileSubItems = (path) => {
  switch (path) {
    case '/about':
      return [
        { path: '/about', label: '關於安心E股領132' },
        { path: '/about/transport', label: '代領服務據點' },
        { path: '/about/faq', label: '常見問題' },
        { path: '/about/news', label: '最新消息' }
      ];
    case '/souvenir-collection':
      return [
        { path: '/souvenir-collection', label: '逐件委託代領' }
      ];
    case '/member':
      return [
        { path: '/member/profile', label: '會員資料' },
        { path: '/member/subaccounts', label: '我的子帳號' },
        { path: '/member/shipping-orders', label: '我的出貨單' }
      ];
    default:
      return [];
  }
}

// 使用 computed 來取得 auth store 的狀態
const isLoggedIn = computed(() => authStore.isLoggedIn)
const userName = computed(() => authStore.user?.name || '')

const navigateToLogin = async () => {
  if (isMobileMenuOpen.value) {
    toggleMobileMenu()
  }
  await router.push('/auth/login')
}

const isMobileMenuOpen = ref(false)

provide('isMobileMenuOpen', isMobileMenuOpen)

const toggleMobileMenu = () => {
  // 開啟手機選單時,關閉所有其他彈出層
  if (!isMobileMenuOpen.value) {
    // 關閉所有下拉選單
    activeDropdown.value = null
    // 關閉其他可能的彈出層
    // 這裡可以添加其他需要關閉的彈出層
  }
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleMouseEnter = (itemPath) => {
  if (itemPath === '/about') {
    activeDropdown.value = 'about'
  } else if (itemPath === '/member') {
    activeDropdown.value = 'member'
  } else if (itemPath === '/souvenir-collection') {
    activeDropdown.value = 'souvenir'
  }
}

const handleMouseLeave = () => {
  activeDropdown.value = null
}

const navItems = computed(() => {
  const baseItems = [
    { path: '/', label: '股東會資訊' },
    { path: '/souvenir-collection', label: '紀念品代領', noLink: true },
    { path: '/about', label: '關於我們', noLink: true },
    // { path: '/notifications', label: '通知' }
  ]

  if (isLoggedIn.value) {
    baseItems.push({ path: '/member', label: userName.value, noLink: true })
  }

  return baseItems
})

const handleLogout = async () => {
  try {
    // 清除認證資訊
    authStore.clearAuth()
    
    // 導向登入頁
    await navigateTo('/auth/login')
  } catch (error) {
    console.error('登出錯誤:', error)
  }
}
</script>

<template>
  <div class="relative" @mouseleave="handleMouseLeave">
    <!-- 桌面版 Header -->
    <header class="hidden lg:flex py-5 px-4 md:px-8 lg:px-12 items-center justify-between">
      <!-- Logo -->
      <div class="w-[160px] md:w-[180px] lg:w-[200px] h-[50px] md:h-[60px] lg:h-[70px] flex items-center justify-center rounded-lg">
        <img 
          src="/egolinkLOGO.png" 
          alt="E股領前台"
          class="header-logo max-w-full h-auto"
        />
      </div>

      <!-- 導航選單 -->
      <nav class="flex-1 mx-4 md:mx-12 lg:mx-24">
        <ul class="flex space-x-4 md:space-x-12 lg:space-x-24 justify-end">
          <li 
            v-for="item in navItems" 
            :key="item.path"
            @mouseenter="handleMouseEnter(item.path)"
          >
            <template v-if="item.noLink">
              <span class="text-sm md:text-base hover:text-teal-600 no-underline inline-flex items-center">
                {{ item.label }}
              </span>
            </template>
            <NuxtLink
              v-else  
              :to="item.path"
              class="text-sm md:text-base hover:text-teal-600 no-underline inline-flex items-center"
              :class="{ 'font-bold': route.path === item.path }"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- 登入按鈕 -->
      <button 
        v-if="!isLoggedIn"
        @click="navigateToLogin" 
        class="hidden md:inline-flex items-center justify-center gap-2 ml-10 px-6 py-2.5 
          bg-gradient-to-r from-teal-500 to-teal-600 
          hover:from-teal-600 hover:to-teal-700
          text-white text-sm md:text-base font-medium
          rounded-full shadow-lg shadow-teal-500/20
          transition-all duration-200 ease-in-out
          hover:shadow-teal-500/40 hover:scale-[1.02]
          active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="w-5 h-5 md:w-5 md:h-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <span>登入</span>
      </button>
    </header>


    <!-- 手機版 Header -->
    <header class="lg:hidden flex items-center justify-between py-4 px-4 z-60">
      <!-- Logo -->
      <div class="w-[140px] h-[50px] flex items-center justify-center">
        <img 
          src="/egolinkLOGO.png" 
          alt="E股領前台"
          class="header-logo max-w-full h-auto"
        />
      </div>

      <!-- 漢堡選單按鈕 -->
      <button 
        @click="toggleMobileMenu"
        class="text-gray-600 hover:text-teal-600 focus:outline-none"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-8 w-8" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      <!-- 手機版選單 -->
      <div 
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-white z-50 overflow-y-auto"
      >
        <!-- 關閉按鈕 -->
        <div class="flex justify-end p-4">
          <button 
            @click="toggleMobileMenu"
            class="text-gray-600 hover:text-teal-600"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-8 w-8" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        <!-- 手機版選單內容 -->
        <nav class="px-4 py-2">
          <ul class="space-y-6">
            <li v-for="item in navItems" :key="item.path">
              <!-- 一般選單項目 -->
              <template v-if="!item.noLink">
                <NuxtLink 
                  :to="item.path"
                  class="block text-xl font-bold text-gray-800 py-3 transition-colors duration-200 ease-in-out hover:text-teal-600 active:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-lg"
                  @click="toggleMobileMenu"
                >
                  {{ item.label }}
                </NuxtLink>
              </template>
              
              <!-- 各種選單類型 -->
              <template v-else>
                <div class="py-2 bg-gray-50 rounded-lg shadow-sm">
                  <!-- 選單標題 -->
                  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <span class="text-xl font-bold text-gray-800">
                      {{ getMobileMenuTitle(item.path) }}
                    </span>
                  </div>
                  
                  <!-- 子選單列表 -->
                  <ul class="mt-2 space-y-1 px-4">
                    <li v-for="subItem in getMobileSubItems(item.path)" :key="subItem.path">
                      <NuxtLink 
                        :to="subItem.path"
                        class="flex items-center w-full p-3 text-base text-gray-600 transition-all duration-200 ease-in-out hover:bg-teal-50 hover:text-teal-600 rounded-lg"
                        @click="toggleMobileMenu"
                      >
                        <span>{{ subItem.label }}</span>
                        <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </NuxtLink>
                    </li>
                    
                    <!-- 如果是會員選單，添加登出按鈕 -->
                    <li v-if="item.path === '/member' && isLoggedIn">
                      <button
                        @click="handleLogout"
                        class="flex items-center w-full p-3 text-base text-red-600 transition-all duration-200 ease-in-out hover:bg-red-50 rounded-lg"
                      >
                        <span>登出</span>
                        <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
              </template>
            </li>

            <!-- 未登入時顯示登入按鈕 -->
            <li v-if="!isLoggedIn" class="mt-8">
              <button 
                @click="navigateToLogin"
                class="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-4 px-6 rounded-lg text-lg font-medium transition-all duration-200 hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                </svg>
                登入
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <!-- 下拉選單區塊 -->
    <div 
      v-if="activeDropdown && !isMobileMenuOpen"
      :class="['dropdown-transition', { 'visible': activeDropdown }]"
      class="hidden lg:block absolute top-[100%] left-0 w-full bg-gray-100 shadow-lg py-4 px-4 md:px-8 lg:px-12 z-50 border-t border-gray-200"
    >
      <!-- todo 關於下拉全寬區塊 -->
      <div 
        v-if="activeDropdown === 'about'"
        :class="['dropdown-transition', { 'visible': activeDropdown === 'about' }]"
        class="absolute top-[100%] left-0 w-full bg-gray-100 shadow-lg py-4 px-12 z-50 border-t border-gray-200"
      >
        <div class="max-w-6xl mx-auto flex justify-between space-x-8">
          <div class="flex-1 text-center">
            <NuxtLink to="/about" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="font-bold text-2xl">關於我們</span>
            </NuxtLink>
          </div>
          <div class="flex-1 text-center">
            <NuxtLink to="/about" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="underline underline-offset-4">關於安心E股領</span>
              <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </NuxtLink>
          </div>
          <div class="flex-1 text-center">
            <NuxtLink to="/about/transport" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="underline underline-offset-4">代領服務據點</span>
              <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </NuxtLink>
          </div>
          <div class="flex-1 text-center">
            <NuxtLink to="/about/faq" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="underline underline-offset-4">常見問題</span>
              <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </NuxtLink>
          </div>
          <div class="flex-1 text-center">
            <NuxtLink to="/about/news" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="underline underline-offset-4">最新消息</span>
              <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!--todo 會員下拉全寬區塊 -->
      <div 
          v-if="activeDropdown === 'member'"
          :class="['dropdown-transition', { 'visible': activeDropdown === 'member' }]"
          class="absolute top-[100%] left-0 w-full bg-gray-100 shadow-lg py-4 px-12 z-50 border-t border-gray-200"
      >
          <div class="max-w-6xl mx-auto grid grid-cols-6 gap-4">
              <div class="text-center">
                  <NuxtLink to="/member" class="group inline-flex items-center justify-center w-full text-base text-gray-600 hover:text-teal-600">
                      <span class="font-bold text-2xl">會員管理</span>
                  </NuxtLink>
              </div>
              <div class="text-center">
                  <NuxtLink to="/member/profile" class="group inline-flex items-center justify-center w-full text-base text-gray-600 hover:text-teal-600">
                      <span class="underline underline-offset-4">會員資料</span>
                      <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </NuxtLink>
              </div>
              <div class="text-center">
                  <NuxtLink to="/member/subaccounts" class="group inline-flex items-center justify-center w-full text-base text-gray-600 hover:text-teal-600">
                      <span class="underline underline-offset-4">我的子帳號</span>
                      <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </NuxtLink>
              </div>
              <div class="text-center">
                  <NuxtLink to="/member/shipping-orders" class="group inline-flex items-center justify-center w-full text-base text-gray-600 hover:text-teal-600">
                      <span class="underline underline-offset-4">我的出貨單</span>
                      <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </NuxtLink>
              </div>
              <div class="text-center">
                  <a @click="handleLogout" 
                      class="group inline-flex items-center justify-center w-full text-base text-gray-600 hover:text-teal-600 cursor-pointer">
                      <span class="underline underline-offset-4">登出</span>
                      <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </a>
              </div>
          </div>
      </div>

      <!--todo 紀念品代領下拉全寬區塊 -->
      <div 
        v-if="activeDropdown === 'souvenir'"
        :class="['dropdown-transition', { 'visible': activeDropdown === 'souvenir' }]"
        class="absolute top-[100%] left-0 w-full bg-gray-100 shadow-lg py-4 px-12 z-50 border-t border-gray-200"
      >
        <div class="max-w-6xl mx-auto flex justify-between space-x-8">
          <div class="flex-1 text-center">
            <NuxtLink to="/souvenir-collection" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="font-bold text-2xl">紀念品代領</span>
            </NuxtLink>
          </div>
          <div class="flex-1 text-center">
            <NuxtLink to="/souvenir-collection" class="group inline-flex items-center w-[280px] text-base text-gray-600 hover:text-teal-600">
              <span class="underline underline-offset-4">逐件委託代領</span>
              <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-menu {
  z-index: 60;
}

.dropdown-transition {
  transform: translateY(-10px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dropdown-transition.visible {
  transform: translateY(0);
  opacity: 1;
}

/* 手機版動畫 */
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}
</style>