<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

useHead({
  // 網站標題
  title: '安心E股領',
  meta: [
    { name: 'description', content: '這是安心E股領網站' }
  ],
  
  htmlAttrs: {
    lang: 'zh-TW'
  },
})

onBeforeMount(async () => {
  if (process.client) {
    try {
      const auth = useAuthStore()
      await auth.init()
      
      console.log('認證初始化完成:', {
        isLoggedIn: auth.isLoggedIn,
        hasToken: !!auth.token,
        timestamp: new Date().toISOString(),
        domain: window.location.hostname
      })
    } catch (error) {
      console.error('認證初始化失敗:', error)
    }
  }
})

// 保留 onMounted 作為額外的檢查點
onMounted(() => {
  if (process.client) {
    const auth = useAuthStore()
    console.log('掛載後認證狀態:', {
      isLoggedIn: auth.isLoggedIn,
      hasToken: !!auth.token,
      cookieExists: document.cookie.includes('auth-token')
    })
  }
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>