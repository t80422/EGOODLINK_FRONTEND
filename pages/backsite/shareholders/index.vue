<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
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
const historicalItems = ref([

]);
// 新增歷史資料的ref
const historyData = ref(null)
// toggleModal函數，加入API呼叫
const toggleModal = async (item) => {
  if (!showModal.value) {
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
  showModal.value = !showModal.value
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
  const index = selectedItems.value.indexOf(itemId)
  if (index === -1) {
    selectedItems.value.push(itemId)
  } else {
    selectedItems.value.splice(index, 1)
  }
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
      selectedItems.value = []
      await fetchStockholderGifts()
    } else {
      alert('委託建立失敗')
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

// 新增處理編輯導航的函數
const handleEdit = (id) => {
  // 保存當前搜尋條件到 localStorage
  const searchState = {
    page: currentPage.value,
    year: selectedYear.value,
    keyword: searchKeyword.value,
    updateDate: updateDate.value,
    lastBuyDate: lastBuyDate.value,
    delegateDate: delegateDate.value,
    selectedConditions: selectedConditions.value
  }
  localStorage.setItem('shareholderSearchState', JSON.stringify(searchState))
  
  // 導航到編輯頁面
  navigateTo(`/backsite/shareholders/edit/${id}`)
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

const handleDelete = async (id) => {
  if (confirm('確定要刪除此筆資料嗎？')) {
    try {
      const response = await fetch(`/index.php/api/client/stockholderGifts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // 重新載入資料
        alert('刪除成功')
        await fetchStockholderGifts()
      } else {
        const errorData = await response.json()
        alert(errorData.message || '刪除失敗')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('刪除時發生錯誤')
    }
  }
}

</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    
    <v-main>
      <div class="container-main">
        <v-breadcrumbs
          :items="[
            {
              title: '首頁',
              href: '/backsite',
              disabled: false
            },
            {
              title: '股東會資訊',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full mx-auto">
          <!--todo 股東會資訊主要搜尋內容區塊 -->
          <div class="max-w-[1680px] border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7] py-4 px-6">
            <!-- 下拉選單區域 -->
            <div class="flex flex-nowrap justify-start items-center gap-3">
              <!-- 年份選擇 -->
              <div class="relative">
                <button 
                @click.stop="toggleDropdown('year')"
                  class="w-[70px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
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
                <div v-if="showYearDropdown" 
                    class="absolute top-full left-0 mt-1 w-[111px] bg-white rounded-lg shadow-lg z-50 border border-gray-200 py-2">
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
              <div class="flex items-center space-x-2 relative">
                <button 
                 @click.stop="toggleDropdown('status')"
                  class="w-[110px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
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
                    class="absolute top-full left-0 mt-1 w-[480px] bg-white rounded-lg shadow-lg z-50 border border-gray-200 p-4">
                  <h3 class="text-blue-600 font-medium mb-3">請填寫更新日區間</h3>
                  <div class="flex items-center space-x-2 mb-4">
                    <input
                      v-model="updateDate.startDate"
                      type="date"
                      class="w-[170px] h-[48px] text-sm border border-gray-300 rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="開始日期"
                    />
                    <span>~</span>
                    <input
                      v-model="updateDate.endDate"
                      type="date"
                      class="w-[170px] h-[48px] text-sm border border-gray-300 rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="結束日期"
                    />
                  </div>

                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="(option, key) in dateOptions" 
                      :key="key"
                      @click="setUpdateDateRange(key)"
                      :class="[
                        'h-[48px] rounded-[12px] text-sm',
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
              <div class="flex items-center space-x-2 relative">
                <button 
                  @click.stop="toggleDropdown('submit')"
                  class="w-[140px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
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
                    class="absolute top-full left-0 mt-1 w-[480px] bg-white rounded-lg shadow-lg z-50 border border-gray-200 p-4">
                  <h3 class="text-blue-600 font-medium mb-3">請填寫最後買進日區間</h3>
                  <div class="flex items-center space-x-2 mb-4">
                    <input
                      v-model="lastBuyDate.startDate"
                      type="date"
                      class="w-[170px] h-[48px] text-sm border border-gray-300 rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="開始日期"
                    />
                    <span>~</span>
                    <input
                      v-model="lastBuyDate.endDate"
                      type="date"
                      class="w-[170px] h-[48px] text-sm border border-gray-300 rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="結束日期"
                    />
                  </div>

                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="(option, key) in dateOptions" 
                      :key="key"
                      @click="setLastBuyDateRange(key)"
                      :class="[
                        'h-[48px] rounded-[12px] text-sm',
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
              <div class="relative date-dropdown">
                <button 
                 @click.stop="toggleDropdown('date')"
                  class="w-[150px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
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
                    class="absolute top-full left-0 mt-1 w-[480px] bg-white rounded-lg shadow-lg z-50 border border-gray-200 p-4">
                  <h3 class="text-blue-600 font-medium mb-3">請填寫委託代領截止區間</h3>
                  <div class="flex items-center space-x-2 mb-4">
                    <input
                      v-model="delegateDate.startDate"
                      type="date"
                      class="w-[170px] h-[48px] text-sm border border-gray-300 rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="開始日期"
                    />
                    <span>~</span>
                    <input
                      v-model="delegateDate.endDate"
                      type="date"
                      class="w-[170px] h-[48px] text-sm border border-gray-300 rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="結束日期"
                    />
                  </div>

                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="(option, key) in dateOptions" 
                      :key="key"
                      @click="setDelegateDateRange(key)"
                      :class="[
                        'h-[48px] rounded-[12px] text-sm',
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
              
              <!-- todo 選擇更多條件-->
              <div class="relative">
                <button 
                  @click.stop="toggleDropdown('more')"
                  class="w-[120px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white"
                >
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
                    class="absolute top-full left-0 mt-1 w-[308px] bg-white rounded-lg shadow-lg z-50 border border-gray-200 p-4">
                  
                  <!-- 紀念品 -->
                  <div class="mb-4">
                    <h3 class="text-blue-600 font-medium mb-2">紀念品</h3>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        v-for="option in filterOptions.giftStatus"
                        :key="option.value"
                        @click="toggleCondition('gift', option.value)"
                        :class="[
                          'h-[48px] rounded-[12px] text-sm',
                          selectedConditions.gift.includes(option.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        ]"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </div>

                  <div class="border-b border-gray-200 mb-4"></div>

                  <!-- 開會性質 -->
                  <div class="mb-4">
                    <h3 class="text-blue-600 font-medium mb-2">開會性質</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="option in filterOptions.meetingType"
                        :key="option.value"
                        @click="toggleCondition('meeting', option.value)"
                        :class="[
                          'h-[48px] rounded-[12px] text-sm',
                          selectedConditions.meeting.includes(option.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        ]"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </div>

                  <div class="border-b border-gray-200 mb-4"></div>

                  <!-- 市場類別 -->
                  <div class="mb-4">
                    <h3 class="text-blue-600 font-medium mb-2">市場類別</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="option in filterOptions.marketType"
                        :key="option.value"
                        @click="toggleCondition('market', option.value)"
                        :class="[
                          'h-[48px] rounded-[12px] text-sm',
                          selectedConditions.market.includes(option.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        ]"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </div>

                  <div class="border-b border-gray-200 mb-4"></div>

                  <!-- 繳交項目 -->
                  <div>
                    <h3 class="text-blue-600 font-medium mb-2">繳交項目</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-for="option in filterOptions.documents"
                        :key="option.value"
                        @click="toggleCondition('submit', option.value)"
                        :class="[
                          'h-[48px] rounded-[12px] text-sm',
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
              <div class="flex flex-nowrap justify-between items-center w-full">
                  <!-- 左側搜尋區域 -->
                  <div class="flex flex-nowrap items-center gap-4">
                    <input 
                      v-model="searchKeyword"
                      class="w-[210px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="股票名稱、代號或紀念品" 
                    />
                    <button 
                      @click="clearFilters"
                      class="w-[100px] h-[48px] bg-[#004850] text-white rounded-[12px] transition-colors duration-200 hover:bg-[#003840]"
                    >
                      清除條件
                    </button>
                    <button 
                      @click="handleSearch"
                      class="w-[100px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center gap-1 transition-colors duration-200 hover:bg-[#0d8291]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                      搜尋
                    </button>
                  </div>

                  <!-- 修改右側按鈕群組 -->
                  <div class="flex gap-4">
                    <router-link 
                      to="/backsite/shareholders/create" 
                      class="inline-block"
                    >
                      <button class="add-btn w-[110px] h-[48px] bg-[#0F93A2] text-white px-4 py-2 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        新增
                      </button>
                    </router-link>
                    
                    <router-link 
                      to="/backsite/shareholders/update-info" 
                      class="inline-block"
                    >
                    <button class="update-btn w-[134px] h-[48px] bg-white text-[#0F93A2] border border-[#0F93A2] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                        <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 2v6h-6"/>
                          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                          <path d="M3 22v-6h6"/>
                          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                        </svg>
                        更新資訊
                      </button>
                    </router-link>
                    
                    <button class="export-btn w-[110px] h-[48px] bg-white text-[#0F93A2] border border-[#0F93A2] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center gap-2">
                      <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5l0 9"/>
                        <path d="M8 9l4-4 4 4"/>
                        <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
                      </svg>
                      匯出
                    </button>
                  </div>
                </div>
            </div>
          </div>
          
          <!-- todo 報表內容 -->
          <div class="w-full mx-auto px-8 mt-10">
            <div class="max-h-[450px] overflow-y-auto max-w-[1750px] overflow-x-auto">
           <!-- Loading 和錯誤訊息區塊 -->
           <div v-if="isLoading">
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
                <div>
                  <div 
                      v-for="(item, index) in stockholderGifts" 
                      :key="item.id" 
                      :class="[
                        'overflow-hidden p-8 border-b border-gray-200',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      ]"
                    >
                    <!-- Header Section -->
                    <div class="flex flex-wrap items-center">
                      <!-- Checkbox and Logo -->
                      <div class="flex items-center space-x-1">
                        <NuxtImg 
                          :src="item.giftImage || '/images/logo.svg'"
                          alt="Gift Image" 
                          class="w-[80px] h-[80px]" 
                        />
                        <div>
                          <div class="flex flex-col space-y-1">
                            <!-- 上排：股號、股名、開會日期、開會性質 -->
                            <h3 class="text-lg font-medium text-gray-900 max-w-[300px] leading-5">
                              {{ item.stockCode }} {{ item.stockName }} {{ item.meetingDate }} {{ item.meetingType }}
                            </h3>
                            <!-- 下排：紀念品名稱 -->
                            <p class="text-xl text-gray-600 truncate max-w-[200px]">
                              {{ item.giftName }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Divider -->
                      <div class="h-12 w-[2px] bg-gray-200"></div>

                      <!-- Information Items -->
                      <div class="flex-grow flex justify-start divide-x divide-gray-200 [&>div]:px-[1.3rem]">
                        <div class="flex flex-col">
                          <span class="text-sm text-gray-500">持股紀錄</span>
                          <a 
                            href="#" 
                            class="text-blue-500 text-sm hover:underline"
                            @click.prevent="toggleModal(item)"
                          >
                            歷年發放
                          </a>
                        </div>

                        <div class="flex flex-col">
                          <span class="text-sm text-gray-500">股價</span>
                          <p class="text-sm font-medium" :class="Number(item.priceChange) >= 0 ? 'text-red-500' : 'text-green-500'">
                            ${{ item.stockPrice }} {{ Number(item.priceChange) >= 0 ? '▲' : '▼' }} {{ Math.abs(item.priceChange) }}%
                          </p>
                        </div>

                        <div class="flex flex-col">
                          <span class="text-sm text-gray-500">最後買進日</span>
                          <p class="text-sm font-medium text-gray-900 ">{{ item.lastBuyDate?.split('-')[1] }}/{{ item.lastBuyDate?.split('-')[2] }}</p>
                        </div>

                        <div class="flex flex-col">
                          <span class="text-sm text-gray-500">代領截止日</span>
                          <div class="flex items-center space-x-4 mt-2">
                            <p class="text-sm font-medium text-gray-900">
                              {{ item.deadlineDate?.split('-')[1] }}/{{ item.deadlineDate?.split('-')[2] }}
                            </p>
                            <button 
                              :class="[
                                'px-2 py-1 rounded-md text-sm cursor-default',
                                isBeforeDeadline(item.deadlineDate) 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-500'
                              ]"
                            >
                              {{ isBeforeDeadline(item.deadlineDate) ? '可代領' : '已截止' }}
                            </button>
                          </div>
                        </div>

                        <div class="flex flex-col space-y-2">
                          <div class="flex items-center space-x-3">
                            <span class="text-sm text-gray-500">電投</span>
                            <div class="flex items-center space-x-1">
                              <p class="text-sm font-medium text-gray-900">
                                {{ item.votingDateStart?.split('-')[1] }}/{{ item.votingDateStart?.split('-')[2] }}~
                                {{ item.votingDateEnd?.split('-')[1] }}/{{ item.votingDateEnd?.split('-')[2] }}
                              </p>
                              <button 
                                v-if="getVotingStatus(item.votingDateStart, item.votingDateEnd)"
                                :class="[
                                  'px-2 py-1 rounded-md text-sm',
                                  getVotingStatus(item.votingDateStart, item.votingDateEnd).class
                                ]"
                              >
                                {{ getVotingStatus(item.votingDateStart, item.votingDateEnd).text }}
                              </button>
                            </div>
                          </div>
                          
                          <div class="flex flex-col space-y-1">
                            <span class="text-sm text-gray-500">繳交</span>
                            <!-- 檢查是否有組合文件 -->
                            <div v-if="item.documentCombinations?.length" class="space-y-1">
                              <!-- 遍歷每個組合 -->
                              <p v-for="combination in item.documentCombinations" 
                                :key="combination.sequence" 
                                class="text-sm font-medium text-gray-900"
                              >
                                組合 {{ combination.sequence }} = {{ combination.documents.join(' + ') }}
                              </p>
                            </div>
                            <!-- 無組合文件時顯示 -->
                            <p v-else class="text-sm font-medium text-gray-900">
                              不需繳交
                            </p>
                          </div>
                        </div>

                        <div class="flex flex-col">
                          <span class="text-sm text-gray-500">市場別</span>
                          <p class="text-sm font-medium text-gray-900">{{ item.marketType }}</p>
                        </div>

                        <div class="flex flex-col">
                          <span class="text-sm text-gray-500">股務代理</span>
                          <p class="text-sm font-medium text-gray-900">{{ item.serviceAgent }}</p>
                          <p class="text-sm font-medium text-gray-900">{{ item.phone }}</p>
                        </div>

                        <div class="flex items-center space-x-1 ml-2 min-w-[40px]">
                          <span class="edit-action">
                            <v-btn
                              icon="mdi-pencil"
                              size="small"
                              variant="text"
                              @click="handleEdit(item.id)"
                            />
                          </span>
                          <span class="delete-action">
                            <v-btn
                              icon="mdi-delete"
                              size="small"
                              variant="text"
                              @click="handleDelete(item.id)"
                            />
                          </span>
                        </div>
                      </div>

                        <!-- todo 彈出歷年發放視窗 -->
                        <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                          <div class="relative top-20 mx-auto p-5 border w-[1000px] shadow-lg rounded-md bg-white">
                            <!-- 標題和關閉按鈕 -->
                            <div class="flex justify-between items-center mb-4 relative">
                              <div class="absolute right-0">
                                <button @click="toggleModal" class="text-gray-400 hover:text-gray-500">
                                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <h3 class="text-lg font-medium w-full text-center">
                                {{ historyData?.stockCode }} {{ historyData?.stockName }} 歷年發放紀念品
                              </h3>
                            </div>
                            <!-- 內容區域 -->
                            <div class="mt-4">
                              <div v-for="(item, index) in historyData?.items" :key="index" 
                                  class="flex items-center p-4 border-b min-h-[64px]">
                                <div class="flex items-center space-x-8">
                                  <img :src="item.giftImg" alt="紀念品" class="w-16 h-16 object-cover rounded">
                                  
                                  <div class="w-32">
                                    <span class="text-gray-600">{{ item.meetingDate }}</span>
                                  </div>
                                  
                                  <div class="w-20">
                                    <span class="text-gray-600">{{ item.meetingType }}</span>
                                  </div>
                                  
                                  <div class="w-20">
                                    <span class="text-[#0F93A2]">紀念品</span>
                                  </div>

                                  <div class="w-40">
                                    <span class="text-gray-900">{{ item.giftName }}</span>
                                  </div>
                                  
                                  <div class="w-60 flex items-center">
                                    <span class="text-[#0F93A2] mr-5">繳交:</span>
                                    <div v-if="item.documentCombinations?.length" class="text-gray-900">
                                      <div v-for="combo in item.documentCombinations" :key="combo.sequence" class="whitespace-nowrap">
                                        組合{{ combo.sequence }}: {{ combo.documents.join(' + ') }}
                                      </div>
                                    </div>
                                    <span v-else class="text-gray-600">不需繳交</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>

                    <!-- Footer Section -->
                    <div class="flex justify-end w-full text-gray-500 text-sm mt-6">
                      資料更新於 {{ getTimeAgo(item.updateDate) }}
                    </div>
                  </div>
                </div>
            </div>
            <div class="flex justify-start w-full text-gray-500 text-sm">
                  共 {{ total }} 筆
            </div>

              <!-- todo 分頁 -->
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
    </v-main>
  </v-layout>
</template>

<style scoped>
.update-btn {
  transition: all 0.2s ease-in-out;
}

.update-btn:hover {
  background-color: #424646 !important;
  color: white !important;
}

.update-btn svg {
  transition: all 0.2s ease-in-out;
}

.update-btn:hover svg {
  stroke: white;
}

.add-btn {
  transition: all 0.2s ease-in-out;
}

.add-btn:hover {
  background-color: white !important;
  color: #0F93A2 !important;
  border: 1px solid #0F93A2 !important;
}

.add-btn:hover svg {
  stroke: #0F93A2;
}

.export-btn {
  position: relative;
  overflow: hidden;
}

.export-btn:hover {
  background-color: #424646 !important;
  color: white !important;
}

.export-btn svg {
  transition: all 0.2s ease-in-out;
}

.export-btn:hover svg {
  stroke: white;
}

.edit,
.delete {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 狀態顏色 */
.text-green-500 {
  color: #10b981;
}

.text-red-500 {
  color: #ef4444;
}

.shareholders-gift {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container-main {
  padding: 20px;
  width: 100%;
}

.loading-state, .error-message, .no-data {
  text-align: center;
  padding: 20px;
}

@media (max-width: 1440px) {
  .container-main {
    padding: 20px;
  }
  
  /* 調整資訊項目換行 */
  .flex.justify-start {
    flex-wrap: wrap;
    gap: 1rem;
  }

}


/* 調整響應式設計 */
@media (min-width: 1920px) {
  .container-main {
    max-width: 1920px;
    margin: 0 auto;
  }
}

@media (max-width: 1919px) {
  .container-main {
    width: 100%;
    padding: 20px;
  }
  
  .flex.justify-start {
    gap: 2rem;
  }
}

.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

/* 美化水平卷軸 */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}
</style>