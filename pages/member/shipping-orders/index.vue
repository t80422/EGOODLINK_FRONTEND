<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'
import ScrollToTop from '~/components/common/ScrollToTop.vue'


definePageMeta({
  title: '我的出貨單'
})

const authStore = useAuthStore()
const router = useRouter()
const orders = ref([])
const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchKeyword = ref('')
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear.toString())
const years = ref(Array.from({ length: 5 }, (_, i) => currentYear - i))

// 搜尋出貨列表
const searchOrders = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // 建立查詢參數
    const params = {
      year: selectedYear.value,
      page: currentPage.value // 加入分頁參數
    }
    
    // 只有在有關鍵字時才加入 keyword 參數
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const queryString = new URLSearchParams(params).toString()
    const response = await fetch(`/index.php/api/client/myShipment?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.status && result.data) {
      orders.value = result.data.items
      currentPage.value = parseInt(result.data.page)
      totalPages.value = parseInt(result.data.totalPages)
      totalItems.value = parseInt(result.data.total)
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    error.value = '系統錯誤'
    console.error('API Error:', err)
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

// 新增搜尋函數
const handleSearch = () => {
  // 更新 URL 參數
  router.push({
    query: {
      year: selectedYear.value,
      page: currentPage.value,
      ...(searchKeyword.value && { keyword: searchKeyword.value })
    }
  })
  
  currentPage.value = 1
  searchOrders() 
}

// 清除搜尋條件
const clearFilters = () => { 
  searchKeyword.value = ''
  selectedYear.value = currentYear.toString()
  currentPage.value = 1 // 重設頁碼
  searchOrders()
}

const handlePageChange = (page) => {
  currentPage.value = page
  router.push({
    query: {
      ...route.query,
      page: page
    }
  })
  searchOrders()
}

onMounted(() => {
  searchOrders()
})
</script>

<template>
    <div>
      <!-- ScrollToTop 按鈕 -->
      <div class="container mx-auto py-4 px-4 sm:py-6 lg:py-8">
        <ScrollToTop />
      </div>
  
      <div class="min-h-[75vh] bg-white">
        <!-- todo Breadcrumb -->
        <div class="bg-white p-4 mb-4 sm:mb-6 border-t border-gray-200">
          <div class="w-full max-w-[1760px] mx-auto px-4">
            <p class="text-sm text-gray-600 flex items-center flex-wrap">
              <NuxtLink to="/" class="hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </NuxtLink>
              <span class="mx-2">/</span>
              <span>會員管理</span>
              <span class="mx-2">/</span>
              <span>我的出貨單</span>
            </p>
            <h1 class="text-xl sm:text-2xl mt-4 sm:mt-8 mb-4 sm:mb-5 font-bold text-gray-900">我的出貨單</h1>
  
            <!--todo 搜尋區塊-->
            <div class="flex flex-col sm:flex-row justify-between border border-[#0F93A2] rounded-lg bg-[#8ADCE7] p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <!-- 年份選擇 -->
                <div class="relative w-full sm:w-[200px]">
                <select
                  v-model="selectedYear"
                  class="w-full h-12 text-sm border border-[#0F93A2] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer"
                >
                    <option
                      v-for="year in years"
                      :key="year"
                      :value="year.toString()"
                    >
                      {{ year }} 年
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <!-- 搜尋框 -->
                <input 
                v-model="searchKeyword"
                class="w-full sm:w-[400px] h-12 border border-[#0F93A2] rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="出貨單號、股名、股號" 
              />

                <!-- 按鈕群組 -->
                <div class="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <button 
                  @click="clearFilters"
                  class="flex-1 sm:flex-none sm:w-[128px] h-12 bg-[#004850] text-white rounded-lg transition-colors duration-200 hover:bg-[#003840]"
                >
                  清除條件
                </button>

                <button 
                  @click="handleSearch"
                  class="flex-1 sm:flex-none sm:w-[128px] h-12 bg-[#0F93A2] text-white rounded-lg flex items-center justify-center gap-1 transition-colors duration-200 hover:bg-[#0d8291]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  搜尋
                </button>
              </div>
              </div>
            </div>

            <!--todo 報表內容區塊 -->
            <div class="w-full max-w-[1760px] mx-auto mt-8 sm:mt-16 overflow-x-auto">
              <!-- 訂單列表 -->
              <div v-if="!isLoading && !error && orders.length > 0" class="min-w-full">
                <!-- 表頭 -->
                <div class="bg-gray-50 border-t border-b border-gray-200 px-4 sm:px-8 py-4">
                  <div class="flex items-center justify-between min-w-max">
                    <div class="w-[200px] sm:w-[300px] font-medium text-gray-700">出貨單號</div>
                    <div class="w-[150px] sm:w-[200px] font-medium text-gray-700">日期</div>
                    <div class="w-[100px] sm:w-[180px] font-medium text-gray-700">品項</div>
                    <div class="w-[100px] sm:w-[180px] font-medium text-gray-700">總數</div>
                    <div class="w-[150px] sm:w-[200px] font-medium text-gray-700">狀態</div>
                    <div class="w-[200px] sm:w-[600px] font-medium text-gray-700">備註</div>
                  </div>
                </div>

              <!-- 表格內容 -->
              <div class="bg-white border-b border-gray-200">
                <div v-for="order in orders" :key="order.id"
                  class="flex items-center px-4 sm:px-8 py-4 sm:py-6 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 justify-between min-w-max"
                >
                  <!-- 出貨單號 -->
                  <div class="w-[200px] sm:w-[300px]">
                    <span class="text-blue-600 font-medium text-base sm:text-lg">{{ order.number }}</span>
                  </div>

                  <!-- 日期 -->
                  <div class="w-[150px] sm:w-[200px]">
                    <span class="text-gray-600 text-sm sm:text-base">{{ order.date }}</span>
                  </div>

                  <!-- 品項 -->
                  <div class="w-[100px] sm:w-[180px]">
                    <span class="text-gray-600 text-sm sm:text-base">{{ order.items }} 項</span>
                  </div>

                  <!-- 總數 -->
                  <div class="w-[100px] sm:w-[180px]">
                    <span class="text-gray-600 text-sm sm:text-base">{{ order.total }} 件</span>
                  </div>

                  <!-- 狀態 -->
                  <div class="w-[150px] sm:w-[200px]">
                    <span class="px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-base inline-block min-w-[100px] sm:min-w-[120px] text-center"
                      :class="{
                        'bg-yellow-100 text-yellow-800': order.status === '待出貨',
                        'bg-blue-100 text-blue-800': order.status === '已出貨',
                        'bg-green-100 text-green-800': order.status === '已送達',
                        'bg-red-100 text-red-800': order.status === '已取消'
                      }"
                    >
                      {{ order.status || '未知狀態' }}
                    </span>
                  </div>

                  <!-- 備註 -->
                  <div class="w-[200px] sm:w-[600px] truncate">
                    <span class="text-gray-600 text-sm sm:text-base">{{ order.memo || '無' }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 px-4">
                  <div class="text-gray-500 text-sm">
                    共 {{ totalItems }} 筆資料
                  </div>
                  <div class="flex justify-center w-full mt-4">
                    <v-pagination
                      v-if="totalPages > 1"
                      v-model="currentPage"
                      :length="totalPages"
                      :total-visible="$vuetify.display.smAndUp ? 7 : 3"
                      @update:model-value="handlePageChange"
                      color="primary"
                      rounded
                      show-first-last-page
                      class="mt-4"
                    />
                  </div>
              </div>
              </div>

              <!-- 載入中狀態 -->
              <div v-if="isLoading" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                  <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">載入中...</span>
                </div>
              </div>

              <!-- 錯誤狀態 -->
              <div v-if="error" class="text-center py-8 text-red-500">
                {{ error }}
              </div>

              <!-- 無資料狀態 -->
              <div v-if="!isLoading && !error && orders.length === 0" class="text-center py-8 text-gray-500">
                尚無出貨資料
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>