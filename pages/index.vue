<script setup>
import { ref, computed, onMounted } from 'vue'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import ScrollToTop from '~/components/common/ScrollToTop.vue'

definePageMeta({
  title: '股東會資訊'
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const stockholderGifts = ref([])
const showMessage = ref(false)
const total = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const message = ref('')

// 年分下拉選單的選項
// 將原本的年份陣列改為計算屬性
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  // 產生從今年開始到前5年的年份陣列
  return Array.from({ length: 6 }, (_, index) => (currentYear - index).toString())
})

// 預設選擇當年
const selectedYear = ref(new Date().getFullYear().toString())

const showYearDropdown = ref(false);
// 加入控制狀態下拉選單的ref
const showStatusDropdown = ref(false);
// 添加控制繳交項目下拉選單的ref
const showSubmitDropdown = ref(false);
// 添加控制下委託代領拉選單的 ref
const showDateDropdown = ref(false);
// 添加控制更多條件下拉的 ref
const showMoreConditions = ref(false)
// 新增排序欄位
const sortField = ref(null)
const sortOrder = ref(null)
// 使用條件渲染顯示 icon
const activeItem = ref('更新') 
// 新增關鍵字搜尋的ref
const searchKeyword = ref('')
// 新增儲存勾選項目的ref
const selectedItems = ref([])
const selectAll = ref(false)
// 新增值與標籤的對應
const conditionLabels = {
  gift: {}, // 從 filterOptions.giftStatus 獲取
  meeting: {}, // 從 filterOptions.meetingType 獲取
  market: {}, // 從 filterOptions.marketType 獲取
  submit: {} // 從 filterOptions.documents 獲取
}

// 點一個條件,其他條件下拉選單都要關閉
const toggleDropdown = (dropdownName) => {
  // 創建下拉選單狀態的對象
  const dropdowns = {
    year: showYearDropdown,
    status: showStatusDropdown,
    submit: showSubmitDropdown,
    date: showDateDropdown,
    more: showMoreConditions
  }

  // 關閉其他下拉選單
  Object.entries(dropdowns).forEach(([name, ref]) => {
    if (name !== dropdownName) {
      ref.value = false
    }
  })

  // 切換當前下拉選單的狀態
  dropdowns[dropdownName].value = !dropdowns[dropdownName].value
}

// 更新對應關係的函數
const updateConditionLabels = () => {
  filterOptions.value.giftStatus?.forEach(item => {
    conditionLabels.gift[item.value] = item.label
  })
  filterOptions.value.meetingType?.forEach(item => {
    conditionLabels.meeting[item.value] = item.label
  })
  filterOptions.value.marketType?.forEach(item => {
    conditionLabels.market[item.value] = item.label
  })
  filterOptions.value.documents?.forEach(item => {
    conditionLabels.submit[item.value] = item.label
  })
}
const selectedStatus = ref('');
const selectedSubmitItem = ref('');
// 新增歷年發放彈出視窗的控制變數
const showModal = ref(false)
// 模擬歷年發放資料
const historicalItems = ref([]);

// 新增歷史資料的ref
const historyData = ref(null)
// toggleModal函數，加入API呼叫
const toggleModal = async (item) => {
  try {
    const response = await fetch(`/index.php/api/history?stockCode=${item.stockCode}`)
    const data = await response.json()
    if (data.status) {
      historyData.value = data.data
    }
  } catch (error) {
    console.error('Error fetching history:', error)
  }
}

// 選擇更多條件的下拉選單
const filterOptions = ref({
  meetingType: [],
  marketType: [],
  giftStatus: [],
  documents: []
})

// 選擇更多條件的下拉選單API 
const fetchFilterOptions = async () => {
  try {
    const response = await fetch('/index.php//api/options')
    const data = await response.json()
    if (data.status) {
      filterOptions.value = data.data
      updateConditionLabels() // 更新對應關係
    }
  } catch (error) {
    console.error('Error fetching options:', error)
  }
}

// 新增 選擇更多條件 computed 屬性
const selectedConditionsText = computed(() => {
  const conditions = []
  
  if (selectedConditions.value.gift.length) {
    conditions.push(...selectedConditions.value.gift.map(v => conditionLabels.gift[v]))
  }
  if (selectedConditions.value.meeting.length) {
    conditions.push(...selectedConditions.value.meeting.map(v => conditionLabels.meeting[v]))
  }
  if (selectedConditions.value.market.length) {
    conditions.push(...selectedConditions.value.market.map(v => conditionLabels.market[v]))
  }
  if (selectedConditions.value.submit.length) {
    conditions.push(...selectedConditions.value.submit.map(v => conditionLabels.submit[v]))
  }
  
  return conditions.length ? conditions.join('、') : '選擇更多條件'
})

// 獲取資料的函數
const fetchStockholderGifts = async () => {
  try {
    isLoading.value = true
    
    // 基礎參數
    const baseParams = {
      page: currentPage.value || 1,
      year: selectedYear.value,
      keyword: searchKeyword.value?.trim()
    }

    // 日期參數
    const dateParams = {
      updateDateStart: updateDate.value?.startDate,
      updateDateEnd: updateDate.value?.endDate,
      lastBuyDateStart: lastBuyDate.value?.startDate,
      lastBuyDateEnd: lastBuyDate.value?.endDate,
      deadlineDateStart: delegateDate.value?.startDate,
      deadlineDateEnd: delegateDate.value?.endDate
    }

    // 條件參數
    const conditionParams = {
      giftStatus: selectedConditions.value.gift.length > 0 
        ? selectedConditions.value.gift.join(',')
        : undefined,
      meetingType: selectedConditions.value.meeting.length > 0
        ? selectedConditions.value.meeting.join(',')
        : undefined,
      marketType: selectedConditions.value.market.length > 0
        ? selectedConditions.value.market.join(',')
        : undefined,
      documentIds: selectedConditions.value.submit.length > 0
        ? selectedConditions.value.submit.join(',')
        : undefined
    }

    // 合併所有參數並過濾空值
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

    // 更新路由參數
    router.push({
      query: params
    })

    // 構建 API 請求 URL
    const queryString = new URLSearchParams(params).toString()
    console.log('queryString:', queryString)
    const url = `/index.php/api/stockholder-gifts${queryString ? `?${queryString}` : ''}`
  

    const response = await fetch(url)
    const data = await response.json()

    if (data.status) {
      stockholderGifts.value = data.data.items || []
      total.value = data.data.total || 0
      currentPage.value = data.data.page || 1
      totalPages.value = data.data.totalPages || 1

      showMessage.value = !data.data.items?.length
      message.value = !data.data.items?.length ? '查無符合條件的結果' : ''
    } else {
      throw new Error(data.message || '資料取得失敗')
      await fetchStockholderGifts()
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    message.value = error.message || '系統發生錯誤'
    showMessage.value = true
    stockholderGifts.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// 在組件掛載時獲取資料
onMounted(() => {
  const { 
    page, year, keyword,
    updateDateStart, updateDateEnd,
    lastBuyDateStart, lastBuyDateEnd,
    deadlineDateStart, deadlineDateEnd,
    giftStatus, meetingType, marketType, documentIds
  } = route.query

  // 設置初始值
  if (Object.keys(route.query).length > 0) {
    currentPage.value = parseInt(page) || 1
    selectedYear.value = year || new Date().getFullYear().toString()
    searchKeyword.value = keyword || ''
    
    // 設置日期
    if (updateDateStart || updateDateEnd) {
      updateDate.value = {
        startDate: updateDateStart || '',
        endDate: updateDateEnd || '',
        selectedRange: 'custom'
      }
    }
    
    // 設置條件
    if (giftStatus || meetingType || marketType || documentIds) {
      selectedConditions.value = {
        gift: giftStatus ? giftStatus.split(',') : [],
        meeting: meetingType ? meetingType.split(',') : [],
        market: marketType ? marketType.split(',') : [],
        submit: documentIds ? documentIds.split(',') : []
      }
    }
  }

  fetchStockholderGifts()
  fetchFilterOptions()
})

// 新增清除條件函數
const clearFilters = () => {
  // 清除所有過濾條件
  searchKeyword.value = ''
  selectedYear.value = new Date().getFullYear().toString() // 重置為當年
  updateDate.value = { startDate: '', endDate: '', selectedRange: 'unlimited' }
  lastBuyDate.value = { startDate: '', endDate: '', selectedRange: 'unlimited' }
  delegateDate.value = { startDate: '', endDate: '', selectedRange: 'unlimited' }
  selectedConditions.value = {
    gift: [],
    meeting: [],
    market: [],
    submit: []
  }
  currentPage.value = 1

  // 清除 URL 參數
  router.push({
    path: route.path
  })

  // 重新獲取資料
  fetchStockholderGifts()
}

// 修改 handleItemClick 函數處理排序邏輯
const handleItemClick = (item) => {
  // 將中文對應到 API 所需欄位名
  const fieldMapping = {
    '更新': 'updateDate',
    '開會': 'meetingType', 
    '股號': 'stockCode',
    '股名': 'stockName',
    '委託截止': 'deadlineDate'
  }

  const field = fieldMapping[item]

  if(sortField.value === field) {
    // 如果點擊同一個欄位,切換排序順序
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    // 如果點擊不同欄位,設定新欄位並預設升冪
    sortField.value = field
    sortOrder.value = 'ASC'
  }

  // 更新 activeItem 顯示狀態
  activeItem.value = item
  
  // 重新獲取資料
  fetchStockholderGifts()
}

// 新增搜尋函數
const handleSearch = () => {
  fetchStockholderGifts()
}

// 處理全選的方法
const toggleAll = () => {
  if (selectAll.value) {
    // 如果勾選全選，將所有項目 ID 加入 selectedItems
    selectedItems.value = stockholderGifts.value.map(item => item.id)
  } else {
    // 如果取消全選，清空 selectedItems
    selectedItems.value = []
  }
}

// 處理勾選變更的函數
const handleCheckboxChange = (itemId) => {
  console.log('Checkbox changed:', itemId) // 加入除錯用
  const index = selectedItems.value.indexOf(itemId)
  if (index === -1) {
    selectedItems.value.push(itemId)
  } else {
    selectedItems.value.splice(index, 1)
  }
  // 更新全選狀態
  selectAll.value = selectedItems.value.length === stockholderGifts.value.length
  
  // 檢查選中狀態
  console.log('Selected items:', selectedItems.value)
}

// 建立委託的API呼叫函數 
const createOrders = async () => {
  const auth = useAuthStore()
  
  if (selectedItems.value.length === 0) {
    alert('請至少選擇一項進行委託')
    return
  }

  try {
    if (!auth.token) {
      alert('請先登入')
      return
    }

    const response = await fetch('/index.php/api/client/orders/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        stockIds: selectedItems.value
      })
    })

    const result = await response.json()
    
    if (result.status) {
      alert('委託建立成功')
      selectedItems.value = [] // 清空已選項目
      selectAll.value = false // 重置全選狀態
      await fetchStockholderGifts() // 重新獲取列表資料
    } else {
      alert(result.message || '委託建立失敗')
    }
  } catch (error) {
    console.error('Error creating orders:', error)
    alert('發生錯誤,請稍後再試')
  }
}

const selectedConditions = ref({
  gift: [],
  meeting: [],
  market: [],
  submit: []
})

const toggleCondition = (type, option) => {
  const index = selectedConditions.value[type].indexOf(option)
  if (index === -1) {
    selectedConditions.value[type].push(option)
  } else {
    selectedConditions.value[type].splice(index, 1)
  }
}

// todo日期相關
const updateDate = ref({
  startDate: '',
  endDate: '',
  selectedRange: 'unlimited'
})

// 最後買進日相關
const lastBuyDate = ref({
  startDate: '',
  endDate: '',
  selectedRange: 'unlimited'
})

// 委託代領截止相關
const delegateDate = ref({
  startDate: '',
  endDate: '',
  selectedRange: 'unlimited'
})

// 設定日期區間方法
const setUpdateDateRange = (range) => {
  const today = new Date()
  updateDate.value.selectedRange = range
  
  switch(range) {
    case 'unlimited':
      updateDate.value.startDate = ''
      updateDate.value.endDate = ''
      break

    case 'today':
      const formattedToday = formatDate(today)
      updateDate.value.startDate = formattedToday
      updateDate.value.endDate = formattedToday
      break

    case '1week':
      updateDate.value.endDate = formatDate(new Date())
      updateDate.value.startDate = formatDate(new Date(today.setDate(today.getDate() - 7)))
      break

    case '2weeks':
      updateDate.value.endDate = formatDate(new Date())
      updateDate.value.startDate = formatDate(new Date(today.setDate(today.getDate() - 14)))
      break

    case '1month':
      updateDate.value.endDate = formatDate(new Date())
      updateDate.value.startDate = formatDate(new Date(today.setMonth(today.getMonth() - 1)))
      break

    case '3months':
      updateDate.value.endDate = formatDate(new Date())
      updateDate.value.startDate = formatDate(new Date(today.setMonth(today.getMonth() - 3)))
      break
  }
}

// 最後買進日期區間設置
const setLastBuyDateRange = (range) => {
  const today = new Date()
  lastBuyDate.value.selectedRange = range
  
  switch(range) {
    case 'unlimited':
      lastBuyDate.value.startDate = ''
      lastBuyDate.value.endDate = ''
      break

    case 'today':
      const formattedToday = formatDate(today)
      lastBuyDate.value.startDate = formattedToday
      lastBuyDate.value.endDate = formattedToday
      break

    case '1week':
      lastBuyDate.value.endDate = formatDate(new Date())
      lastBuyDate.value.startDate = formatDate(new Date(today.setDate(today.getDate() - 7)))
      break

    case '2weeks':
      lastBuyDate.value.endDate = formatDate(new Date())
      lastBuyDate.value.startDate = formatDate(new Date(today.setDate(today.getDate() - 14)))
      break

    case '1month':
      lastBuyDate.value.endDate = formatDate(new Date())
      lastBuyDate.value.startDate = formatDate(new Date(today.setMonth(today.getMonth() - 1)))
      break

    case '3months':
      lastBuyDate.value.endDate = formatDate(new Date())
      lastBuyDate.value.startDate = formatDate(new Date(today.setMonth(today.getMonth() - 3)))
      break
  }
}

// 委託代領截止日期區間設置
const setDelegateDateRange = (range) => {
  const today = new Date()
  delegateDate.value.selectedRange = range
  
  switch(range) {
    case 'unlimited':
      delegateDate.value.startDate = ''
      delegateDate.value.endDate = ''
      break

    case 'today':
      const formattedToday = formatDate(today)
      delegateDate.value.startDate = formattedToday
      delegateDate.value.endDate = formattedToday
      break

    case '1week':
      delegateDate.value.endDate = formatDate(new Date())
      delegateDate.value.startDate = formatDate(new Date(today.setDate(today.getDate() - 7)))
      break

    case '2weeks':
      delegateDate.value.endDate = formatDate(new Date())
      delegateDate.value.startDate = formatDate(new Date(today.setDate(today.getDate() - 14)))
      break

    case '1month':
      delegateDate.value.endDate = formatDate(new Date())
      delegateDate.value.startDate = formatDate(new Date(today.setMonth(today.getMonth() - 1)))
      break

    case '3months':
      delegateDate.value.endDate = formatDate(new Date())
      delegateDate.value.startDate = formatDate(new Date(today.setMonth(today.getMonth() - 3)))
      break
  }
}

// 格式化日期的輔助函數
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateOptions = {
  'unlimited': '不限',
  'today': '今日',
  '1week': '近一週內',
  '2weeks': '近二週內',
  '1month': '近一個月內',
  '3months': '近三個月內'
}

// 計算日期差異的函數
const getTimeAgo = (updateDate) => {
  const now = new Date()
  const updated = new Date(updateDate)
  const diffTime = Math.abs(now - updated)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // 特殊情況處理
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays === 2) return '前天'
  
  return `${diffDays} 天前`
}

// 日期比較函數
const isBeforeDeadline = (deadlineDate) => {
  if (!deadlineDate) return false
  const today = new Date()
  const deadline = new Date(deadlineDate)
  return deadline >= today
}

// 電投狀態判斷函數
const getVotingStatus = (startDate, endDate) => {
  if (!startDate || !endDate) return null
  
  const today = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (today < start) return { text: '未開始', class: 'bg-yellow-100 text-yellow-700' }
  if (today > end) return { text: '已截止', class: 'bg-gray-100 text-gray-500 cursor-default' }
  return { text: '投票中', class: 'bg-green-100 text-green-700' }
}

// 更新現有的事件監聽器或新增一個
onMounted(() => {
  document.addEventListener('click', (e) => {
    // 檢查點擊是否在下拉選單容器外
    const isClickOutside = !e.target.closest('.relative')
    
    if (isClickOutside) {
      // 關閉所有下拉選單
      showYearDropdown.value = false
      showStatusDropdown.value = false
      showSubmitDropdown.value = false
      showDateDropdown.value = false
      showMoreConditions.value = false  // 加入這行
    }
  })
})

//todo 新增分頁相關函數
const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchStockholderGifts()
}

// 在 onMounted 中讀取並恢復搜尋條件
onMounted(() => {
  // 檢查是否有保存的搜尋狀態
  const savedState = localStorage.getItem('shareholderSearchState')
  
  if (savedState) {
    // 恢復保存的搜尋條件
    const state = JSON.parse(savedState)
    currentPage.value = state.page
    selectedYear.value = state.year
    searchKeyword.value = state.keyword
    updateDate.value = state.updateDate
    lastBuyDate.value = state.lastBuyDate
    delegateDate.value = state.delegateDate
    selectedConditions.value = state.selectedConditions

    // 清除已使用的狀態
    localStorage.removeItem('shareholderSearchState')
  }

  // 獲取數據
  fetchStockholderGifts()
  fetchFilterOptions()
})

</script>

<template>
  <div class="flex-grow">
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-8 px-4">
      <ScrollToTop />
    </div>
    <!-- todo 股東會資訊內容 -->
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-[1440px] mx-auto">
          <h1 class="text-2xl font-bold mb-4 pl-6">股東會紀念日</h1>
          
          <!--todo 股東會資訊主要搜尋內容區塊 -->
          <div class="border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7]">
            <!-- 下拉選單區域 -->
            <div class="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 lg:gap-6 p-4 lg:p-8">

            <!-- 第一行：年份和日期選擇 -->
            <div class="flex flex-col sm:flex-row w-full lg:w-auto gap-4 lg:gap-6">
                <!-- todo 年份選擇 -->
                <div class="relative w-full sm:w-[100px]">
                  <button 
                    @click.stop="toggleDropdown('year')"
                    class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                  >
                    <span>{{ selectedYear }}</span>
                    <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        stroke-width="2" 
                        :d="showYearDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                      />
                    </svg>
                  </button>

                  <!-- 下拉內容 -->
                  <div v-if="showYearDropdown" class="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-40 border border-gray-200 py-2">
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

                <!-- todo 選擇更新日 -->
                 <!-- 更新日、最後買進日、委託代領截止 -->
                <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <!-- 更新日按鈕 -->
                  <div class="relative w-full sm:w-[140px]">
                      <button 
                      @click.stop="toggleDropdown('status')"
                      class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white">
                      <span>{{ updateDate.startDate && updateDate.endDate ? 
                        `${updateDate.startDate} ~ ${updateDate.endDate}` : 
                        '選擇更新日' }}</span>
                      <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          stroke-width="2"
                          :d="showStatusDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                        />
                      </svg>
                    </button>

                    <div v-if="showStatusDropdown" 
                        class="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                        <!-- 標題 -->
                        <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">
                            請填寫更新日區間
                        </h3>

                        <!-- 日期選擇區域 -->
                        <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                            <!-- 開始日期 -->
                            <div class="flex-1">
                                <input
                                    v-model="updateDate.startDate"
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
                                    v-model="updateDate.endDate"
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
                                @click="setUpdateDateRange(key)"
                                :class="[
                                    'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                    'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                    updateDate.selectedRange === key 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                ]"
                            >
                                {{ option }}
                            </button>
                        </div>
                    </div>
                  </div>

                  <!-- todo 最後買進日 -->
                  <div class="relative w-full sm:w-[140px]">
                    <button 
                    @click.stop="toggleDropdown('submit')"
                    class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white">
                      <span>{{ lastBuyDate.startDate && lastBuyDate.endDate ? 
                        `${lastBuyDate.startDate} ~ ${lastBuyDate.endDate}` : 
                        '選擇最後買進日' }}</span>
                      <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          stroke-width="2"
                          :d="showSubmitDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                        />
                      </svg>
                    </button>

                    <div v-if="showSubmitDropdown" 
                      class="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                      <!-- 標題 -->
                      <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">
                          請填寫最後買進日區間
                      </h3>

                      <!-- 日期選擇區域 -->
                      <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                          <!-- 開始日期 -->
                          <div class="flex-1">
                              <input
                                  v-model="lastBuyDate.startDate"
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
                                  v-model="lastBuyDate.endDate"
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
                              @click="setLastBuyDateRange(key)"
                              :class="[
                                  'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                  'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                  lastBuyDate.selectedRange === key 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              ]"
                          >
                              {{ option }}
                          </button>
                      </div>
                    </div>
                  </div>

                  <!-- todo 委託代領截止 -->
                  <div class="relative w-full sm:w-[160px]">
                    <button 
                    @click.stop="toggleDropdown('date')"
                    class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white">
                      <span>{{ delegateDate.startDate && delegateDate.endDate ? 
                        `${delegateDate.startDate} ~ ${delegateDate.endDate}` : 
                        '選擇委託代領截止' }}</span>
                      <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          stroke-width="2"
                          :d="showDateDropdown ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                        />
                      </svg>
                    </button>

                    <div v-if="showDateDropdown" 
                        class="absolute top-full left-0 mt-1 w-full sm:w-[480px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                        <!-- 標題 -->
                        <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">
                            請填寫委託代領截止區間
                        </h3>

                        <!-- 日期選擇區域 -->
                        <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                            <!-- 開始日期 -->
                            <div class="flex-1">
                                <input
                                    v-model="delegateDate.startDate"
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
                                    v-model="delegateDate.endDate"
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
                                @click="setDelegateDateRange(key)"
                                :class="[
                                    'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                    'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                    delegateDate.selectedRange === key 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                ]"
                            >
                                {{ option }}
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
            </div>

              <!-- todo 選擇更多條件-->
             <!-- 第二行：更多條件和搜尋區域 -->
             <div class="flex flex-col sm:flex-row items-start lg:items-center w-full lg:w-auto gap-4">
              <!-- 更多條件按鈕 -->
              <div class="relative w-full sm:w-[140px]">
                <button 
                @click.stop="toggleDropdown('more')"
                class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white">
                <span>
                  <span>{{ selectedConditionsText }}</span>
                </span>
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2"
                      :d="showMoreConditions ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
                    />
                  </svg>
                </button>

                <!-- 選擇更多條件 -->
                <div v-if="showMoreConditions" 
                  class="absolute top-full left-0 mt-1 w-full sm:w-[360px] bg-white rounded-lg shadow-lg z-40 border border-gray-200 p-4 max-h-[80vh] overflow-y-auto">
                  
                  <!-- 紀念品 -->
                  <div class="mb-4">
                      <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">紀念品</h3>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <button
                              v-for="option in filterOptions.giftStatus"
                              :key="option.value"
                              @click="toggleCondition('gift', option.value)"
                              :class="[
                                  'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                  'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                  selectedConditions.gift.includes(option.value)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              ]"
                          >
                              {{ option.label }}
                          </button>
                      </div>
                  </div>

                  <div class="border-b border-gray-200 my-4"></div>

                  <!-- 開會性質 -->
                  <div class="mb-4">
                      <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">開會性質</h3>
                      <div class="grid grid-cols-2 gap-2">
                          <button
                              v-for="option in filterOptions.meetingType"
                              :key="option.value"
                              @click="toggleCondition('meeting', option.value)"
                              :class="[
                                  'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                  'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                  selectedConditions.meeting.includes(option.value)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              ]"
                          >
                              {{ option.label }}
                          </button>
                      </div>
                  </div>

                  <div class="border-b border-gray-200 my-4"></div>

                  <!-- 市場類別 -->
                  <div class="mb-4">
                      <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">市場類別</h3>
                      <div class="grid grid-cols-2 gap-2">
                          <button
                              v-for="option in filterOptions.marketType"
                              :key="option.value"
                              @click="toggleCondition('market', option.value)"
                              :class="[
                                  'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                  'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                  selectedConditions.market.includes(option.value)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              ]"
                          >
                              {{ option.label }}
                          </button>
                      </div>
                  </div>

                  <div class="border-b border-gray-200 my-4"></div>

                  <!-- 繳交項目 -->
                  <div>
                      <h3 class="text-blue-600 font-medium text-sm sm:text-base mb-2 sm:mb-3">繳交項目</h3>
                      <div class="grid grid-cols-2 gap-2">
                          <button
                              v-for="option in filterOptions.documents"
                              :key="option.value"
                              @click="toggleCondition('submit', option.value)"
                              :class="[
                                  'h-10 sm:h-12 rounded-xl text-xs sm:text-sm transition-colors',
                                  'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                                  selectedConditions.submit.includes(option.value)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              ]"
                          >
                              {{ option.label }}
                          </button>
                      </div>
                  </div>
                </div>
              </div>

              <!-- todo 搜尋區域 -->
              <div class="flex flex-col sm:flex-row gap-4 w-full lg:flex-1">
                <input 
                  v-model="searchKeyword"
                  class="w-full sm:w-[300px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="股票名稱、代號或紀念品" 
                />
                <div class="flex gap-4 w-full sm:w-auto">
                  <button 
                    @click="clearFilters"
                    class="flex-1 sm:w-[120px] h-[48px] bg-[#004850] text-white rounded-[12px] transition-colors duration-200 hover:bg-[#003840]"
                  >
                    清除條件
                  </button>
                  <button 
                    @click="handleSearch"
                    class="flex-1 sm:w-[120px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center gap-1 transition-colors duration-200 hover:bg-[#0d8291]"
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
        </div>
          <!-- todo 建立委託 -->
          <div class="flex justify-between items-center py-4 mt-5">
            <template v-if="authStore.token">
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  v-model="selectAll"
                  @change="toggleAll"
                  class="w-4 h-4 text-[#0F93A2] border-gray-300 rounded focus:ring-[#0F93A2]"
                />
                <span class="text-sm text-gray-600">全選</span>
                <span v-if="selectedItems.length > 0" class="text-sm text-gray-500">
                  (已選擇 {{ selectedItems.length }} 項)
                </span>
              </div>
              <button
                @click="createOrders"
                class="px-4 py-2 bg-[#0F93A2] text-white rounded-lg hover:bg-[#0d8291] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="selectedItems.length === 0"
              >
                建立委託
              </button>
            </template>
            <template v-else>
              <div class="w-full text-center text-gray-500">
                請先<button 
                  @click="router.push('/login')" 
                  class="text-[#0F93A2] hover:underline"
                >登入</button>後即可建立委託
              </div>
            </template>
          </div>
      </div>

      <!-- todo 報表內容 -->
      <div class="max-w-[1880px] mx-auto px-4">
        <div class="py-6 sm:py-10">
          <!-- Loading 和錯誤訊息區塊 -->
          <div v-if="isLoading" class="min-h-[200px] flex items-center justify-center">
            <Loading />
          </div>
          
          <div v-else>
            <ErrorMsg 
              v-if="showMessage || stockholderGifts.length === 0" 
              :message="message || '查無符合條件的結果'"
            >
              <p v-if="showMessage" class="mt-2 text-sm">
                請調整搜尋條件後重試
              </p>
            </ErrorMsg>
          </div>

          <!-- 使用 v-for 遍歷資料 -->
          <div class="space-y-4">
            <div 
              v-for="(item, index) in stockholderGifts" 
              :key="item.id" 
              :class="[
                'overflow-hidden p-4 sm:p-6 md:p-8 border-b border-gray-200',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              ]"
            >
              <!-- Header Section -->
              <div class="flex flex-col lg:flex-row gap-6">
                <!-- 左側區塊: 勾選框和基本資訊 -->
                <div class="flex items-start space-x-4">
                  <div class="pt-2">
                    <input
                      v-if="authStore.token"
                      type="checkbox"
                      :checked="selectedItems.includes(item.id)"
                      @change="handleCheckboxChange(item.id)"
                      class="w-4 h-4 text-[#0F93A2] border-gray-300 rounded focus:ring-[#0F93A2]"
                    />
                  </div>
                  
                  <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                    <NuxtImg 
                      :src="item.giftImage || '/images/logo.svg'"
                      alt="Gift Image" 
                      class="w-[80px] h-[80px] object-cover" 
                    />
                    <div class="space-y-1">
                      <h3 class="text-base sm:text-lg font-medium text-gray-900 leading-tight">
                        {{ item.stockCode }} {{ item.stockName }} {{ item.meetingDate }} {{ item.meetingType }}
                      </h3>
                      <p class="text-lg sm:text-xl text-gray-600 truncate max-w-[200px]">
                        {{ item.giftName }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 分隔線 -->
                <div class="hidden lg:block h-12 w-[2px] bg-gray-200"></div>

                <!-- 右側資訊區塊 -->
                <div class="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 lg:mt-0">
                  <!-- 歷年發放 & 股價 -->
                  <div class="space-y-4">
                    <v-dialog max-width="1000">
                      <!-- 觸發按鈕 -->
                      <template v-slot:activator="{ props }">
                        <a 
                          v-bind="props"
                          class="text-blue-500 text-sm hover:underline"
                          @click="toggleModal(item)"
                        >
                          歷年發放
                        </a>
                      </template>

                      <!-- todo 彈出歷年發放視窗 -->
                      <!-- Dialog 內容 -->
                      <template v-slot:default="{ isActive }">
                        <v-card>
                          <v-card-title class="d-flex justify-space-between align-center">
                            <span class="text-base sm:text-lg font-medium text-center w-full pr-8">
                              {{ historyData?.stockCode }} {{ historyData?.stockName }} 歷年發放紀念品
                            </span>
                            <v-btn icon @click="isActive.value = false">
                              <v-icon>mdi-close</v-icon>
                            </v-btn>
                          </v-card-title>

                          <v-card-text>
                          <!-- 內容區域 -->
                          <div class="mt-4 overflow-x-auto">
                            <div class="min-w-[768px]"> <!-- 設定最小寬度確保表格不會壓縮 -->
                              <!-- 表格標題列 -->
                              <div class="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-t-lg">
                                <div class="col-span-2 text-sm font-medium text-gray-600">紀念品</div>
                                <div class="col-span-2 text-sm font-medium text-gray-600">開會日期</div>
                                <div class="col-span-1 text-sm font-medium text-gray-600">性質</div>
                                <div class="col-span-3 text-sm font-medium text-gray-600">品項</div>
                                <div class="col-span-4 text-sm font-medium text-gray-600">繳交文件</div>
                              </div>

                              <!-- 歷史記錄列表 -->
                              <div class="divide-y divide-gray-200">
                                <div 
                                  v-for="(item, index) in historyData?.items" 
                                  :key="index" 
                                  class="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50"
                                >
                                  <!-- 紀念品圖片 -->
                                  <div class="col-span-2">
                                    <img 
                                      :src="item.giftImg" 
                                      alt="紀念品" 
                                      class="w-16 h-16 object-cover rounded-lg shadow-sm"
                                    >
                                  </div>
                                  
                                  <!-- 開會日期 -->
                                  <div class="col-span-2">
                                    <span class="text-sm text-gray-600">{{ item.meetingDate }}</span>
                                  </div>
                                  
                                  <!-- 會議性質 -->
                                  <div class="col-span-1">
                                    <span class="text-sm text-gray-600">{{ item.meetingType }}</span>
                                  </div>
                                  
                                  <!-- 品項名稱 -->
                                  <div class="col-span-3">
                                    <span class="text-sm text-gray-900">{{ item.giftName }}</span>
                                  </div>
                                  
                                  <!-- 繳交文件 -->
                                  <div class="col-span-4">
                                    <div class="flex items-center">
                                      <span class="text-sm text-[#0F93A2] mr-2">繳交:</span>
                                      <div class="flex-1">
                                        <div v-if="item.documentCombinations?.length" class="text-sm text-gray-900">
                                          <div 
                                            v-for="combo in item.documentCombinations" 
                                            :key="combo.sequence" 
                                            class="whitespace-nowrap"
                                          >
                                            組合{{ combo.sequence }}: {{ combo.documents.join(' + ') }}
                                          </div>
                                        </div>
                                        <span v-else class="text-sm text-gray-600">不需繳交</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                    </template>
                  </v-dialog>
                  <!-- 加入股價資訊 -->
                    <div>
                      <span class="text-sm text-gray-500 block">股價</span>
                      <p class="text-sm font-medium" :class="Number(item.priceChange) >= 0 ? 'text-red-500' : 'text-green-500'">
                        ${{ item.stockPrice }} {{ Number(item.priceChange) >= 0 ? '▲' : '▼' }} {{ Math.abs(item.priceChange) }}%
                      </p>
                    </div>
                  </div>

                  <!-- 日期資訊 -->
                  <div class="space-y-4">
                    <div>
                      <span class="text-sm text-gray-500 block">最後買進日</span>
                      <p class="text-sm font-medium text-gray-900">
                        {{ item.lastBuyDate?.split('-')[1] }}/{{ item.lastBuyDate?.split('-')[2] }}
                      </p>
                    </div>
                    <div>
                      <span class="text-sm text-gray-500 block">代領截止日</span>
                      <div class="flex items-center gap-2 mt-1">
                        <p class="text-sm font-medium text-gray-900">
                          {{ item.deadlineDate?.split('-')[1] }}/{{ item.deadlineDate?.split('-')[2] }}
                        </p>
                        <span 
                          :class="[
                            'px-2 py-1 rounded-md text-sm inline-block',
                            isBeforeDeadline(item.deadlineDate) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          ]"
                        >
                          {{ isBeforeDeadline(item.deadlineDate) ? '可代領' : '已截止' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 電投和繳交資訊 -->
                  <div class="space-y-4">
                    <div>
                      <span class="text-sm text-gray-500 block">電投</span>
                      <div class="flex items-center gap-2 mt-1">
                        <p class="text-sm font-medium text-gray-900">
                          {{ item.votingDateStart?.split('-')[1] }}/{{ item.votingDateStart?.split('-')[2] }}~
                          {{ item.votingDateEnd?.split('-')[1] }}/{{ item.votingDateEnd?.split('-')[2] }}
                        </p>
                        <span 
                          v-if="getVotingStatus(item.votingDateStart, item.votingDateEnd)"
                          :class="[
                            'px-2 py-1 rounded-md text-sm inline-block',
                            getVotingStatus(item.votingDateStart, item.votingDateEnd).class
                          ]"
                        >
                          {{ getVotingStatus(item.votingDateStart, item.votingDateEnd).text }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span class="text-sm text-gray-500 block">繳交</span>
                      <div v-if="item.documentCombinations?.length" class="space-y-1 mt-1">
                        <p 
                          v-for="combination in item.documentCombinations" 
                          :key="combination.sequence" 
                          class="text-sm font-medium text-gray-900"
                        >
                          組合 {{ combination.sequence }} = {{ combination.documents.join(' + ') }}
                        </p>
                      </div>
                      <p v-else class="text-sm font-medium text-gray-900 mt-1">
                        不需繳交
                      </p>
                    </div>
                  </div>

                  <!-- 市場別和股務代理 -->
                  <div class="space-y-4">
                    <div>
                      <span class="text-sm text-gray-500 block">市場別</span>
                      <p class="text-sm font-medium text-gray-900 mt-1">{{ item.marketType }}</p>
                    </div>
                    <div>
                      <span class="text-sm text-gray-500 block">股務代理</span>
                      <p class="text-sm font-medium text-gray-900 mt-1">{{ item.serviceAgent }}</p>
                      <p class="text-sm font-medium text-gray-900">{{ item.phone }}</p>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Footer Section -->
              <div class="flex justify-end w-full text-gray-500 text-sm mt-4">
                資料更新於 {{ getTimeAgo(item.updateDate) }}
              </div>
            </div>
          </div>

          <!-- 分頁資訊 -->
          <div class="flex justify-end w-full text-gray-500 text-sm mt-6">
            共 {{ total }} 筆，{{ totalPages }} 頁
          </div>

          <!-- 分頁元件 -->
          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="handlePageChange"
            color="primary"
            rounded
            show-first-last-page
            first-icon="mdi-page-first"
            last-icon="mdi-page-last"
            prev-icon="mdi-chevron-left" 
            next-icon="mdi-chevron-right"
            class="mt-4 d-flex justify-center"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-grow {
  flex-grow: 1;
}

.min-h-screen {
  min-height: 100vh;
  position: relative;
  padding-bottom: 200px; /* footer 高度 + 額外間距 */
}

select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230F93A2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5em;
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

select::-ms-expand {
  display: none;
}

</style>