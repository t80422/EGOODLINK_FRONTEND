<script setup>
import { ref,onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id
const items = ref([])
const purchaseDate = ref('')
const note = ref('')
const isLoading = ref(false)
const error = ref(null)
const isSubmitting = ref(false)
const giftDropdown = ref(false)
const giftOptions = ref([])
const showDropdown = ref(false)
const searchResults = ref([])
const isSearching = ref(false)

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const handleBreadcrumbClick = (path) => {
  if (path) {
    router.push(path)
  }
}

const breadcrumbItems = [
  {
    title: '首頁',
    href: '/backsite',
    disabled: false
  },
  {
    title: '進貨管理',
    href: '/backsite/purchase',
    disabled: false
  },
  {
    title: '編輯',
    disabled: true
  }
]

// 修改列表項目
const addItem = () => {
  items.value.push({
    stockInfo: '', 
    giftImage: null,
    giftName: '',
    quantity: 1,
    showDropdown: false,  // 為每個項目添加獨立的下拉選單狀態
    showGiftDropdown: false // 紀念品下拉選單狀態
  })
}

const fetchPurchaseData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // 取得進貨單資料
    const response = await fetch(`/index.php/api/admin/purchase/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    
    if (result.status && result.data) {
      purchaseDate.value = result.data.date
      note.value = result.data.memo
      
      // 取得股東會選項資料
      const stockResponse = await fetch('/index.php/api/stockOpions', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      
      const stockResult = await stockResponse.json()
      
      if (stockResult.status) {
        // 設置商品列表，並對應股東會資訊
        items.value = await Promise.all(result.data.details.map(async detail => {
          // 找到對應的股東會資訊
          const stockInfo = stockResult.data.find(stock => stock.value === detail.stockId)
          
          // 取得紀念品選項
          const productResponse = await fetch(`/index.php/api/productOptions/${detail.stockId}`, {
            headers: {
              'Authorization': `Bearer ${authStore.token}`
            }
          })
          
          const productResult = await productResponse.json()
          
          // 找到對應的紀念品資訊
          const giftInfo = productResult.status ? 
            productResult.data.find(product => product.value === detail.productId.toString()) : null
          
          return {
            stockInfo: stockInfo ? stockInfo.label : '', // 使用股東會的 label
            stockId: detail.stockId,
            giftName: giftInfo ? giftInfo.label : '',  // 使用紀念品的 label
            productId: detail.productId,
            quantity: detail.qty,
            showDropdown: false,
            showGiftDropdown: false
          }
        }))
      }
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    error.value = '發生錯誤，請稍後再試'
    console.error('API Error:', err)
  } finally {
    isLoading.value = false
  }
}

// 新增取得紀念品選項函數
const fetchGiftOptions = async (sgId, currentIndex) => {
  try {
    const response = await fetch(`/index.php/api/productOptions/${sgId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    if (result.status) {
      giftOptions.value = result.data
      // 自動顯示下拉選單
      items.value[currentIndex].showGiftDropdown = true
      if (result.data.length === 0) {
        alert('此股東會尚無紀念品資料')
      }
    }
  } catch (error) {
    console.error('獲取紀念品選項失敗:', error)
    giftOptions.value = []
  }
}

const handleBack = () => {
  router.push('/backsite/purchase')
}

// 修改 handleSelect 函數
const handleSelect = async (selected, index) => {
  items.value[index].stockInfo = selected.label
  items.value[index].stockId = parseInt(selected.value)
  items.value[index].showDropdown = false  // 關閉股東會下拉選單
  // 清空紀念品相關欄位
  items.value[index].giftName = ''
  items.value[index].productId = null
  await fetchGiftOptions(selected.value, index)
}

// 新增紀念品選擇處理函數
const handleGiftSelect = (selected, index) => {
  items.value[index].giftName = selected.label
  items.value[index].productId = parseInt(selected.value)
  items.value[index].showGiftDropdown = false  // 關閉當前項目的紀念品下拉選單
}

// 搜尋股票
const searchStock = async (searchText, currentIndex) => {
  try {
    if (!searchText || searchText.length < 2) {
      searchResults.value = []
      items.value[currentIndex].showDropdown = false
      return
    }

    isSearching.value = true
    
    const response = await fetch(`/index.php/api/stockOpions?keyword=${searchText}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    if (result.status) {
      const searchLower = searchText.toLowerCase().trim()
      
      // 改進搜尋邏輯
      const filteredResults = result.data.filter(item => {
        const [code, ...nameParts] = item.label.toLowerCase().split(' ')
        const name = nameParts.join(' ')
        
        return code.includes(searchLower) || 
               (name && name.includes(searchLower))
      })

      searchResults.value = filteredResults
      // 只更新當前項目的下拉選單狀態
      items.value[currentIndex].showDropdown = filteredResults.length > 0
    }
  } catch (error) {
    console.error('搜尋失敗:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 修改延遲搜尋函數
const debouncedSearch = (() => {
  const timers = {}
  
  return (value, index) => {
    // 清除該索引的計時器
    if (timers[index]) {
      clearTimeout(timers[index])
    }
    
    // 關閉其他項目的下拉選單
    items.value.forEach((item, i) => {
      if (i !== index) {
        item.showDropdown = false
      }
    })
    
    if (value) {
      timers[index] = setTimeout(() => {
        searchStock(value, index)
      }, 300)
    } else {
      items.value[index].showDropdown = false
      searchResults.value = []
    }
  }
})()

// 刪除列表項目
const removeItem = (index) => {
  items.value.splice(index, 1)
}

onMounted(() => {
  fetchPurchaseData()
})

// 表單驗證
const validateForm = () => {
  // 驗證進貨日期
  if (!purchaseDate.value) {
    alert('請選擇進貨日期')
    return false
  }

  // 驗證商品列表
  if (!items.value || items.value.length === 0) {
    alert('請至少新增一項商品')
    return false
  }

  // 驗證每個商品項目
  for (const item of items.value) {
    if (!item.stockInfo?.trim()) {
      alert('請輸入股號及股名')
      return false
    }
    if (!item.giftName?.trim()) {
      alert('請輸入紀念品名稱')
      return false
    }
    if (!item.quantity || item.quantity < 1) {
      alert('請輸入有效的數量')
      return false
    }
  }

  return true
}

// 提交表單
const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    const formData = new FormData()
    formData.append('date', purchaseDate.value)
    formData.append('memo', note.value)
    
    // 轉換商品列表為正確格式
    const details = items.value.map(item => ({
      stockId: item.stockId, // 使用儲存的 ID
      productId: parseInt(item.productId),
      qty: parseInt(item.quantity)
    }))
    
    // 直接傳送 JSON 格式
    const requestData = {
      date: purchaseDate.value,
      memo: note.value,
      details: details
    }

    const response = await fetch(`/index.php/api/admin/purchase/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'  // 指定 Content-Type
      },
      body: JSON.stringify(requestData)  // 將整個物件轉為 JSON 字串
    })

    const result = await response.json()
    console.log('API 回應:', result)
    
    if (result.status) {
      alert('更新成功')
      router.push('/backsite/purchase')
    } else {
      alert(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新失敗:', error)
    alert('系統錯誤，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    <v-main>
    <div class="flex-1 flex flex-col">
      <main class="flex-1 pt-24 px-6">
        <div class="max-w-7xl mx-auto">
          <!-- Loading 狀態 -->
          <div v-if="isLoading" class="bg-white p-6 rounded-lg shadow-sm mb-4">
            <div class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <span class="ml-2">Loading...</span>
            </div>
          </div>
          
          <!-- 錯誤提示 -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              {{ error }}
            </div>
          </div>

        <div  v-if="!isLoading && !error" class="max-w-7xl mx-auto bg-white p-6">
          <!-- 麵包屑 -->
        <div class="mb-6">
          <v-breadcrumbs
              :items="breadcrumbItems"
              divider="/"
              class="mb-4 bg-white rounded-lg shadow-sm p-3 relative z-50"
            >
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :disabled="item.disabled"
                  @click="handleBreadcrumbClick(item.href)"
                  :title="item.disabled ? '' : '點擊返回' + item.title"
                  :class="{ 'cursor-pointer': !item.disabled, 'cursor-not-allowed': item.disabled }"
                >
                  {{ item.title }}
                </v-breadcrumbs-item>
              </template>
              <template v-slot:divider>
                <v-icon icon="mdi-chevron-right"></v-icon>
              </template>
            </v-breadcrumbs>
        </div>
          
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">修改進貨單</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- 進貨日期 -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">日期 <span class="text-red-500">*</span></label>
                <input 
                  type="date"
                  v-model="purchaseDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
              </div>

              <!-- 備註 -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">備註</label>
                <textarea 
                  v-model="note"
                  rows="1"
                  placeholder="請輸入備註"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

            <!-- 動態列表 -->
            <div class="col-span-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">商品列表</h3>
                <button 
                @click="addItem"
                class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                新增項目
                </button>
            </div>

            <div v-for="(item, index) in items" :key="index" class="border p-4 mb-4 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 股號及股名 -->
                    <div class="relative">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        股東會<span class="text-red-500">*</span>
                      </label>
                      <div class="flex">
                        <input 
                          type="text"
                          placeholder="請輸入股號 (例：2330) 或股名 (例：台積電)"
                          v-model="item.stockInfo"
                          @input="debouncedSearch($event.target.value, index)"
                          @focus="debouncedSearch(item.stockInfo, index)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                      </div>
                      
                      <!-- 下拉選單 -->
                      <div 
                        v-if="item.showDropdown && searchResults.length > 0" 
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
                      >
                        <div 
                          v-for="result in searchResults" 
                          :key="result.value"
                          @click="handleSelect(result, index)"
                          class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {{ result.label }}
                        </div>
                      </div>
                    </div>

                    <!-- 紀念品名稱 -->
                    <div class="relative">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        紀念品名稱 <span class="text-red-500">*</span>
                      </label>
                      <div class="flex">
                        <input 
                          type="text"
                          v-model="item.giftName"
                          placeholder="請選擇紀念品"
                          @click="item.showGiftDropdown = true"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                          readonly
                        >
                      </div>
                      
                      <!-- 紀念品下拉選單 -->
                      <div v-if="item.showGiftDropdown && giftOptions.length > 0" 
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <template v-if="giftOptions.length > 0">
                          <div v-for="option in giftOptions" 
                            :key="option.value"
                            @click="handleGiftSelect(option, index)"
                            class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            {{ option.label }}
                          </div>
                        </template>
                        <div v-else class="px-4 py-2 text-gray-500 text-center">
                          查無紀念品資料
                        </div>
                      </div>
                    </div>

                    <!-- 數量 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">數量</label>
                        <input 
                        type="number"
                        placeholder="請輸入數量"
                        v-model="item.quantity"
                        min="1"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                    </div>

                    <!-- 刪除按鈕 -->
                    <div class="flex items-end">
                        <button 
                        @click="removeItem(index)"
                        class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        v-if="items.length > 1"
                        >
                        刪除
                        </button>
                    </div>
              </div>
            </div>
            </div>


        </div>

          <!-- 送出按鈕 -->
          <div class="mt-6 flex justify-end space-x-4">
                <button 
                @click="handleBack"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                返回
                </button>
                <button 
                @click="handleSubmit"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                {{ isSubmitting ? '提交中...' : '修改' }}
                </button>
            </div>
        </div>
      </div>
    </main>
    </div>
  </v-main>
</v-layout>
</template>

<style scoped>
.grid {
  grid-gap: 1.5rem;
}
</style>