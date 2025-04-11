<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'none'
})

const router = useRouter()
const authStore = useAuthStore()

// 表單資料
const email = ref('')
const password = ref('')

// 登入狀態 
const isLoading = ref(false)
const errorMessage = ref('')

const navigateToForgotPassword = () => {
  router.push('/backsite/forgot-password')
}

const handleLogin = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const requestData = {
      email: email.value,
      password: password.value
    }
    
    const { data: response } = await useFetch('/index.php/api/auth/login', {
      method: 'POST',
      body: requestData
    })

    if (response.value.status) {
      authStore.setAuth({
        token: response.value.data.token,
        user: response.value.data.user
      })
      const redirectPath = localStorage.getItem('redirectPath') || '/backsite'
      localStorage.removeItem('redirectPath')
      router.push(redirectPath)
    } else {
      errorMessage.value = response.value.message
    }
  } catch (error) {
    console.error('登入錯誤:', error)
    errorMessage.value = '登入發生未知錯誤'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-gray-50">
    <main class="w-full max-w-[640px] p-8 mx-auto">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <!-- 標題 -->
        <div class="mb-8">
          <h1 class="text-center text-2xl font-bold text-gray-900">安心E股領後台登入</h1>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleLogin" class="space-y-8">
          <!-- 帳號輸入 -->
          <div>
            <label for="email" class="block text-lg font-medium text-gray-700">信箱</label>
            <input
              v-model="email"
              id="email"
              type="email"
              required
              placeholder="請輸入信箱"
              class="mt-1 block w-full h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- 密碼輸入 -->
          <div>
            <label for="password" class="block text-lg font-medium text-gray-700">密碼</label>
            <input
              v-model="password"
              id="password"
              type="password"
              required
              placeholder="請輸入密碼"
              class="mt-1 block w-full h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- 錯誤訊息 -->
          <div v-if="errorMessage" class="text-red-500 text-center">
            {{ errorMessage }}
          </div>

          <!-- 登入按鈕 -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full h-[48px] flex justify-center items-center border border-transparent rounded-[12px] shadow-sm text-base font-medium text-white bg-[#0F93A2] hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              {{ isLoading ? '登入中...' : '登入' }}
            </button>
          </div>
          <div class="flex items-center justify-center space-x-8">
            <a @click="navigateToForgotPassword" 
            class="text-base cursor-pointer hover:text-teal-600">
            忘記密碼？
            </a>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>