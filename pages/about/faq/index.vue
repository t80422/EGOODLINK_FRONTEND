<script setup>
import { ref } from 'vue';
import ScrollToTop from '~/components/common/ScrollToTop.vue'

definePageMeta({
  title: '常見問題'
})

const faqs = ref([])
const isLoading = ref(true)
const error = ref(null)
const openIndex = ref(null)

// 獲取 QA 列表
const fetchQaData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetch('/index.php/api/qa')
    const result = await response.json()

    if (result.status) {
      // 轉換資料格式以符合前台顯示需求
      faqs.value = result.data.map(item => ({
        question: item.title,
        answer: item.content
      }))
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    console.error('獲取 QA 列表失敗:', err)
    error.value = '系統錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

function toggleFaq(index) {
  openIndex.value = openIndex.value === index ? null : index
}

onMounted(() => {
  fetchQaData()
})
</script>

<template>
<div>
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-4 sm:py-6 lg:py-8 px-4">
      <ScrollToTop />
    </div>

    <div class="min-h-[75vh] bg-white">
        <!-- Breadcrumb -->
        <div class="bg-white p-4 mb-4 sm:mb-6 border-t border-gray-200">
        <div class="w-full max-w-[1760px] mx-auto mt-3 sm:mt-5 px-4">
          <p class="text-sm text-gray-600 flex items-center flex-wrap">
            <NuxtLink to="/" class="hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </NuxtLink>
            <span class="mx-2">/</span>
            <span>關於我們</span>
            <span class="mx-2">/</span>
            <span>常見問題</span>
          </p>
        </div>
      </div>

        <!-- FAQ Content -->
        <div class="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-4 sm:mb-6 lg:mb-8">常見問題</h1>

          <!-- 載入中狀態 -->
          <div v-if="isLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
            <p class="mt-2 text-gray-600">載入中...</p>
          </div>

          <!-- 錯誤狀態 -->
          <div v-else-if="error" class="text-center py-8">
            <div class="bg-red-50 p-4 rounded-lg">
              <p class="text-red-600">{{ error }}</p>
            </div>
          </div>

          <!-- FAQ 列表 -->
          <div v-else class="space-y-4">
            <div 
              v-for="(item, index) in faqs" 
              :key="index" 
              class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <button
                class="w-full text-left px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex justify-between items-center"
                @click="toggleFaq(index)"
              >
                <span class="font-bold text-sm sm:text-base flex-1 pr-4" style="color: #0F93A2">
                  {{ item.question }}
                </span>
                <svg
                  :class="{ 'transform rotate-180': openIndex === index }"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 flex-shrink-0 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div 
                v-if="openIndex === index" 
                class="px-4 sm:px-6 py-3 sm:py-4 bg-white"
              >
                <p class="text-sm sm:text-base text-gray-700 leading-relaxed" v-html="item.answer"></p>
              </div>
            </div>
          </div>
        </div>
    </div>
</div>
</template>

<style>

</style>