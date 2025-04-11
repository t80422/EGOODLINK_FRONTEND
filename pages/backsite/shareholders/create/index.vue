<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const router = useRouter()
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
    title: '股東會資訊',
    href: '/backsite/shareholders',
    disabled: false
  },
  {
    title: '新增股東會資訊',
    disabled: true
  }
]

const isSelectOpen = ref(false)

const handleSelectClick = () => {
  isSelectOpen.value = !isSelectOpen.value // 切換狀態
}

const handleSelectBlur = () => {
  isSelectOpen.value = false
}

const isMarketSelectOpen = ref(false)

const handleMarketSelectClick = () => {
  isMarketSelectOpen.value = !isMarketSelectOpen.value
}

const handleMarketSelectBlur = () => {
  isMarketSelectOpen.value = false
}

const handleBack = async () => {
  try {
    await navigateTo('/backsite/shareholders')
    window.location.reload()
  } catch (error) {
    console.error('導航錯誤:', error)
  }
}

// 定義文件類型對應表
const documentTypeMap = {
  id_card: 1,
  health_card: 2,
  driver_license: 3
}

const documents = ref([])
//  submissions ref
const submissions = ref([{
  id: Date.now(),
  name: '組合1',
  selectedDocuments: []
}])

const giftStatus = ref([])

const formData = ref({
  stockCode: '',           // 股號
  stockName: '',          // 股名
  year: '',              // 年分
  meetingType: '',        // 開會性質 (1:臨時, 2:常會)
  meetingDate: '',        // 開會時間
  lastBuyDate: '',        // 最後買進
  deadlineDate: '',       // 代領截止日
  votingDateStart: '',    // 電投起
  votingDateEnd: '',      // 電投迄
  marketType: '',         // 市場別 (0:上市, 1:上櫃, 2:興櫃, 3:公開發行)
  serviceAgent: '',       // 服務代理
  phone: '',             // 電話
  stockPrice: '',        // 股價
  priceChange: '',        // 漲跌
  combinations: [],      // 組合陣列 [{sequence: 1, documentIds: [1,2]}]
  giftStatus: '',
})

// 電話驗證函數
const validatePhone = (phone) => {
  const phoneRegex = /^09\d{8}$/  // 09開頭，後面接8位數字
  return phoneRegex.test(phone)
}

const marketTypes = [
  { label: '上市', value: '0' },
  { label: '上櫃', value: '1' },
  { label: '興櫃', value: '2' },
  { label: '公開發行', value: '3' }
]

const meetingTypes = [
  { label: '臨時', value: '1' },
  { label: '常會', value: '2' }
]

const errors = ref({})

const validateStockCode = (code) => {
  // 數字
  return /^\d+$/.test(code)
}

const validateStockPrice = (price) => {
  // 允許正浮點數
  return /^\d*\.?\d+$/.test(price);
}

const validatePriceChange = (price) => {
  // 允許負數、小數點和數字
  return /^-?\d*\.?\d+$/.test(price)
}

// 漲跌輸入處理
const handlePriceChangeInput = (event) => {
  const value = event.target.value
  
  // 允許負號、數字和小數點
  if (value === '-') {
    // 允許單獨輸入負號
    formData.value.priceChange = value
    return
  }
  
  // 檢查格式是否符合要求：允許負數和小數
  const matches = value.match(/^-?\d*\.?\d*$/)
  if (matches) {
    formData.value.priceChange = value
  }
}

const validateForm = () => {
  errors.value = {}
  
  // 股號驗證
  if (!formData.value.stockCode) {
    errors.value.stockCode = '請輸入股號'
  } else if (!validateStockCode(formData.value.stockCode)) {
    errors.value.stockCode = '股號只能輸入數字'
  }

  // 股名驗證
  if (!formData.value.stockName) {
    errors.value.stockName = '請輸入股名'
  }

  // 開會日期驗證
  if (!formData.value.meetingDate) {
    errors.value.meetingDate = '請選擇開會日期'
  }

  // 紀念品狀態驗證
  if (!formData.value.giftStatus && formData.value.giftStatus !== 0) {
    errors.value.giftStatus = '請選擇紀念品狀態'
  }

  // 股價驗證
  if (!formData.value.stockPrice) {
    errors.value.stockPrice = '請輸入股價'
  } else if (!validateStockPrice(formData.value.stockPrice)) {
    errors.value.stockPrice = '請輸入正確的股價格式'
  }

  // 漲跌驗證
  if (!formData.value.priceChange) {
  errors.value.priceChange = '請輸入漲跌'
} else if (!validatePriceChange(formData.value.priceChange)) {
  errors.value.priceChange = '請輸入正確的漲跌格式 (例：-1.1 或 1.5)'
}

  // 電話號碼驗證（非必填）
  if (formData.value.phone && !validatePhone(formData.value.phone)) {
    errors.value.phone = '請輸入正確的手機號碼格式'
  }

  // 在表單中顯示必填標記
  const requiredFields = {
    stockCode: '股號',
    stockName: '股名',
    meetingDate: '開會日期',
    giftStatus: '紀念品狀態',
    stockPrice: '股價',
    priceChange: '漲跌'
  }

  // 檢查所有必填欄位
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (field === 'giftStatus') {
      if (!formData.value[field] && formData.value[field] !== 0) {
        errors.value[field] = `請選擇${label}`
      }
    } else {
      if (!formData.value[field]) {
        errors.value[field] = `請輸入${label}`
      }
    }
  })

  return Object.keys(errors.value).length === 0
}

const addInput = (submissionIndex) => {
  submissions.value[submissionIndex].inputs.push('')
}

const removeInput = (submissionIndex, inputIndex) => {
  submissions.value[submissionIndex].inputs.splice(inputIndex, 1)
}

const fetchOptions = async () => {
  try {
    const response = await fetch('/index.php/api/options', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const result = await response.json()
    
    if (result.status) {
      documents.value = result.data.documents
      giftStatus.value = result.data.giftStatus
    }
  } catch (error) {
    console.error('獲取選項失敗:', error)
  }
}

// 添加新組合
const addSubmission = () => {
  submissions.value.push({
    id: Date.now(),
    name: `組合${submissions.value.length + 1}`,
    items: [],
    selectedDocuments: [] // 新增這行
  })
}

// 刪除組合
const removeSubmission = (index) => {
  submissions.value.splice(index, 1)
}

const isComboSelectOpen = ref(false)

const handleComboSelectClick = () => {
  isComboSelectOpen.value = !isComboSelectOpen.value
}

const handleComboSelectBlur = () => {
  isComboSelectOpen.value = false
}

const isSubmitting = ref(false)

const handleSubmit = async () => {
  try {
    console.log('開始提交表單')
    console.log('原始資料:', formData.value)
    console.log('組合資料:', submissions.value)
    isSubmitting.value = true
    
    if (!validateForm()) {
      console.log('表單驗證失敗:', errors.value)
      return
    }
    
    // 檢查資料
    console.log('提交的資料:', {
      stockCode: formData.value.stockCode,
      stockName: formData.value.stockName,
      meetingType: formData.value.meetingType,
      meetingDate: formData.value.meetingDate || null,
      stockPrice: formData.value.stockPrice,
      priceChange: formData.value.priceChange,
      lastBuyDate: formData.value.lastBuyDate,
      deadlineDate: formData.value.deadlineDate,
      marketType: formData.value.marketType || null,
      giftStatus: formData.value.giftStatus === '' || formData.value.giftStatus === undefined 
    ? null 
    : parseInt(formData.value.giftStatus),
      serviceAgent: formData.value.serviceAgent,
      phone: formData.value.phone,
      votingDateStart: formData.value.votingDateStart,
      votingDateEnd: formData.value.votingDateEnd,
      combinations: submissions.value
    })

    const submitData = {
      stockCode: formData.value.stockCode.toString(),
      stockName: formData.value.stockName,
      meetingType: formData.value.meetingType || null, // 修正：要加入開會性質
      meetingDate: formData.value.meetingDate,
      stockPrice: parseFloat(formData.value.stockPrice) || null, // 修正：轉為數字
      priceChange: parseFloat(formData.value.priceChange) || null, // 修正：轉為數字
      lastBuyDate: formData.value.lastBuyDate,
      deadlineDate: formData.value.deadlineDate,
      marketType: formData.value.marketType ? parseInt(formData.value.marketType) : null, // 修正：轉為數字
      serviceAgent: formData.value.serviceAgent,
      phone: formData.value.phone,
      votingDateStart: formData.value.votingDateStart,
      votingDateEnd: formData.value.votingDateEnd,
      giftStatus: formData.value.giftStatus === '' || formData.value.giftStatus === undefined 
    ? null 
    : parseInt(formData.value.giftStatus), // 修正：轉為數字
      combinations: submissions.value.map((sub, index) => ({
        sequence: index + 1,
        documentIds: sub.selectedDocuments || []
      }))
    }

    console.log('送出的資料:', JSON.stringify(submitData, null, 2))

    const response = await fetch('/index.php/api/admin/stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(submitData)
    })

    const result = await response.json()
    console.log('API 完整回應:', result)

    if (!result.status) {
      throw new Error(result.message || '新增失敗')
    }

    alert('新增成功')
    router.push('/backsite/shareholders')

  } catch (error) {
    console.error('提交失敗:', error)
    alert(error.message || '系統錯誤，請稍後再試')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchOptions()
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
          
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">新增股東會資訊</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 股號 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">股號 <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                v-model="formData.stockCode"
                placeholder="請輸入股號"
                @input="formData.stockCode = formData.stockCode.replace(/[^\d]/g, '')"
                :class="{'border-red-500': errors.stockCode}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.stockCode" class="text-red-500 text-xs mt-1">
                {{ errors.stockCode }}
              </p>
            </div>

            <!-- 股名 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">股名 <span class="text-red-500">*</span></label>
              <input 
                type="text" 
                v-model="formData.stockName"
                 placeholder="請輸入股名"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- 開會性質 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">開會性質</label>
              <div class="relative">
                <select 
                  v-model="formData.meetingType"
                  @click="handleSelectClick"
                  @blur="handleSelectBlur"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">請選擇開會性質</option>
                  <option 
                    v-for="type in meetingTypes" 
                    :key="type.value" 
                    :value="type.value"
                  >
                    {{ type.label }}
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg 
                    class="fill-current h-4 w-4 transition-transform duration-200"
                    :class="{ 'rotate-180': !isSelectOpen }"
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 開會日期 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                開會日期 <span class="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                v-model="formData.meetingDate"
                :class="{'border-red-500': errors.meetingDate}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.meetingDate" class="text-red-500 text-xs mt-1">
                {{ errors.meetingDate }}
              </p>
            </div>

            <!-- 最後買進日 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">最後買進日 </label>
              <input 
                type="date" 
                v-model="formData.lastBuyDate"
                :class="{'border-red-500': errors.lastBuyDate}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.lastBuyDate" class="text-red-500 text-xs mt-1">
                {{ errors.lastBuyDate }}
              </p>
            </div>

              <!-- 代領截止日 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">代領截止日</label>
                <input 
                  type="date" 
                  v-model="formData.deadlineDate"
                  :class="{'border-red-500': errors.deadlineDate}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p v-if="errors.deadlineDate" class="text-red-500 text-xs mt-1">
                  {{ errors.deadlineDate }}
                </p>
              </div>

              <!-- 電投起迄 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">電投期間 </label>
                <div class="flex items-center space-x-2">
                  <input 
                    type="date" 
                    v-model="formData.votingDateStart"
                    :class="{'border-red-500': errors.votingDateStart}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <span>~</span>
                  <input 
                    type="date" 
                    v-model="formData.votingDateEnd"
                    :class="{'border-red-500': errors.votingDateEnd}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
                <p v-if="errors.votingDateStart || errors.votingDateEnd" class="text-red-500 text-xs mt-1">
                  {{ errors.votingDateStart || errors.votingDateEnd }}
                </p>
              </div>

            <!-- 市場別 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">市場別</label>
              <div class="relative">
                <select 
                  v-model="formData.marketType"
                  @click="handleMarketSelectClick"
                  @blur="handleMarketSelectBlur"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">請選擇市場別</option>
                  <option 
                    v-for="type in marketTypes" 
                    :key="type.value" 
                    :value="type.value"
                  >
                    {{ type.label }}
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg 
                    class="fill-current h-4 w-4 transition-transform duration-200"
                    :class="{ 'rotate-180': !isMarketSelectOpen }"
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                紀念品狀態 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <select 
                  v-model="formData.giftStatus"
                  :class="{'border-red-500': errors.giftStatus}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">請選擇紀念品狀態</option>
                  <option 
                    v-for="status in giftStatus" 
                    :key="status.value" 
                    :value="status.value"
                  >
                    {{ status.label }}
                  </option>
                </select>
                <p v-if="errors.giftStatus" class="text-red-500 text-xs mt-1">
                  {{ errors.giftStatus }}
                </p>
              </div>
            </div>

            <!-- 服務代理 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">服務代理</label>
              <input 
                type="text" 
                v-model="formData.serviceAgent"
                 placeholder="請輸入服務代理"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- 電話 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">電話</label>
              <input 
                type="tel" 
                v-model="formData.phone"
                placeholder="請輸入手機 (例：0912345678)"
                :class="{'border-red-500': errors.phone}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.phone" class="text-red-500 text-xs mt-1">
                {{ errors.phone }}
              </p>
            </div>

            <!-- 股價 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">股價 <span class="text-red-500">*</span></label>
              <input 
                type="text"
                v-model="formData.stockPrice"
                placeholder="請輸入股價"
                @input="formData.stockPrice = formData.stockPrice.replace(/[^\d.]/g, '')"
                :class="{'border-red-500': errors.stockPrice}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.stockPrice" class="text-red-500 text-xs mt-1">
                {{ errors.stockPrice }}
              </p>
            </div>

            <!-- 漲跌 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">漲跌 <span class="text-red-500">*</span></label>
              <input 
                type="text"
                v-model="formData.priceChange"
                placeholder="請輸入漲跌 (例：-1.5 或 1.5)"
                @input="handlePriceChangeInput"
                :class="{'border-red-500': errors.priceChange}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.priceChange" class="text-red-500 text-xs mt-1">
                {{ errors.priceChange }}
              </p>
            </div>

          <!-- 組合列表 -->
          <div class="col-span-full mt-8">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-800">繳交</h3>
              <button 
                @click="addSubmission"
                class="px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200"
              >
                新增組合
              </button>
            </div>

            <!-- 動態組合列表 -->
            <div v-for="(submission, index) in submissions" :key="submission.id" class="mb-4">
                <div class="relative p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <!-- 取消按鈕 -->
                  <button 
                    v-if="submissions.length > 1"
                    @click="removeSubmission(index)" 
                    class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    title="刪除此組合"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <p class="text-sm font-medium text-gray-600">組合 {{ index + 1 }}</p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label 
                        v-for="doc in documents" 
                        :key="doc.value"
                        class="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          v-model="submission.selectedDocuments"
                          :value="doc.value"
                          class="form-checkbox h-5 w-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                        >
                        <span class="ml-3 text-gray-700">{{ doc.label }}</span>
                      </label>
                    </div>
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
/* 檢查這裡的 CSS 是否有語法錯誤 */
</style>