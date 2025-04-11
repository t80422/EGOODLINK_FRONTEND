<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'


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
    title: '倉庫管理',
    href: '/backsite/warehouse',
    disabled: false
  },
  {
    title: '新增倉庫',
    disabled: true
  }
]

const router = useRouter()
const authStore = useAuthStore()
// 驗證錯誤
const errors = ref({})
const isSubmitting = ref(false)
// const giftDropdown = ref(false)
// const giftOptions = ref([])

const handleBack = () => {
  router.push('/backsite/warehouse')
}

// 表單資料
const formData = ref({
  stockInfo: '',     // 股東會顯示文字
  stockId: '',       // 股東會 ID
  giftName: '',      // 紀念品名稱
  giftImage: null    // 紀念品圖片
})


const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 圖片預覽
const imagePreview = ref(null)
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.giftImage = file
    imagePreview.value = URL.createObjectURL(file)
  }
}
const formErrors = ref({
  stockCode: '',
  stockName: '',
  giftName: ''
})

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    stockId: '',
    giftName: ''
  }

  // 檢查股東會 ID
  if (!formData.value.stockId) {
    formErrors.value.stockId = '請選擇股東會'
    isValid = false
  }

  // 檢查紀念品名稱
  if (!formData.value.giftName || formData.value.giftName.trim() === '') {
    formErrors.value.giftName = '請輸入紀念品名稱'
    isValid = false
  }

  if (!isValid) {
    alert('請填寫必填欄位')
  }

  return isValid
}

// 搜尋相關
const showDropdown = ref(false)
const searchResults = ref([])
const isSearching = ref(false)

// 修改 handleSelect 函數
const handleSelect = async (selected) => {
  formData.value.stockInfo = selected.label
  formData.value.stockId = parseInt(selected.value) // 儲存股東會 ID
  showDropdown.value = false
  await fetchGiftOptions(selected.value)
}

// 搜尋股票
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

// 表單提交
const handleSubmit = async () => {
  try {
    if (!validateForm()) {
      return
    }

    isSubmitting.value = true

    // 準備 FormData，使用正確的欄位名稱
    const formDataToSend = new FormData()
    formDataToSend.append('sgId', formData.value.stockId)    // 改用 sgId
    formDataToSend.append('name', formData.value.giftName)   // 改用 name
    if (formData.value.giftImage) {
      formDataToSend.append('img', formData.value.giftImage) // 改用 img
    }

    // 除錯用
    console.log('準備發送的資料:', {
      sgId: formData.value.stockId,
      name: formData.value.giftName,
      hasImage: !!formData.value.giftImage
    })

    const response = await fetch('/index.php/api/admin/product', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formDataToSend
    })

    const result = await response.json()
    console.log('API 回應:', result) // 除錯用
    
    if (result.status) {
      alert('新增成功')
      router.push('/backsite/warehouse')
    } else {
      throw new Error(result.message || '新增失敗')
    }
  } catch (error) {
    console.error('新增失敗:', error)
    alert(error.message || '系統發生錯誤，請稍後再試')
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

            <h2 class="text-2xl font-semibold text-gray-800 mb-6">新增</h2>

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
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}
</style>