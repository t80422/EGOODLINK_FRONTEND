<script setup>
import { ref, onMounted } from 'vue'
import ScrollToTop from '~/components/common/ScrollToTop.vue'

definePageMeta({
  title: '代領服務據點'
})

const contactPoints = ref([])
const isLoading = ref(true)
const error = ref(null)

// 頁面元資料
useHead({
  title: '營運據點',
  meta: [
    {
      name: 'description',
      content: '查看我們的營運據點資訊'
    }
  ]
});

// 獲取據點列表
const fetchLocationData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetch('/index.php/api/locations', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const result = await response.json()

    if (result.status && result.data?.items) {
      contactPoints.value = result.data.items
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (error) {
    console.error('獲取據點列表失敗:', error)
    error.value = '系統發生錯誤'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLocationData()
})

</script>

<template>
<div>
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-4 sm:py-6 lg:py-8 px-4">
      <ScrollToTop />
    </div>

    <div class="min-h-[75vh] bg-white">
        <!-- todo Breadcrumb -->
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
              <span>代領服務據點</span>
            </p>
          </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div v-if="isLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
            <p class="mt-2 text-gray-600">載入中...</p>
          </div>

          <div v-else-if="error" class="text-center py-8">
          <div class="bg-red-50 p-4 rounded-lg">
            <p class="text-red-600">{{ error }}</p>
          </div>
        </div>

         <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div v-for="point in contactPoints" 
              :key="point.id" 
              class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <!-- 左側圖片 -->
              <div class="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0">
                <img 
                  :src="point.imgUrl || '/images/no-image.jpg'" 
                  :alt="point.name"
                  class="w-full h-full object-cover rounded"
                />
              </div>
              
              <!-- 右側資訊 -->
              <div class="flex flex-col space-y-2 flex-grow">
                <h2 class="text-lg sm:text-xl font-bold">{{ point.name }}</h2>
                <div class="space-y-2 text-sm sm:text-base text-gray-600">
                  <p class="flex items-center">
                    <span class="font-medium min-w-[3rem]">電話：</span>
                    <span>{{ point.phone }}</span>
                  </p>
                  <p class="flex items-start">
                    <span class="font-medium min-w-[3rem]">地址：</span>
                    <span class="break-words flex-1">{{ point.address }}</span>
                  </p>
                  <p v-if="point.lineLink" class="mt-2">
                    <a 
                      :href="point.lineLink" 
                      target="_blank" 
                      class="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                      <span>LINE</span>
                      <v-icon icon="mdi-link" size="small" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
</div>
</template>
