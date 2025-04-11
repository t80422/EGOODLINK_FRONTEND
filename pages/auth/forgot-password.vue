<!-- pages/auth/forgot-password.vue -->
<template>
  <div class="min-h-[75vh] bg-white">
    <!-- Breadcrumb -->
    <div class="bg-white p-4 mb-6 border-t border-gray-200">
      <div class="container mx-auto px-4">
        <p class="text-sm text-gray-600 flex items-center">
          <NuxtLink to="/" class="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </NuxtLink>
          <span class="mx-2">/</span>
          <span>忘記密碼</span>
        </p>
      </div>
    </div>

    <main class="flex items-center justify-center py-8 px-4">
      <div class="w-full max-w-[640px] space-y-6 md:space-y-8">
        <!-- 標題 -->
        <div class="mb-6 md:mb-8">
          <h1 class="text-center text-xl md:text-2xl font-bold text-gray-900 mt-6 md:mt-10">忘記密碼</h1>
          <!-- 可選的說明文字 -->
          <!-- <p class="mt-2 text-center text-sm md:text-base text-gray-600">
            請輸入您的電子郵件，我們將寄送重設密碼連結給您
          </p> -->
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit" class="space-y-6 md:space-y-8">
          <!-- Email 輸入 -->
          <div>
            <label for="email" class="block text-base md:text-lg font-medium text-gray-700">信箱</label>
            <input
              v-model="email"
              id="email"
              type="email"
              required
              placeholder="請輸入您的信箱"
              class="mt-1 block w-full h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- 錯誤訊息 -->
          <div v-if="errorMessage" class="text-red-500 text-center text-sm md:text-base">
            {{ errorMessage }}
          </div>

          <!-- 送出按鈕 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-[40px] md:h-[48px] flex justify-center items-center border border-transparent rounded-[12px] shadow-sm text-sm md:text-base font-medium text-white bg-[#0F93A2] hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? '處理中...' : '送出' }}
          </button>

          <!-- 返回登入 -->
          <!-- <div class="text-center mt-4">
            <a @click="router.push('/auth/login')" 
              class="text-sm md:text-base cursor-pointer hover:text-teal-600"
            >
              返回登入
            </a>
          </div> -->
        </form>
      </div>
    </main>
  </div>
</template>