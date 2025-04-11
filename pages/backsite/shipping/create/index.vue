<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

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
    title: '出貨作業',
    href: '/backsite/shipping',
    disabled: false
  },
  {
    title: '新增出貨',
    disabled: true
  }
]

const authStore = useAuthStore() 
const router = useRouter()
const isSelectOpen = ref(false)
// 驗證錯誤
const errors = ref({})
const isSubmitting = ref(false)

const startDate = ref(null);
const endDate = ref(null);

const memberName = ref('')
const stockStatus = ref('')
const searchKeyword = ref('')
const showDetailModal = ref(false)
const selectedMember = ref(null)
const searchResults = ref([])
const isLoading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const itemsPerPage = 10
const currentDetailPage = ref(1)
const totalDetailPages = computed(() => {
  // 當數據小於等於每頁數量時，不顯示分頁
  return items.value.length > itemsPerPage ? Math.ceil(items.value.length / itemsPerPage) : 0
})

// 分頁後的項目
const paginatedItems = computed(() => {
  const start = (currentDetailPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return items.value.length > itemsPerPage ? items.value.slice(start, end) : items.value
})

// 處理分頁變更
const handleDetailPageChange = (page) => {
  currentDetailPage.value = page
}

const handleBack = () => {
  router.push('/backsite/shipping')
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formData = ref({
  date: '',
  memo: '',
  userId: null,
  items: []
})
const items = ref([])

const fetchMembers = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // 確保日期格式化
    const formattedStartDate = startDate.value ? formatDate(startDate.value) : null
    const formattedEndDate = endDate.value ? formatDate(endDate.value) : null
    
    // 建構查詢參數
    const params = {
      page: currentPage.value.toString(), // 確保是字串
      ...(searchKeyword.value?.trim() && { keyword: searchKeyword.value.trim() }),
      ...(formattedStartDate && { startDate: formattedStartDate }),
      ...(formattedEndDate && { endDate: formattedEndDate })
    }

    // Debug 輸出
    console.log('Search params:', params)

    const queryString = new URLSearchParams(params).toString()
    console.log('Query string:', queryString)
    
    const response = await fetch(`/index.php/api/admin/shipment/orders?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()
    console.log('API response:', result)

    if (result.status) {
      searchResults.value = result.data.items.map(item => ({
        id: item.userId,
        memberName: item.name,
        phone: item.phone,
        location: item.location
      }))
      currentPage.value = Number(result.data.page) // 確保是數字
      totalPages.value = result.data.totalPages
      totalItems.value = result.data.total
    } else {
      throw new Error(result.message || '獲取資料失敗')
    }
  } catch (err) {
    error.value = err.message || '系統錯誤'
    console.error('API Error:', err)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchMembers()
}

const clearFilters = () => {
  searchKeyword.value = ''
  startDate.value = null
  endDate.value = null
  currentPage.value = 1
  fetchMembers()
}

const handleCreateShipment = async (member) => {
  try {
    // 檢查日期
    if (!formData.value.date) {
      alert('請先選擇出貨日期')
      return
    }

    isSubmitting.value = true

    const response = await fetch('/index.php/api/admin/shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        date: formData.value.date,
        memo: formData.value.memo,
        userId: member.id
      })
    })

    const result = await response.json()
    console.log('新增出貨回應:', result)

    if (result.status) {
      alert('新增成功')
      router.push('/backsite/shipping')
    } else {
      throw new Error(result.message || '新增失敗')
    }
  } catch (err) {
    console.error('新增出貨失敗:', err)
    alert(err.message || '系統錯誤')
  } finally {
    isSubmitting.value = false
  }
}

const handleDetailClick = async (member) => {
  try {
    console.log('會員資料:', member)
    
    // 建構帶有分頁參數的 URL
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString()
    }).toString()

    const response = await fetch(`/index.php/api/admin/shipment/order-summary/${member.id}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('網路回應不正確')
    }

    const result = await response.json()
    
    if (result.status) {
      items.value = result.data.items.map(item => ({
        stock: item.stock,         // 股東會
        productName: item.productName, // 紀念品名稱
        qty: item.qty             // 需求數量
      }))
      totalItems.value = result.data.total
      totalPages.value = result.data.totalPages
      currentPage.value = Number(result.data.page)
      
      selectedMember.value = member
      showDetailModal.value = true
    } else {
      throw new Error(result.message || '獲取資料失敗')
    }
  } catch (error) {
    console.error('獲取詳細資料失敗:', error)
    alert('獲取詳細資料失敗，請稍後再試')
  }
}

// 關閉彈跳視窗
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedMember.value = null
}

const changePage = (page) => {
  currentPage.value = page
  
  // 更新 URL 參數，保持其他查詢參數
  router.push({
    query: {
      ...route.query,
      page: page.toString()
    }
  })
  
  fetchMembers()
}

onMounted(() => {
  fetchMembers()
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

            <h2 class="text-2xl font-semibold text-gray-800 mb-6">新增</h2>

            <!-- 內容區域 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <!-- 出貨日期 -->
                <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">出貨日期</label>
                <input 
                    type="date" 
                    v-model="formData.date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                </div>

                <!-- 備註 -->
                <div class="col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-2">備註</label>
                <textarea 
                  v-model="formData.memo"
                  rows="3"
                  placeholder="請輸入備註"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
                </div>

                <!--todo 搜尋 -->
                <div class="col-span-full mb-6">
                  <div class="bg-[#8ADCE7] border border-[#0F93A2] rounded-xl p-6">
                    <div class="flex items-center gap-4">
                      <!-- 日期選擇區 -->
                      <div class="flex items-center gap-2">
                        <VueDatePicker
                          v-model="startDate"
                          :format="formatDate"
                          locale="zh-TW"
                          auto-apply
                          placeholder="選擇建立時間起"
                          :enable-time-picker="false"
                          :clearable="true"
                          :input-class-name="'w-[200px] h-12 text-sm bg-white border border-[#0F93A2] rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-teal-300'"
                        />

                        <VueDatePicker
                          v-model="endDate"
                          :format="formatDate"
                          locale="zh-TW"
                          auto-apply
                          placeholder="選擇建立時間迄"
                          :enable-time-picker="false"
                          :clearable="true"
                          :input-class-name="'w-[200px] h-12 text-sm bg-white border border-[#0F93A2] rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-teal-300'"
                        />
                      </div>

                      <!-- 搜尋輸入框 -->
                      <input 
                        v-model="searchKeyword"
                        class="w-[400px] h-12 bg-white border border-[#0F93A2] rounded-[12px] px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="會員名稱、股號、股名" 
                      />

                      <!-- 按鈕組 -->
                      <div class="flex items-center gap-2">
                        <button 
                          @click="clearFilters"
                          class="h-12 px-6 bg-[#004850] text-white rounded-[12px] hover:bg-[#003840] transition-colors duration-200"
                        >
                          清除條件
                        </button>

                        <button 
                          @click="handleSearch"
                          class="h-12 px-6 bg-[#0F93A2] text-white rounded-[12px] hover:bg-[#0d8291] transition-colors duration-200 flex items-center gap-2"
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

                <!-- 會員列表區域 -->
                <div class="shipping-table mt-4">
                  <!-- 表格標題 -->
                  <div class="shipping-header table-header">
                    <span class="shipping-user">會員名稱</span>
                    <span class="shipping-detail">詳細</span>
                    <span class="shipping-create">建立</span>
                  </div>

                  <div v-if="isLoading">
                    <Loading />
                  </div>
                  <div v-else>
                    <ErrorMsg 
                      v-if="error" 
                      :message="error"
                    />
                    <ErrorMsg 
                      v-else-if="searchResults.length === 0" 
                      message="查無相關資料"
                    />

                    <!-- 會員列表 -->
                    <template v-else>
                      <div v-for="(item, index) in searchResults" :key="item.id" class="shipping-item">
                        <div 
                          class="shipping-row"
                          :class="[
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                            'hover:bg-gray-100 transition-colors duration-150'
                          ]"
                        >
                          <span class="shipping-user">{{ item.memberName }}</span>
                          <span class="view-action">
                            <v-btn
                              icon="mdi-eye"
                              size="small"
                              variant="text"
                              @click="handleDetailClick(item)"
                            />
                          </span>
                          <span class="shipping-create">
                            <v-btn
                              icon="mdi-plus-circle"
                              size="small"
                              variant="text"
                              @click="handleCreateShipment(item)"
                            />
                          </span>
                        </div>
                      </div>

                      <!-- 分頁資訊 -->
                      <div class="mt-4">
                        <div class="flex justify-start w-full text-gray-500 text-sm mb-4">
                          共 {{ totalItems }} 筆
                        </div>
                        <v-pagination
                          v-if="totalPages > 1"
                          v-model="currentPage"
                          :length="totalPages"
                          :total-visible="7"
                          @update:model-value="changePage"
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
                    </template>
                  </div>
                </div>

                <!-- 修改彈窗內容 -->
                <div v-if="showDetailModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-medium">商品列表</h3>
                      <button 
                        @click="closeDetailModal"
                        class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <!-- 表格標題 -->
                    <div class="shipping-detail-header table-header mb-2">
                      <span>股東會</span>
                      <span>紀念品名稱</span>
                      <span>需求數量</span>
                    </div>

                    <!-- 表格內容 -->
                    <div class="shipping-detail-content">
                      <div 
                        v-for="(item, index) in paginatedItems" 
                        :key="index" 
                        class="shipping-detail-row"
                        :class="[
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                          'hover:bg-gray-100 transition-colors duration-150'
                        ]"
                      >
                        <span>{{ item.stock }}</span>
                        <span>{{ item.productName }}</span>
                        <span>{{ item.qty }}</span>
                      </div>
                    </div>

                    <!-- 分頁 -->
                    <div class="mt-4">
                      <div class="flex justify-start w-full text-gray-500 text-sm mb-4">
                        共 {{ items.length }} 筆
                      </div>
                      <v-pagination
                        v-if="totalDetailPages > 1"
                        v-model="currentDetailPage"
                        :length="totalDetailPages"
                        :total-visible="7"
                        @update:model-value="handleDetailPageChange"
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

                    <!-- 底部按鈕 -->
                    <div class="flex justify-end mt-6 pt-4 border-t border-gray-200">
                      <button 
                        @click="closeDetailModal"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                </div>
            </div>
  
              <!-- todo 按鈕區域 -->
              <div class="mt-6 flex justify-end space-x-4">
                <button 
                  @click="handleBack"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  返回
                </button>
                <!-- <button 
                  @click="handleSubmit"
                  :disabled="isSubmitting"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ isSubmitting ? '提交中...' : '新增' }}
                </button> -->
              </div>
          </div>
          <div v-if="errors.api" class="text-red-500 mt-2">
            {{ errors.api }}
          </div>
        </main>
      </div>
    </v-main>
  </v-layout>
  </template>

<style scoped>
.shipping-table {
  width: 312%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.shipping-row,
.shipping-header {
  display: grid;
  /* 修改為三欄布局 */
  grid-template-columns: 1fr 100px 100px;
  padding: 12px;
  align-items: center;
}

.shipping-row {
  border-bottom: 1px solid #ddd;
  transition: all 0.15s ease-in-out;
}

.shipping-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}

.loading-state, 
.error-message, 
.no-data {
  text-align: center;
  padding: 20px;
}

/* 對齊方式 */
.shipping-user {
  text-align: left;
}

.shipping-detail-header,
.shipping-detail-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  padding: 12px;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.shipping-detail-header {
  background-color: #f5f5f5;
  font-weight: bold;
}

.shipping-detail-row:last-child {
  border-bottom: none;
}

.shipping-detail-content {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

</style>