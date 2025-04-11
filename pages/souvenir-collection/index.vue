<!-- pages/souvenir-collection/index.vue -->
<script setup>
import { useAuthStore } from '~/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import ScrollToTop from '~/components/common/ScrollToTop.vue'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
  title: '逐件委託代領'
})

const config = {
  headers: {
    'Authorization': `Bearer ${authStore.token}`,
    'Content-Type': 'application/json'
  }
}

const orders = ref([]) // 訂單列表
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const isLoading = ref(false)
const error = ref(null)
const keyword = ref('')

// 年分下拉選單的選項
const currentYear = new Date().getFullYear();
const years = ref(Array.from({length: 8}, (_, i) => (currentYear - i).toString()));
const selectedYear = ref(currentYear.toString());

const showYearDropdown = ref(false);
// 加入控制狀態下拉選單的ref
const showStatusDropdown = ref(false);
// 添加控制繳交項目下拉選單的ref
const showSubmitDropdown = ref(false);
// 添加控制下委託代領拉選單的 ref
const showDateDropdown = ref(false);
// 添加控制更多條件下拉的 ref
const showMoreConditions = ref(false)

const toggleDropdown = (dropdownName) => {
  // 下拉選單的狀態對象
  const dropdowns = {
    year: showYearDropdown,
    status: showStatusDropdown,
    submit: showSubmitDropdown,
    date: showDateDropdown,
    more: showMoreConditions
  }

  // 關閉所有其他下拉選單
  Object.entries(dropdowns).forEach(([name, ref]) => {
    if (name !== dropdownName) {
      ref.value = false
    }
  })

  // 切換當前點擊的下拉選單
  dropdowns[dropdownName].value = !dropdowns[dropdownName].value
}

// 控制如何新增委託彈跳視窗
const showHowToAddModal = ref(false)
const activeSection = ref(null)
const selectedSubmitItems = ref([])
const selectedStatus = ref([])
const selectedConditions = ref([])
const showOrderDetailModal = ref(false)
const showCostDetailModal = ref(false)
const orderDetailMemo = ref('')

// 日期選擇相關
const startDate = ref('');
const endDate = ref('');
const selectedRange = ref('unlimited')

const dateOptions = {
  'unlimited': '不限',
  'today': '今日',
  '1week': '近一週內',
  '2weeks': '近二週內',
  '1month': '近一個月內',
  '3months': '近三個月內'
}

// 新增處理狀態選擇的函數
const handleStatusSelect = (status) => {
  selectedStatus.value = status
  showStatusDropdown.value = false
  fetchOrders() // 觸發搜尋
}

// 新增多選處理函數
const toggleStatus = (status) => {
  const index = selectedStatus.value.findIndex(s => s.value === status.value)
  if (index === -1) {
    selectedStatus.value.push(status)
  } else {
    selectedStatus.value.splice(index, 1)
  }
  fetchOrders()
}

const toggleSubmitItem = (item) => {
  const index = selectedSubmitItems.value.findIndex(i => i.value === item.value)
  if (index === -1) {
    selectedSubmitItems.value.push(item)
  } else {
    selectedSubmitItems.value.splice(index, 1) 
  }
  fetchOrders()
}

// 修改處理繳交項目選擇的函數
const handleSubmitItemSelect = (item) => {
  selectedSubmitItem.value = item
  showSubmitDropdown.value = false
  fetchOrders() // 直接觸發搜尋
}

const conditions = ref({
  moreCondition: {
    meetingType: [],
    marketType: []
  },
  orderStatus: [],
  documents: []
})

// 獲取條件的函數
const fetchConditions = async () => {
  try {
    const response = await fetch('/index.php/api/client/orders/conditions', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('獲取條件回應:', result) // 檢查 API 回應
    
    if (result.status) {
      conditions.value = result.data
      console.log('更新後的條件:', conditions.value) // 檢查條件更新
    } else {
      throw new Error(result.message || '獲取條件失敗')
    }
  } catch (error) {
    console.error('獲取條件失敗:', error)
    alert('獲取條件失敗：' + error.message)
  }
}

// 設定日期區間的方法
const setDateRange = (range) => {
  selectedRange.value = range;
  const today = new Date();
  
  switch(range) {
    case 'unlimited':
      startDate.value = '';
      endDate.value = '';
      break;
    case 'today':
      startDate.value = formatDate(today);
      endDate.value = formatDate(today);
      break;
    case '1week':
      endDate.value = formatDate(today);
      startDate.value = formatDate(new Date(today.setDate(today.getDate() - 7)));
      break;
    case '2weeks':
      endDate.value = formatDate(today);
      startDate.value = formatDate(new Date(today.setDate(today.getDate() - 14)));
      break;
    case '1month':
      endDate.value = formatDate(today);
      startDate.value = formatDate(new Date(today.setMonth(today.getMonth() - 1)));
      break;
    case '3months':
      endDate.value = formatDate(today);
      startDate.value = formatDate(new Date(today.setMonth(today.getMonth() - 3)));
      break;
  }
};

// 格式化日期的輔助函數
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const toggleCondition = (type, label, value) => {
  const condition = {
    label: label,
    value: value
  }
  
  const index = selectedConditions.value.findIndex(c => c.label === label)
  if (index === -1) {
    selectedConditions.value.push(condition)
  } else {
    selectedConditions.value.splice(index, 1)
  }
}

const isOpen = ref(false);

// 控制圖片上傳彈跳視窗的狀態
const showUploadModal = ref(false);
const uploadFile = ref(null);

const isEditing = ref(false)
const editingMemo = ref('')
const currentOrderId = ref(null)

// 處理檔案上傳
const handleFileUpload = (event) => {
  uploadFile.value = event.target.files[0];
};

const handleDragOver = (e) => {
  e.preventDefault();
}

const handleDrop = (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    uploadFile.value = files[0];
    // 可以直接觸發上傳或是等待使用者點擊確定送出
  }
}

// 提交上傳
const submitUpload = () => {
  if (!uploadFile.value) {
    alert('請選擇要上傳的檔案');
    return;
  }
  
  // TODO: 這裡實作檔案上傳到伺服器的邏輯
  console.log('上傳檔案:', uploadFile.value);
  
  // 上傳完成後關閉視窗
  showUploadModal.value = false;
  uploadFile.value = null;
};

// 控制詳細資訊彈跳視窗的狀態
const showDetailModal = ref(false);

// 處理點擊詳細按鈕
const handleDetailClick = (e) => {
  e.preventDefault();
  showCostDetailModal.value = true 
};

// 修改原本的點擊事件
const handleUploadClick = (e) => {
  e.preventDefault();
  showUploadModal.value = true;
  isOpen.value = false;
};

// 控制搜尋結果的顯示
onMounted(() => {
  document.addEventListener('click', (e) => {
    // 檢查點擊是否在下拉選單容器外
    const isClickOutside = !e.target.closest('.relative') && !e.target.closest('.date-dropdown')
    
    if (isClickOutside) {
      // 關閉所有下拉選單
      showYearDropdown.value = false
      showStatusDropdown.value = false
      showSubmitDropdown.value = false
      showDateDropdown.value = false
      showMoreConditions.value = false
    }
  })
})

const fetchOrders = async () => {
  try {
    // 檢查 token 是否存在
      if (!authStore.token) {
      router.push('/login')
      throw new Error('請先登入')
    }

    isLoading.value = true
    error.value = null

    // 1. 基礎參數
    const baseParams = {
      page: currentPage.value || 1, 
      year: selectedYear.value,
      keyword: keyword.value?.trim()
    }

    // 2. 日期參數
    const dateParams = {
      deadlineStart: startDate.value,
      deadlineEnd: endDate.value
    }

    // 3. 選擇條件參數
    const conditionParams = {
      status: selectedStatus.value.map(s => s.value).join(',') || undefined,
      documentIds: selectedSubmitItems.value.map(i => i.value).join(',') || undefined,
      meetingType: selectedConditions.value.find(c => ['臨時', '常會'].includes(c)) ? 
        meetingTypeMapping[selectedConditions.value.find(c => ['臨時', '常會'].includes(c))] : undefined,
      marketType: selectedConditions.value.find(c => ['上市', '上櫃', '興櫃', '公開發行'].includes(c)) ? 
        marketTypeMapping[selectedConditions.value.find(c => ['上市', '上櫃', '興櫃', '公開發行'].includes(c))] : undefined
    }

    // 4. 合併並過濾參數
    const params = Object.entries({
      ...baseParams,
      ...dateParams, 
      ...conditionParams
    }).reduce((acc, [key, value]) => {
      if (value != null && value !== '' && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {})

    // 5. 更新路由
    router.push({
      query: params
    })

    // 6. 構建查詢字串並發送請求
    const queryString = new URLSearchParams(params).toString()
    console.log('Search Params:', params) // 檢查搜尋參數

    const response = await fetch(`/index.php/api/client/orders?${queryString}`, {
      headers: config.headers
    })

     // 檢查是否為驗證錯誤
      if (response.status === 401) {
      router.push('/login')
      throw new Error('登入已過期，請重新登入')
    }

    const data = await response.json()
    console.log('逐件委託代領:', data) // 檢查 API 回應

    if (data.status) {
      orders.value = data.data.items // 修正: 使用 data.data.items
      total.value = data.data.total 
      currentPage.value = parseInt(data.data.page) || 1
      totalPages.value = parseInt(data.data.totalPages) || 1
    } else {
      throw new Error(data.message)
    }

  } catch (err) {
    error.value = err.message || '獲取資料失敗'
    console.error('Error:', err) // 檢查錯誤
       // 處理未登入錯誤
      if (err.message === '請先登入' || err.message === '登入已過期，請重新登入') {
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

const getOrderDetail = async (id) => {
  try {
    if (!id) {
      throw new Error('無效的訂單編號')
    }

    // 儲存當前訂單 ID 並開啟詳細視窗
    currentOrderId.value = id
    showOrderDetailModal.value = true
    
    console.log('取得詳細資料，ID:', id)

    const response = await fetch(`/index.php/api/client/orders/detail?id=${id}`, {
      headers: config.headers
    })
    
    if (!response.ok) {
      throw new Error(`請求失敗: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('詳細資料回應:', result)
    
    if (result.status) {
      // 這裡處理 API 回傳的詳細資料
      // TODO: 更新表格中的費用資料
      orderDetailMemo.value = result.data.memo || '無備註'
    } else {
      throw new Error(result.message || '獲取詳細資料失敗')
    }
  } catch (error) {
    console.error('獲取詳細資料失敗:', error)
    alert('獲取詳細資料失敗：' + error.message)
    showDetailModal.value = false // 發生錯誤時關閉視窗
  }
}


const handleSearch = () => {
  router.push({
    query: {
      page: currentPage.value.toString(),
      year: selectedYear.value || undefined,
      status: selectedStatus.value.map(s => s.value).join(',') || undefined,
      documentIds: selectedSubmitItems.value.map(i => i.value).join(',') || undefined,
      deadlineStart: startDate.value || undefined,
      deadlineEnd: endDate.value || undefined,
      meetingType: selectedConditions.value.find(c => c.type === 'meeting')?.value?.toString(),
      marketType: selectedConditions.value.find(c => c.type === 'market')?.value?.toString(),
      keyword: keyword.value || undefined
    }
  })
}

// 清除條件
const clearFilters = () => {
  keyword.value = ''
  selectedYear.value = new Date().getFullYear().toString()
  selectedStatus.value = [] // 改為空陣列
  selectedSubmitItems.value = [] // 改為空陣列
  startDate.value = ''
  endDate.value = ''
  selectedRange.value = 'unlimited'
  selectedConditions.value = []
  currentPage.value = 1
  fetchOrders()
}

// 換頁處理
const handlePageChange = async (page) => {
  try {
    currentPage.value = page
    const params = new URLSearchParams(route.query)
    params.set('page', page.toString())
    
    // 更新 URL，但不重新加載頁面
    router.push({
      query: {
        ...route.query,
        page: page.toString()
      }
    })

    // 重新獲取數據
    await fetchOrders()
    
  } catch (error) {
    console.error('切換頁面失敗:', error)
  }
}

watch([
  selectedYear,
  selectedStatus,
  selectedSubmitItems,
  startDate,
  endDate,
  selectedConditions
], () => {
  currentPage.value = 1
  fetchOrders()
})

watch(
  () => route.query,
  () => {
    fetchOrders()
  }
)

const handleDelete = async (orderId) => {
  if (!orderId) {
    console.error('無效的訂單編號')
    return
  }

  if (confirm('確定要刪除此筆記錄嗎？')) {
    try {
      console.log('要刪除的訂單編號:', orderId)
      console.log('API URL:', `/index.php/api/client/orders/${orderId}`)

      const response = await fetch(`/index.php/api/client/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.status === true && result.message === 'Success') {
        alert('刪除成功')
        await fetchOrders() // 重新載入列表
      } else {
        throw new Error(result.message || '刪除失敗')
      }

    } catch (error) {
      console.error('刪除失敗:', error)
      alert(error.message || '刪除失敗') 
    }
  }
}

// 新增編輯備註的函數
const handleEditMemo = () => {
  editingMemo.value = orderDetailMemo.value
  isEditing.value = true
}

// 新增儲存備註的函數
const saveMemo = async () => {
  try {
    const response = await fetch(`/index.php/api/client/orders/${currentOrderId.value}`, {
      method: 'PUT',
      headers: {
        ...config.headers
      },
      body: JSON.stringify({
        memo: editingMemo.value
      })
    })

    const result = await response.json()
    
    if (result.status) {
      orderDetailMemo.value = editingMemo.value
      isEditing.value = false
      alert('備註更新成功')
      
      // 關閉詳細資料視窗
      showOrderDetailModal.value = false
      
      // 重新獲取資料列表
      await fetchOrders()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('更新備註失敗:', error)
    alert('更新備註失敗：' + error.message)
  }
}

onMounted(async () => {
  try {
    if (!authStore.token) {
      alert('請先登入')
      router.push('/auth/login')
      return
    }

    // 先獲取條件資料
    await fetchConditions()

    const { 
      page,
      year,
      status,
      documentIds,
      deadlineStart,
      deadlineEnd,
      meetingType,
      marketType,
      keyword: searchKeyword
    } = route.query

    // 設定初始值
    currentPage.value = parseInt(page) || 1
    selectedYear.value = year || new Date().getFullYear().toString()
    
    // 處理狀態選擇
    if (status) {
      const statusOption = conditions.value.orderStatus.find(
        s => s.value.toString() === status
      )
      if (statusOption) {
        selectedStatus.value = statusOption
      }
    }

    // 處理繳交項目選擇
    if (documentIds) {
      const documentIds = documentIds.split(',')
      selectedSubmitItems.value = conditions.value.documents.filter(
        d => documentIds.includes(d.value.toString())
      )
    }

    // 處理日期區間
    startDate.value = deadlineStart || ''
    endDate.value = deadlineEnd || ''
    keyword.value = searchKeyword || ''
    
    // 清空已選條件
    selectedConditions.value = []
    
    // 處理開會性質
    if (meetingType) {
      const meetingOption = conditions.value.moreCondition.meetingType.find(
        m => m.value.toString() === meetingType
      )
      if (meetingOption) {
        selectedConditions.value.push({
          type: 'meeting',
          label: meetingOption.label,
          value: meetingOption.value
        })
      }
    }

    // 處理市場類別
    if (marketType) {
      const marketOption = conditions.value.moreCondition.marketType.find(
        m => m.value.toString() === marketType
      )
      if (marketOption) {
        selectedConditions.value.push({
          type: 'market',
          label: marketOption.label,
          value: marketOption.value
        })
      }
    }
    
    // 最後執行搜尋
    await fetchOrders()

  } catch (error) {
    console.error('初始化失敗:', error)
    if (error.message === '請先登入' || error.message === '登入已過期，請重新登入') {
      router.push('/auth/login')
    }
  }
})
</script>

<template>
 <div>
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-8 px-4">
      <ScrollToTop />
    </div>
    <!-- todo 股東會資訊內容 -->
    <div class="container mx-auto py-8">
      <div class="w-full lg:w-[1760px] lg:-ml-[160px] px-4 lg:px-0">
        <div class="flex flex-col sm:flex-row justify-between items-center px-2 sm:px-6 mb-4 gap-4 sm:gap-0">
          <h1 class="text-xl sm:text-2xl font-bold">逐件委託代領</h1>
          <!-- 使用 v-dialog 包裝按鈕和彈窗 -->
          <v-dialog max-width="800" min-height="700">
            <template v-slot:activator="{ props }">
              <button 
                v-bind="props"
                class="text-teal-600 hover:text-teal-500 transition-colors inline-flex items-center"
              >
                如何新增委託
                <svg 
                  class="w-5 h-5 ml-1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.471-1.794l-1.962-.393A3.5 3.5 0 1 1 13 13.355z"/>
                </svg>
              </button>
            </template>

        <!-- todo 新增委託說明彈跳視窗 -->
        <template v-slot:default="{ isActive }">
              <v-card>
                <!-- 標題列 -->
                <v-card-title class="d-flex justify-space-between align-center">
                  <span class="text-lg font-bold">如何新增委託？</span>
                  <v-btn icon @click="isActive.value = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-card-title>

                    <!-- 主要內容區 -->
                    <v-card-text class="pa-6">
                      <!-- 方式 1-4 的容器 -->
                      <div class="space-y-4">
                        <!-- 方式 1 -->
                        <div class="border rounded-lg">
                          <button 
                                class="w-full flex justify-between items-start p-4 text-left"
                                @click="activeSection = activeSection === 1 ? null : 1"
                            >
                                <h2 class="text-teal-600 font-medium text-sm sm:text-base pr-8">
                                  方式 1：代領據點將每日協助您完成電子投票。
                                </h2>
                                <svg 
                                    class="w-5 h-5 flex-shrink-0 transform transition-transform duration-200 mt-1"
                                    :class="{ 'rotate-180': activeSection === 1 }"
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                >
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                          <!-- 方式 1 內容 -->
                          <div v-if="activeSection === 1" 
                                class="px-4 pb-4 text-sm sm:text-base">
                                <p class="text-gray-600 mb-4">
                                  
                                </p>
                                <p class="text-gray-600 mb-2">在使用此服務之前，請您同意以下條件：</p>
                                <ul class="list-disc pl-5 space-y-2 text-gray-600">
                                    <li class="text-sm sm:text-base">同意將「勞商憑證」或「自然人憑證」暫時存放於代領據點的電腦中。</li>
                                    <li class="text-sm sm:text-base">允許代領據點協助您完成電子投票。</li>
                                    <li class="text-sm sm:text-base">確認您的憑證密碼將保密，並不會透露給任何人。</li>
                                </ul>

                                <!-- 警告區塊 -->
                                <!--<div class="bg-amber-50 border-l-4 border-amber-400 p-4 mt-4">
                                    <div class="flex items-start">
                                        <div class="flex-shrink-0">
                                            <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <p class="ml-3 text-amber-700 text-sm sm:text-base">
                                            以上條件都不會導致您的下單權益受損，代領據點亦無從得知您的憑證密碼。如有任何疑慮，請改選擇以下其他委託方式。
                                        </p>
                                    </div>
                                </div>-->
                            </div>

                        <!-- 方式 2 -->
                          <div class="border rounded-lg">
                            <button 
                              class="w-full flex justify-between items-start p-4 sm:p-6 text-left"
                              @click="activeSection = activeSection === 2 ? null : 2"
                            >
                              <h2 class="text-teal-600 font-medium text-sm sm:text-base pr-8">
                                方式 2：您可以自行操作軟體「E股投」，將目前代領據點可處理的案件匯入系統。
                              </h2>
                              <svg 
                                class="w-5 h-5 flex-shrink-0 transform transition-transform duration-200 mt-1"
                                :class="{ 'rotate-180': activeSection === 2 }"
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                              </svg>
                            </button>
                            <div v-if="activeSection === 2" class="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                              <p class="text-gray-600 text-sm sm:text-base">
                                我們建議您每天或每週自行操作一次「E股投」。
                              </p>
                              <p class="text-gray-600 text-sm sm:text-base">
                                請注意，案件資料會從軟體匯入至本站，但您仍需登入本站選擇要委託代領的具體案件。僅有案件資料被匯入，代領據點無法知道您希望委託哪一項案件，必須由您明確選擇。
                              </p>
                            </div>
                          </div>

                          <!-- 方式 3 -->
                          <div class="border rounded-lg">
                            <button 
                              class="w-full flex justify-between items-start p-4 sm:p-6 text-left"
                              @click="activeSection = activeSection === 3 ? null : 3"
                            >
                              <h2 class="text-teal-600 font-medium text-sm sm:text-base pr-8">
                                方式 3：自行完成電子投票後，上傳表決結果的圖檔。
                              </h2>
                              <svg 
                                class="w-5 h-5 flex-shrink-0 transform transition-transform duration-200 mt-1"
                                :class="{ 'rotate-180': activeSection === 3 }"
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                              </svg>
                            </button>
                            <div v-if="activeSection === 3" class="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                              <p class="text-gray-600 text-sm sm:text-base">
                                您可以自行至臺灣集中保管結算所的股東會電子投票平台進行投票，並將表決結果的截圖上傳。請確保圖片中包含以下資訊：股名、股號、戶名、戶號、條碼及投票時間。上傳後，系統將進行資料建檔。
                              </p>
                              <div>
                                <p class="text-gray-600 text-sm sm:text-base mb-2">請注意，以下情況可能導致上傳失敗：</p>
                                <ul class="list-decimal pl-5 space-y-2">
                                  <li class="text-gray-600 text-sm sm:text-base">代領據點已截止委託。</li>
                                  <li class="text-gray-600 text-sm sm:text-base">影像圖檔解析度過低，無法辨識。</li>
                                  <li class="text-gray-600 text-sm sm:text-base">影像圖檔未包含股名、股號、戶名、戶號、條碼或投票時間。</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <!-- 方式 4 -->
                          <!--<div class="border rounded-lg">
                            <button 
                              class="w-full flex justify-between items-start p-4 sm:p-6 text-left"
                              @click="activeSection = activeSection === 4 ? null : 4"
                            >
                              <h2 class="text-teal-600 font-medium text-sm sm:text-base pr-8">
                                方式 4.手動輸入委託案件（不建議使用）
                              </h2>
                              <svg 
                                class="w-5 h-5 flex-shrink-0 transform transition-transform duration-200 mt-1"
                                :class="{ 'rotate-180': activeSection === 4 }"
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                              </svg>
                            </button>
                            <div v-if="activeSection === 4" class="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                              <p class="text-gray-600 text-sm sm:text-base">
                                我無法使用軟體「懶股投」、也不會上傳截圖，我可以手動輸入案件嗎？
                              </p>
                              <p class="text-gray-600 text-sm sm:text-base">
                                答案：純手動輸入無法驗證是否已完成電子投票，只有極少部分的場次開放手動輸入委託。
                              </p>
                              <p class="text-gray-600 text-sm sm:text-base">
                                目前沒有開放任何可以手動輸入委託的場次。
                              </p>
                            </div>
                          </div>-->
                        </div>
                      </div>
                    </v-card-text>
                </v-card>
            </template>
          </v-dialog>
        </div>

          <!-- todo 逐件委託代領區域-->
          <div class="border border-[#0F93A2] rounded-xl bg-[#8ADCE7] p-4 lg:p-6">
            <!-- todo  下拉選單區域 -->
            <div class="flex flex-col lg:flex-row gap-4 lg:gap-2">
              <!--todo  年份選擇 -->
              <div class="relative w-full lg:w-[111px]">
                <button 
                  @click.stop="toggleDropdown('year')"
                  class="w-full h-12 text-sm border border-[#0F93A2] rounded-[12px] px-3 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
                  <span>{{ selectedYear }}</span>
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="showYearDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
                  </svg>
                </button>

                <!-- 下拉內容 -->
                <div v-if="showYearDropdown" 
                    class="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-50 border border-gray-200 py-2"
                  >
                  <button
                    v-for="year in years"
                    :key="year"
                    @click="selectedYear = year; showYearDropdown = false"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100"
                    :class="{'bg-teal-100': selectedYear === year}"
                  >
                    {{ year }}
                  </button>
                </div>
              </div>

              <!-- todo 選擇狀態 -->
              <div class="relative w-full lg:w-[360px]">
                <button 
                  @click.stop="toggleDropdown('status')"
                  class="w-full h-12 text-sm border border-[#0F93A2] rounded-[12px] px-3 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
                  <span class="truncate">
                    {{ selectedStatus.length ? selectedStatus.map(s => s.label).join(', ') : '選擇狀態' }}
                  </span>
                  <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="showStatusDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
                  </svg>
                </button>

                <!-- todo 選擇狀態下拉內容 -->
                <div v-if="showStatusDropdown" 
                    class="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                    <div class="space-y-4">
                    <!-- 委託狀態 -->
                    <div>
                      <h3 class="text-blue-600 font-bold text-sm sm:text-base mb-2 sm:mb-3">委託狀態</h3>
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="status in conditions.orderStatus" 
                          :key="status.value"
                          @click="toggleStatus(status)"
                          :class="[
                            'border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors',
                            'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                            selectedStatus.some(s => s.value === status.value)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-300 text-gray-700',
                            'whitespace-nowrap min-w-[80px] sm:min-w-[100px]'
                          ]"
                        >
                          {{ status.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- todo 繳交項目選擇 -->
              <div class="relative w-full lg:w-[360px]">
                <button 
                  @click.stop="toggleDropdown('submit')"
                  class="w-full h-12 text-sm border border-[#0F93A2] rounded-[12px] px-3 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
                  <span class="truncate">
                    {{ selectedSubmitItems.length ? selectedSubmitItems.map(i => i.label).join(', ') : '選擇繳交項目' }}
                  </span>
                  <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="showSubmitDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
                  </svg>
                </button>

                <!-- 下拉內容 -->
                <div v-if="showSubmitDropdown" 
                  class="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                  <h3 class="text-blue-600 font-bold text-sm sm:text-base mb-2 sm:mb-3">請選擇繳交項目</h3>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="item in conditions.documents"
                      :key="item.value"
                      @click="toggleSubmitItem(item)"
                      :class="[
                        'border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors',
                        'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                        selectedSubmitItems.some(i => i.value === item.value)
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-gray-300 text-gray-700',
                        'whitespace-nowrap min-w-[80px] sm:min-w-[100px]'
                      ]"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                </div>
              </div>

               <!-- todo 選擇委託代領截止 -->
               <div class="relative w-full lg:w-[360px]">
                  <button 
                    @click.stop="toggleDropdown('date')"
                    class="w-full h-12 text-sm border border-[#0F93A2] rounded-[12px] px-3 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                  >
                    <span class="truncate">
                      {{ startDate && endDate ? `${startDate} ~ ${endDate}` : '請選擇委託代領截止區間' }}
                    </span>
                    <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="showDateDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
                    </svg>
                  </button>

                  <!-- 下拉內容 -->
                  <div v-if="showDateDropdown" 
                  class="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                    <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">
                        請填寫委託代領截止區間
                    </h3>
                      <!-- 日期區間輸入 -->
                      <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                        <!-- 開始日期 -->
                        <div class="flex-1">
                            <input
                                v-model="startDate"
                                type="date"
                                class="w-full h-10 sm:h-12 text-xs sm:text-sm border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                                placeholder="開始日期"
                            />
                        </div>

                        <!-- 分隔符 -->
                        <div class="hidden sm:flex items-center">
                            <span class="text-gray-500">~</span>
                        </div>

                        <!-- 結束日期 -->
                        <div class="flex-1">
                            <input
                                v-model="endDate"
                                type="date"
                                class="w-full h-10 sm:h-12 text-xs sm:text-sm border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                                placeholder="結束日期"
                            />
                        </div>
                    </div>

                    <!-- 快速選擇按鈕 -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                            v-for="(option, key) in dateOptions" 
                            :key="key"
                            @click="setDateRange(key)"
                            :class="[
                                'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                selectedRange === key 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            ]"
                        >
                            {{ option }}
                        </button>
                    </div>
                  </div>
                </div>
              
              <!-- todo 選擇更多條件-->
              <div class="relative w-full lg:w-[408px]">
                  <button 
                    @click.stop="toggleDropdown('more')"
                    class="w-full h-12 text-sm border border-[#0F93A2] rounded-[12px] px-3 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                  >
                    <span class="truncate">
                      {{ selectedConditions.length ? selectedConditions.map(c => c.label).join(', ') : '選擇更多條件' }}
                    </span>
                    <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="showMoreConditions ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
                    </svg>
                  </button>

                  <!-- 下拉內容 -->
                  <div v-if="showMoreConditions" 
                    class="absolute top-full left-0 mt-1 w-full sm:w-[408px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                    <!-- 開會性質 -->
                    <div class="mb-4">
                        <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">開會性質</h3>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                v-for="type in conditions.moreCondition.meetingType"
                                :key="type.value"
                                @click="toggleCondition('meeting', type.label, type.value)"
                                :class="[
                                    'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                    'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                    selectedConditions.some(c => c.label === type.label)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                ]"
                            >
                                {{ type.label }}
                            </button>
                        </div>
                    </div>

                    <div class="border-b border-gray-200 mb-4"></div>

                    <!-- 市場類別 -->
                    <div>
                        <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">市場類別</h3>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                v-for="type in conditions.moreCondition.marketType"
                                :key="type.value"
                                @click="toggleCondition('market', type.label, type.value)"
                                :class="[
                                    'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                    'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                    selectedConditions.some(c => c.label === type.label)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                ]"
                            >
                                {{ type.label }}
                            </button>
                        </div>
                    </div>
                  </div>
              </div>
            </div>

            <!-- todo 搜尋區域 -->
            <div class="mt-4 flex flex-col sm:flex-row gap-4">
              <input 
                v-model="keyword"
                class="flex-grow h-12 border border-[#0F93A2] rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="股號、股名、姓名、戶號" 
              />
              <div class="flex gap-4">
                <button 
                  @click="clearFilters"
                  class="w-full sm:w-32 h-12 bg-[#004850] text-white rounded-xl hover:bg-opacity-90"
                >
                  清除條件
                </button>
                <button 
                  @click="handleSearch"
                  class="w-full sm:w-32 h-12 bg-[#0F93A2] text-white rounded-xl flex items-center justify-center gap-1 hover:bg-opacity-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  搜尋
                </button>
              </div>
            </div>
          </div>
      </div>

<!-- todo 報表區域 -->
<div class="w-full lg:w-[1760px] lg:-ml-[160px] px-4 lg:px-0">
  <!-- 載入中和錯誤提示 -->
  <div v-if="isLoading" class="flex justify-center py-8">
    載入中...
  </div>
  
  <div v-else-if="error" class="text-red-500 text-center py-8">
    {{ error }}
  </div>

  <!-- 報表標題列 -->
  <div class="bg-white rounded-lg mt-4 border-b border-gray-200">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6">
      <!-- 按鈕群組 -->
      <div class="flex flex-wrap gap-3 w-full sm:w-auto">
        <!-- 新增委託按鈕 -->
        <div class="relative inline-block w-full sm:w-auto">
          <button 
            @click="isOpen = !isOpen"
            class="w-full sm:w-auto bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 flex items-center justify-center sm:justify-start gap-2"
          >
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>新增委託</span>
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- 下拉選單 -->
          <div v-if="isOpen" 
              class="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
            <div class="py-2">
              <a href="#" 
                @click="handleUploadClick"
                class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"/>
                </svg>
                上傳電投截圖或PDF
              </a>
            </div>
          </div>
        </div>


        <!-- todo 上傳檔案彈跳視窗 -->
        <div v-if="showUploadModal" 
            class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4 sm:px-6 py-6 flex items-center justify-center">
          <div class="relative w-full max-w-[95%] sm:max-w-[640px] lg:max-w-[960px] bg-white rounded-lg shadow-xl mx-auto">
            <!-- 標題區 -->
            <div class="flex justify-between items-center p-4 sm:p-6 border-b">
              <div class="flex-1">
                <h3 class="text-lg sm:text-xl font-medium text-center">上傳委託 新北黑喜服務站</h3>
              </div>
              <button @click="showUploadModal = false" 
                      class="text-gray-500 hover:text-gray-700 p-2">
                <svg class="w-5 h-5 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- 拖放上傳區域 -->
            <div class="p-4 sm:p-6">
              <div class="border-2 border-dashed border-gray-300 rounded-lg h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center"
                  @dragover="handleDragOver"
                  @drop="handleDrop">
                <p class="text-gray-600 text-base sm:text-lg mb-2 sm:mb-4 px-4 text-center">圖片拖移此處上傳</p>
                <p class="text-gray-500 mb-2 sm:mb-4">或</p>
                <label class="cursor-pointer inline-block">
                  <input type="file" 
                        @change="handleFileUpload"
                        accept=".pdf,image/*"
                        class="hidden"/>
                  <span class="px-4 sm:px-6 py-2 sm:py-3 bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors text-base sm:text-lg">
                    選擇檔案
                  </span>
                </label>
              </div>
            </div>

            <!-- 按鈕區 -->
            <div class="p-4 sm:p-6 border-t">
              <button @click="submitUpload"
                      class="w-full h-12 sm:h-14 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-base sm:text-lg font-medium">
                確定送出
              </button>
            </div>
          </div>
        </div>

        <!-- 詳細按鈕 -->
        <button 
          @click="handleDetailClick"
          class="w-full sm:w-auto bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>詳細</span>
        </button>

         <!-- 修改彈跳視窗內容區域 -->
         <div v-if="showCostDetailModal" 
            class="fixed inset-0 bg-grey bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto">
                <!-- 標題區 -->
                <div class="flex justify-between items-center mb-8">
                  <div class="flex-1">
                    <h3 class="text-xl font-medium text-center">詳細費用計算</h3>
                  </div>
                  <button @click="showCostDetailModal = false" 
                          class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <!-- 費用表格 -->
                <div class="mb-8">
                  <div class="grid grid-cols-2 gap-4">
                    <!-- 表格標題 -->
                    <div class="col-span-2 grid grid-cols-2 bg-gray-100 p-3 rounded-t-lg">
                      <div class="font-medium text-gray-700">項目</div>
                      <div class="font-medium text-gray-700 text-right">金額</div>
                    </div>
                    
                    <!-- 表格內容 -->
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">代領費</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">代領支付</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">委印費</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">委印支付</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">售出金額</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">售出撥款</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">購入金額</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <div class="col-span-2 grid grid-cols-2 border-b border-gray-200 py-3">
                      <div class="text-gray-600">購入支付</div>
                      <div class="text-right">$0</div>
                    </div>
                    
                    <!-- 總計列 -->
                    <div class="col-span-2 grid grid-cols-2 bg-gray-100 p-3 rounded-b-lg mt-2">
                      <div class="font-medium text-gray-900">總計</div>
                      <div class="font-medium text-gray-900 text-right">$0</div>
                    </div>
                  </div>
                </div>

                <!-- 底部關閉按鈕 -->
                <div class="flex justify-center">
                  <button
                    @click="showCostDetailModal = false"
                    class="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-[200px]"
                  >
                    關閉
                  </button>
                </div>
              </div>
          </div>

        <!-- 匯出按鈕 -->
        <button class="w-full sm:w-auto bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>匯出</span>
        </button>
      </div>
    </div>
  </div>

  <!-- 報表內容區 -->
  <div class="mt-4">
    <!-- 訂單列表 -->
    <div v-for="order in orders" :key="order.id" 
        class="bg-white rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <!-- 主要資訊區 -->
      <div class="flex flex-col lg:flex-row p-4 sm:p-6 border-b border-gray-100 gap-4">
        <!-- 股票資訊 -->
        <div class="w-full lg:w-[300px] flex flex-col lg:border-r lg:border-gray-200 lg:pr-6">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-gray-900 font-medium">{{ order.stockCode }}</span>
            <span class="text-gray-700">{{ order.stockName }}</span>
          </div>
          <div class="text-sm text-gray-500 flex items-center gap-2">
            <span>{{ order.meetingType }}</span>
            <span class="text-gray-400">|</span>
            <span>{{ order.meetingDate }}</span>
          </div>
        </div>

        <!-- 持有人資訊 -->
        <div class="w-full lg:w-[200px] flex flex-col lg:border-r lg:border-gray-200 lg:px-6">
          <div class="text-gray-900 mb-1">{{ order.name }}</div>
          <div class="text-sm text-gray-500">
            戶號: {{ order.accountNum || '--' }}
          </div>
        </div>

        <!-- 狀態 -->
        <div class="w-full lg:w-[120px] flex items-center lg:justify-center lg:border-r lg:border-gray-200 lg:px-6">
          <span class="px-3 py-1 rounded-full text-sm" 
            :class="{
              'bg-red-100 text-red-700': order.status === '缺件',
              'bg-yellow-100 text-yellow-700': order.status === '補件',
              'bg-green-100 text-green-700': order.status === '收件',
              'bg-gray-100 text-gray-700': !['缺件', '補件', '收件'].includes(order.status)
            }"
          >
            {{ order.status }}
          </span>
        </div>

        <!-- 備註欄位 -->
        <div class="flex-1 lg:pl-6">
          <div class="flex flex-col gap-2">
            <div class="flex items-start">
              <div class="text-gray-500 text-sm mr-2">備註：</div>
              <div class="text-gray-700 text-sm flex-1">{{ order.memo || '無' }}</div>
            </div>
            
            <!-- 出貨單號 -->
            <div v-if="order.shipmentNumber" class="flex items-start">
              <div class="text-gray-500 text-sm mr-2">出貨單號：</div>
              <div class="text-gray-700 text-sm">{{ order.shipmentNumber }}</div>
            </div>
            
            <!-- 繳交項目 -->
            <div v-if="order.docCombine?.length" class="flex flex-col">
              <div class="text-gray-500 text-sm mb-1">繳交項目：</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="item in order.docCombine" 
                  :key="item.seq"
                  class="bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-700"
                >
                  {{ item.docs.join(', ') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作區 -->
      <div class="flex items-center justify-end px-4 sm:px-6 py-3 bg-gray-50 text-sm rounded-b-lg">
        <div class="flex items-center gap-2">
          <!-- 詳細按鈕 -->
          <v-dialog max-width="500">
            <template v-slot:activator="{ props }">
              <button 
                class="view-action" 
                v-bind="props"
              >
                <div class="v-btn flex items-center gap-1 px-4 py-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  詳細
                </div>
              </button>
            </template>

            <template v-slot:default="{ isActive }">
              <v-card>
                <v-card-title>
                  <div class="flex justify-between items-center">
                    <span>詳細資料</span>
                    <v-btn icon @click="isActive.value = false">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </v-card-title>

                <v-card-text>
                  <div class="mb-6">
                    <div class="text-gray-700 font-medium mb-2">備註</div>
                    <div v-if="orderDetailMemo" class="bg-gray-50 p-4 rounded-lg text-gray-600">
                      {{ orderDetailMemo }}
                    </div>
                    <div v-else class="bg-gray-50 p-4 rounded-lg text-gray-500 italic">
                      無備註
                    </div>
                  </div>
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="gray"
                    text
                    @click="isActive.value = false"
                  >
                    關閉
                  </v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
          
          <button 
            class="delete-action" 
            @click="handleDelete(order.id)"
          >
            <div class="v-btn flex items-center gap-1 px-4 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              刪除
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 總計與分頁 -->
    <div class="mt-4">
      <div class="text-gray-500 text-sm mb-4 flex justify-end">
        共 {{ total }} 筆，{{ totalPages }} 頁
      </div>
      
      <div class="flex justify-center">
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          @update:model-value="handlePageChange"
          color="#0F93A2"
          rounded
          show-first-last-page
          first-icon="mdi-page-first"
          last-icon="mdi-page-last"
          prev-icon="mdi-chevron-left"
          next-icon="mdi-chevron-right"
          class="mt-4"
        />
      </div>
    </div>
  </div>
</div>
  </div>
  </div>
</template>
