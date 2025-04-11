<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const router = useRouter()
const isSubmitting = ref(false) 
const searchResults = ref([])

const handleBack = () => {
  router.push('/backsite/purchase')
}

// 表單資料
const purchaseDate = ref(new Date().toISOString().substr(0, 10))
const note = ref('')
const items = ref([{
  stockInfo: '',
  stockId: null,
  giftName: '',
  productId: null,
  qty: 1,
  showDropdown: false,      // 股東會下拉選單狀態
  showGiftDropdown: false   // 紀念品下拉選單狀態
}])

const formErrors = ref({
  purchaseDate: '',
  items: []
})

// 新增列表項目
const addItem = () => {
  items.value.push({
    stockInfo: '',
    stockId: null,
    giftName: '',
    productId: null,
    qty: 1,  // 使用 qty 而不是 quantity
    showDropdown: false,
    showGiftDropdown: false
  })
}

const giftDropdown = ref(false)
const giftOptions = ref([])

const validateForm = () => {
  // 檢查進貨日期
  if (!purchaseDate.value) {
    alert('請選擇進貨日期')
    return false
  }

  // 檢查是否有商品項目
  if (items.value.length === 0) {
    alert('請至少新增一項商品')
    return false
  }

  // 檢查每個商品項目
  for (const item of items.value) {
    if (!item.stockId) {
      alert('請選擇股東會')
      return false
    }
    if (!item.productId) {
      alert('請選擇紀念品')
      return false
    }
    if (!item.qty || item.qty < 1) {
      alert('請輸入有效的數量')
      return false
    }
  }

  return true
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
      // 只更新當前項目的下拉選單狀態
      if (items.value[currentIndex]) {
        items.value[currentIndex].showGiftDropdown = true
      }
      if (result.data.length === 0) {
        alert('此股東會尚無紀念品資料')
      }
    }
  } catch (error) {
    console.error('獲取紀念品選項失敗:', error)
    giftOptions.value = []
  }
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
    console.log('開始搜尋:', { searchText, currentIndex }) // 除錯用
    
    if (!searchText || searchText.length < 2) {
      searchResults.value = []
      items.value[currentIndex].showDropdown = false
      return
    }

    const response = await fetch(`/index.php/api/stockOpions?keyword=${searchText}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    console.log('API回應:', result) // 除錯用
    
    if (result.status) {
      const searchLower = searchText.toLowerCase().trim()
      searchResults.value = result.data.filter(item => {
        const itemLabel = item.label.toLowerCase()
        return itemLabel.includes(searchLower)
      })
      
      // 更新下拉選單狀態
      items.value[currentIndex].showDropdown = searchResults.value.length > 0
      console.log('搜尋結果:', searchResults.value) // 除錯用
    }
  } catch (error) {
    console.error('搜尋失敗:', error)
    searchResults.value = []
    items.value[currentIndex].showDropdown = false
  }
}

// 延遲搜尋
const debouncedSearch = (() => {
  const timers = {}
  
  return (value, index) => {
    console.log('觸發搜尋:', { value, index }) // 除錯用
    
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
      timers[index] = setTimeout(async () => {
        await searchStock(value, index)
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

// 提交表單
const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    if (!validateForm()) return

    // 1. 檢查必填欄位
    if (!purchaseDate.value) {
      throw new Error('請選擇進貨日期')
    }

    // 2. 檢查商品資料
    const validItems = items.value.filter(item => {
      // 確保 productId 和 qty 都是有效的數值
      const productId = parseInt(item.productId)
      const qty = parseInt(item.qty)
      return (
        !isNaN(productId) && 
        productId > 0 && 
        !isNaN(qty) && 
        qty > 0 && 
        item.giftName // 確保有選擇紀念品
      )
    })

    if (validItems.length === 0) {
      throw new Error('請至少填寫一項有效的商品資料')
    }

    // 3. 準備符合 API 格式的資料
    const requestData = {
      date: purchaseDate.value,            // 日期
      memo: note.value?.trim() || '',      // 備註，如果沒有則為空字串
      details: validItems.map(item => ({   // 進貨明細
        productId: parseInt(item.productId), // 紀念品編號
        qty: parseInt(item.qty)             // 數量
      }))
    }

    console.log('送出資料:', requestData)

    // 4. 發送請求
    const response = await fetch('/index.php/api/admin/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    console.log('API 回應:', result)

    if (result.status) {
      alert('新增成功')
      router.push('/backsite/purchase')
    } else {
      throw new Error(result.message || '新增失敗')
    }
  } catch (error) {
    console.error('新增失敗:', error)
    alert(error.message)
  } finally {
    isSubmitting.value = false
  }
}

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
    title: '新增',
    disabled: true
  }
]

</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    <v-main>
    <div class="flex-1 flex flex-col">
      <main class="flex-1 pt-24 px-6">
        <div class="max-w-7xl mx-auto bg-white p-6">
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
          
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">新增進貨單</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 出貨日期 -->
                <div class="col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    進貨日期<span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    v-model="purchaseDate"
                    :class="{'border-red-500': formErrors.purchaseDate}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>

                <!-- 備註 -->
                <div class="col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-2">備註</label>
                <textarea 
                    v-model="note"
                    rows="3"
                    placeholder="請輸入備註"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          @focus="() => debouncedSearch(item.stockInfo, index)"
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
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        數量 <span class="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        placeholder="請輸入數量"
                        v-model="item.qty"
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
                  {{ isSubmitting ? '提交中...' : '新增' }}
                </button>
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

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.z-10 {
  z-index: 10;
}
</style>