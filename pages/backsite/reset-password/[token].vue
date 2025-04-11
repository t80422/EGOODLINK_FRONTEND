<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'backsite'
})

const route = useRoute()
const router = useRouter()
const password = ref('')
const password_confirmation = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const passwordError = ref('')

const handleBack = () => {
  router.push('/backsite/login')
}

// 密碼驗證規則
const validatePassword = (pwd) => {
  const hasUpperCase = /[A-Z]/.test(pwd)
  const hasLowerCase = /[a-z]/.test(pwd)
  const hasMinLength = pwd.length >= 8
  
  if (!hasMinLength) {
    return '密碼長度至少需要8位數'
  }
  if (!hasUpperCase || !hasLowerCase) {
    return '密碼需包含大小寫英文字母'
  }
  return ''
}

const handleSubmit = async () => {
    try {
    // 密碼驗證
    const validationError = validatePassword(password.value)
    if (validationError) {
      passwordError.value = validationError
      return
    }

    // 確認密碼驗證
    if (password.value !== password_confirmation.value) {
      passwordError.value = '兩次輸入的密碼不一致'
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    passwordError.value = ''

    const response = await fetch(`/index.php/api/auth/reset-password/${route.params.token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: password.value,
        password_confirmation: password_confirmation.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '重設密碼失敗')
    }

    alert('密碼重設成功')
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
          <h1 class="text-center text-2xl font-bold text-gray-900">重設密碼</h1>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- 密碼欄位 -->
          <div>
            <label for="password" class="block text-lg font-medium text-gray-700">新密碼</label>
            <input
              v-model="password"
              id="password"
              type="password"
              required
              placeholder="請輸入新密碼"
              class="mt-1 block w-full h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- 確認密碼欄位 -->
          <div>
            <label for="password_confirmation" class="block text-lg font-medium text-gray-700">確認密碼</label>
            <input
              v-model="password_confirmation"
              id="password_confirmation"
              type="password"
              required
              placeholder="請再次輸入新密碼"
              class="mt-1 block w-full h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- 錯誤訊息 -->
          <div v-if="passwordError" class="text-red-500 text-sm mt-1">
            {{ passwordError }}
          </div>

          <div v-if="errorMessage" class="text-red-500 text-center text-sm">
            {{ errorMessage }}
          </div>

          <!-- 按鈕組 -->
          <div class="space-y-4">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full h-[48px] flex justify-center items-center border border-transparent rounded-[12px] shadow-sm text-base font-medium text-white bg-[#0F93A2] hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              {{ isLoading ? '處理中...' : '重設密碼' }}
            </button>

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