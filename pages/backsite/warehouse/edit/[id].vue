<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id
const isLoading = ref(false)
const error = ref(null)

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
    title: '倉庫管理',
    href: '/backsite/warehouse',
    disabled: false
  },
  {
    title: '編輯倉庫',
    disabled: true
  }
]

// 表單資料
const formData = ref({
  id: '',
  stockInfo: '',       // 股東會資訊
  stockId: '',         // 股東會 ID
  giftName: '',        // 紀念品名稱
  giftImage: null,     // 紀念品圖片
  qty: '',            // 數量
  creator: '',        // 建立人
  createTime: '',     // 建立時間
  modifier: '',       // 修改人
  modifyTime: ''      // 修改時間
})

// 圖片預覽
const imagePreview = ref(null)
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.giftImage = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

// 驗證錯誤
const formErrors = ref({
  stock: '',
  giftName: ''
})

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    giftName: '',
    qty: ''
  }

  // 檢查紀念品名稱
  if (!formData.value.giftName?.trim()) {
    formErrors.value.giftName = '請輸入紀念品名稱'
    isValid = false
  }

  // 檢查數量
  if (formData.value.qty === '' || formData.value.qty === null || formData.value.qty < 0) {
    formErrors.value.qty = '請輸入有效的數量'
    isValid = false
  }

  return isValid
}

const isSubmitting = ref(false)
const handleBack = () => {
  router.push('/backsite/warehouse')
}

const fetchWarehouseDetail = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await fetch(`/index.php/api/admin/product/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    console.log('API回傳資料:', result) // 除錯用
    
    if (result.status) {
      const data = result.data
      formData.value = {
        id: data.id,
        stockInfo: data.stock,     // 只需顯示，不需修改
        giftName: data.name,       // 對應 name
        giftImage: data.img,       // 對應 img
        qty: data.qty,            // 對應 qty
        creator: data.creator,
        createTime: data.createdAt,
        modifier: data.updater,
        modifyTime: data.updatedAt
      }
      
      // 設置圖片預覽
      if (data.img) {
        imagePreview.value = data.img
      }
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    error.value = '系統錯誤，請稍後再試'
    console.error('API Error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  if (isLoading.value) return
  
  if (!validateForm()) {
    alert('請確認必填欄位都已填寫')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.value.giftName)
    formDataToSend.append('qty', formData.value.qty)
    
    // 只有當有新上傳圖片時才傳送
    if (formData.value.giftImage instanceof File) {
      formDataToSend.append('img', formData.value.giftImage)
    }

    console.log('準備發送資料:', {
      name: formData.value.giftName,
      qty: formData.value.qty,
      hasNewImage: formData.value.giftImage instanceof File
    })

    const response = await fetch(`/index.php/api/admin/product/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('API 回應:', result)
    
    if (result.status) {
      alert('更新成功')
      router.push('/backsite/warehouse')
    } else {
      throw new Error(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新失敗:', error)
    alert(error.message || '系統錯誤，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

const fetchGiftOptions = async (sgId) => {
  try {
    const response = await fetch(`/index.php/api/productOptions/${sgId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    if (result.status) {
      giftOptions.value = result.data
      if (result.data.length === 0) {
        alert('此股東會尚無紀念品資料')
      }
    }
  } catch (error) {
    console.error('獲取紀念品選項失敗:', error)
    giftOptions.value = []
  }
}

// 新增搜尋相關狀態
const showDropdown = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const giftDropdown = ref(false)
const giftOptions = ref([])

// 新增搜尋股票函數
const searchStock = async (searchText) => {
  try {
    // 檢查搜尋文字長度
    if (!searchText || searchText.length < 2) {
      searchResults.value = []
      showDropdown.value = false
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
      // 將搜尋文字轉為小寫，用於比對
      const searchLower = searchText.toLowerCase().trim()
      
      // 過濾結果，只保留符合搜尋條件的項目
      const filteredResults = result.data.filter(item => {
        // 分割股票代碼和名稱 (例：2330 台積電)
        const [code, name] = item.label.toLowerCase().split(' ')
        
        // 檢查是否符合搜尋條件：
        // 1. 股票代碼開頭符合
        // 2. 股票名稱包含搜尋文字
        return code.startsWith(searchLower) || 
               (name && name.includes(searchLower))
      })

      searchResults.value = filteredResults
      showDropdown.value = filteredResults.length > 0
    }
  } catch (error) {
    console.error('搜尋失敗:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 新增股票選擇處理函數
const handleStockSelect = async (selected) => {
  formData.value.searchText = selected.label
  formData.value.stockInfo = selected.label
  formData.value.stockId = selected.value
  showDropdown.value = false
  // 當選擇股東會後，獲取對應的紀念品選項
  await fetchGiftOptions(selected.value)
}

// 修改 handleSelect 函數
const handleSelect = async (selected) => {
  formData.value.stockInfo = selected.label
  formData.value.stockId = parseInt(selected.value) // 儲存股東會 ID
  showDropdown.value = false
  await fetchGiftOptions(selected.value)
}

const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const debouncedSearch = (() => {
  let timer
  return (value, index) => {
    clearTimeout(timer)
    // 清除之前的搜尋結果
    searchResults.value = []
    showDropdown.value = false
    
    if (value) {
      timer = setTimeout(() => {
        searchStock(value, index)
      }, 300) // 300ms 延遲
    }
  }
})()

onMounted(async () => {
  await fetchWarehouseDetail()
  if (formData.value.stockId) {
    await fetchGiftOptions(formData.value.stockId)
  }
})
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

          <h2 class="text-2xl font-semibold text-gray-800 mb-6">編輯倉庫管理</h2>

          <!-- 倉庫內容區域 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 股號和股名 -->
            <div class="relative">
                      <label class="block text-sm font-medium text-gray-700 mb-2">股東會<span class="text-red-500">*</span></label>
                      <div class="flex">
                        <input 
                          type="text"
                          placeholder="請輸入股號 (例：2330) 或股名 (例：台積電)"
                          v-model="formData.stockInfo"
                          @input="debouncedSearch($event.target.value)"
                          @focus="showDropdown = true"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md"
                          readonly
                        >
                      </div>

                      <!-- 下拉選單 -->
                      <div v-if="showDropdown && searchResults.length > 0" 
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <div v-for="result in searchResults" 
                          :key="result.value"
                          @click="handleSelect(result, index)"
                          class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
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
                          v-model="formData.giftName"
                          placeholder="請輸入紀念品名稱"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                      </div>
                      <!-- 錯誤提示 -->
                      <p v-if="formErrors.giftName" class="text-red-500 text-xs mt-1">
                        {{ formErrors.giftName }}
                      </p>
                    </div>

                <!-- 數量 -->
                <div class="col-span-full">
                  <label class="block text-sm font-medium text-gray-700 mb-2">數量 <span class="text-red-500">*</span></label>
                  <input 
                    type="number"
                    v-model="formData.qty"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{'border-red-500': formErrors.qty}"
                    min="0"
                  >
                  <p v-if="formErrors.qty" class="mt-1 text-sm text-red-500">{{ formErrors.qty }}</p>
                </div>

            <!-- 紀念品圖片 -->
            <div class="col-span-full">
              <label class="block text-sm font-medium text-gray-700 mb-2">紀念品圖片</label>
              <input 
                type="file"
                @change="handleImageUpload"
                accept="image/*"
                class="w-full"
              >
              <img 
                v-if="imagePreview" 
                :src="imagePreview" 
                class="mt-2 h-32 object-contain"
              >
            </div>
           <!-- 建立人 -->
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">建立人</label>
            <input 
              type="text"
              v-model="formData.creator"
              class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
              readonly
            >
          </div>

          <!-- 建立時間 -->
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">建立時間</label>
            <input 
              type="text"
              v-model="formData.createTime"
              class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
              readonly
            >
          </div>

          <!-- 修改人 -->
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">修改人</label>
            <input 
              type="text"
              v-model="formData.modifier"
              class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
              readonly
            >
          </div>

          <!-- 修改時間 -->
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">修改時間</label>
            <input 
              type="text"
              v-model="formData.modifyTime"
              class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
              readonly
            >
          </div>
          </div>

          <!-- 按鈕區域 -->
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
              {{ isSubmitting ? '更新中...' : '更新' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </v-main>
</v-layout>
</template>