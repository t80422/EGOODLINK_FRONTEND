<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'backsite'
})

const router = useRouter()
const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleBack = () => {
  router.push('/backsite/login')
}

const handleSubmit = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await fetch('/index.php/api/auth/request-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '發送重設密碼請求失敗')
    }

    // 成功後可以顯示成功訊息或跳轉
    alert('重設密碼連結已發送至您的信箱，請點擊信件中的連結進入重設密碼頁面')
    router.push('/backsite/login')

  } catch (error) {
    errorMessage.value = error.message
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
          <h1 class="text-center text-2xl font-bold text-gray-900">忘記密碼</h1>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Email 輸入 -->
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

          <!-- 錯誤訊息 -->
          <div v-if="errorMessage" class="text-red-500 text-center">
            {{ errorMessage }}
          </div>

          <!-- 按鈕組 -->
          <div class="space-y-4">
            <!-- 送出按鈕 -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full h-[48px] flex justify-center items-center border border-transparent rounded-[12px] shadow-sm text-base font-medium text-white bg-[#0F93A2] hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              {{ isLoading ? '處理中...' : '送出' }}
            </button>

            <!-- 返回按鈕 -->
            <button
              type="button"
              @click="handleBack"
              class="w-full h-[48px] flex justify-center items-center border border-gray-300 rounded-[12px] shadow-sm text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              返回
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>