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

    const response = await fetch('/index.php/api/auth/resend-verification', {
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
      throw new Error(data.message || '重寄驗證信失敗')
    }

    alert('驗證信已重新發送至您的信箱')
    router.push('/backsite/login')

  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white flex items-center justify-center">
    <main class="w-[640px] p-8">
      <div class="space-y-8">
        <div class="mb-8">
          <h1 class="text-center text-2xl font-bold text-gray-900 mt-10">重寄驗證信</h1>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-8">
          <div>
            <label for="email" class="block text-lg font-medium text-gray-700">信箱</label>
            <input
              v-model="email"
              id="email"
              type="email"
              required
              placeholder="請輸入您的信箱"
              class="mt-1 block w-[575px] h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div v-if="errorMessage" class="text-red-500 text-center">
            {{ errorMessage }}
          </div>

          <div class="flex space-x-4">
            <button
              type="button"
              @click="handleBack"
              class="w-1/2 h-[48px] flex justify-center items-center border border-gray-300 rounded-[12px] shadow-sm text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              返回
            </button>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-1/2 h-[48px] flex justify-center items-center border border-transparent rounded-[12px] shadow-sm text-base font-medium text-white bg-[#0F93A2] hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              {{ isLoading ? '處理中...' : '重寄驗證信' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>