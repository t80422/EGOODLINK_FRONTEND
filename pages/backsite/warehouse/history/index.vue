<script setup>
import { ref, computed, watch,onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
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
    title: '異動歷程',
    disabled: true
  }
]

const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)
const error = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const historyList = ref([])

const startDate = ref(null);
const endDate = ref(null);
const modifyTypes = ref([
  { value: 1, label: '入庫' },
  { value: 2, label: '出庫' },
  { value: 3, label: '直接修改' }
])
const selectedModifyType = ref('')

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const isModifyTypeSelectOpen = ref(false)

const handleModifyTypeSelectClick = () => {
  isModifyTypeSelectOpen.value = !isModifyTypeSelectOpen.value
}

const handleModifyTypeSelectBlur = () => {
  isModifyTypeSelectOpen.value = false
}

const handleBack = () => {
  router.push('/backsite/warehouse')
}

const fetchHistoryList = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // 建立查詢參數
    const params = {
      page: currentPage.value || 1 ,
      ...(searchKeyword.value?.trim() && { keyword: searchKeyword.value.trim() }),
      ...(startDate.value && { startDate: formatDate(startDate.value) }),
      ...(endDate.value && { endDate: formatDate(endDate.value) }),
      ...(selectedModifyType.value && { type: selectedModifyType.value })
    }

    // 移除空值
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })

    const queryString = new URLSearchParams(params).toString()
    
    // 除錯用
    console.log('請求參數:', params)
    console.log('API URL:', `/index.php/api/admin/product/inventory-logs?${queryString}`)

    const response = await fetch(`/index.php/api/admin/product/inventory-logs?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()
    console.log('API回應:', result)

    if (result.status) {
      // 轉換資料格式
      historyList.value = result.data.items.map(item => ({
      date: item.time.split(' ')[0],        // ✓ 對應 time
      operator: item.user,                  // ✓ 對應 user
      stockInfo: {
        number: item.stock.split(' ')[0],   // ✓ 對應 stock 的前半部
        name: item.stock.split(' ')[1]      // ✓ 對應 stock 的後半部
      },
      itemName: item.productName,           // ✓ 對應 productName
      modifyType: item.type,                // ✓ 對應 type
      quantity: item.qty,                   // ✓ 對應 qty
      previousQuantity: item.beforeQty      // ✓ 對應 beforeQty
    }))
      
      // 更新分頁資訊
      currentPage.value = parseInt(result.data.page)
      totalPages.value = parseInt(result.data.totalPages)
      totalItems.value = parseInt(result.data.total)
    } else {
      throw new Error(result.message || '獲取資料失敗')
    }
  } catch (err) {
    error.value = err.message || '系統錯誤'
    console.error('API Error:', err)
    historyList.value = []
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchHistoryList()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchHistoryList()
}

// 清除條件函數
const clearFilters = () => {
  searchKeyword.value = ''
  startDate.value = null
  endDate.value = null
  selectedModifyType.value = ''
  currentPage.value = 1
  fetchHistoryList()
}

// 元件掛載時獲取資料
onMounted(() => {
  fetchHistoryList()
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

          <h2 class="text-2xl font-semibold text-gray-800 mb-6">異動歷程</h2>

          <!-- 異動歷程內容區域 -->
          <div class="bg-white rounded-lg">
            <div class="warehouse-header-container mb-2">

                <!--todo 倉庫管理主要搜尋內容區塊 -->
                <div class="border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7] py-4 px-6">
                <div class="flex justify-between items-center gap-4">
                    <!-- todo 建立時間起 -->
                    <div class="flex-1">
                    <VueDatePicker
                        v-model="startDate"
                        :format="formatDate"
                        locale="zh-TW"
                        auto-apply
                        placeholder="選擇日期起"
                        :enable-time-picker="false"
                        :clearable="true"
                        class="w-[360px]"
                        :input-class-name="'h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white'"
                    />
                    </div>

                    <!-- todo 建立時間迄 -->
                    <div class="flex-1">
                    <VueDatePicker
                        v-model="endDate"
                        :format="formatDate"
                        locale="zh-TW"
                        auto-apply
                        placeholder="選擇建立日期迄"
                        :enable-time-picker="false"
                        :clearable="true"
                        class="w-[360px]"
                        :input-class-name="'h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white'"
                    />
                    </div>
                    <!--todo 異動類型  -->
                    <div class="relative">
                        <select
                        v-model="selectedModifyType"
                        @click="handleModifyTypeSelectClick"
                        @blur="handleModifyTypeSelectBlur"
                        class="w-[360px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer pr-10"
                        >
                        <option value="">請選擇異動類型</option>
                        <option 
                            v-for="type in modifyTypes" 
                            :key="type.value"
                            :value="type.value"
                        >
                            {{ type.label }}
                        </option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F93A2]">
                        <svg 
                            class="fill-current h-4 w-4 transition-transform duration-200"
                            :class="{ 'rotate-180': !isModifyTypeSelectOpen }"
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20"
                        >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                        </svg>
                        </div>
                    </div>
                </div>

                <!-- todo 搜尋區域 -->
                <div class="mt-4 flex justify-between items-center gap-4">
                    <input 
                    v-model="searchKeyword"
                    class="w-[1400px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="股號、股名、紀念品名稱" 
                    />
                    <button 
                    @click="clearFilters"
                    class="w-[128px] h-[48px] bg-[#004850] text-white rounded-[12px] transition-colors duration-200 hover:bg-[#003840]"
                    >
                    清除條件
                    </button>

                    <button 
                    @click="handleSearch"
                    class="w-[128px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center gap-1 transition-colors duration-200 hover:bg-[#0d8291]"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    搜尋
                    </button>
                </div>
                </div>

                <!-- <div class="flex items-center justify-between bg-white py-4 rounded-lg mt-5">
                <div class="flex items-center space-x-4 text-gray-700">
                    <span 
                    v-for="item in ['時間','股名', '股號', '操作人員', '操作類型']" 
                    :key="item"
                    @click="handleItemClick(item)"
                    class="flex items-center cursor-pointer"
                    :class="{ 'text-blue-500': activeItem === item }"
                    >
                    <template v-if="activeItem === item">
                        <svg 
                        class="w-5 h-5 mr-1" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        :stroke="activeItem === item ? '#3B82F6' : 'currentColor'"
                        >
                        <path 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            stroke-width="2" 
                            :d="sortOrder === 'ASC' 
                            ? 'M3 4h13M16 4l-4 4m0 0l-4-4m4 4v13'
                            : 'M3 4h13M16 4l-4-4m0 0l-4 4m4-4v13'"
                        />
                        </svg>
                    </template>
                    {{ item }}
                    </span>
                </div>
                </div> -->

                 <!-- 新增載入中狀態 -->
                  <div v-if="isLoading" class="text-center py-4">
                    載入中...
                  </div>
                  
                  <!-- 新增錯誤訊息 -->
                  <div v-if="error" class="text-red-500 text-center py-4">
                    {{ error }}
                  </div>

                <!-- 表格容器 -->
                <div class="mt-4 bg-white rounded-lg overflow-hidden border border-gray-200">
                  <div v-if="isLoading" class="text-center py-4">
                    載入中...
                  </div>

                  <!-- 錯誤提示 -->
                  <div v-if="error" class="text-red-500 text-center py-4">
                    {{ error }}
                  </div>

                <!-- 表格標題列 -->
                <div v-if="!isLoading && !error" class="warehouse-table">
                    <div class="warehouse-header table-header">
                      <span class="date">日期</span>
                      <span class="operator">操作人員</span>
                      <span class="stock-info">股號+股名</span>
                      <span class="souvenir-name">紀念品名稱</span>
                      <span class="modify-type">異動類型</span>
                      <span class="quantity text-end">數量</span>
                      <span class="previous-quantity text-end">異動前數量</span>
                    </div>

                     <!-- 無資料提示 -->
                    <div v-if="historyList.length === 0" class="text-center py-4 text-gray-500">
                      尚無異動紀錄
                    </div>

                    <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
                    <div v-for="(item, index) in historyList" :key="item.date + item.operator" class="warehouse-item">
                    <div 
                        class="warehouse-row"
                        :class="[
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                        'hover:bg-gray-100 transition-colors duration-150'
                        ]"
                    >
                        <span>{{ item.date }}</span>
                        <span>{{ item.operator }}</span>
                        <span>{{ item.stockInfo.number }} {{ item.stockInfo.name }}</span>
                        <span>{{ item.itemName }}</span>
                        <span>
                        <span 
                            :class="{
                            'px-2 py-1 rounded-full text-xs font-medium': true,
                            'bg-green-100 text-green-800': item.modifyType === '入庫',
                            'bg-red-100 text-red-800': item.modifyType === '出庫',
                            'bg-blue-100 text-blue-800': item.modifyType === '直接修改'
                            }"
                        >
                            {{ item.modifyType }}
                        </span>
                        </span>
                        <span class="text-right">{{ item.quantity }}</span>
                        <span class="text-right">{{ item.previousQuantity }}</span>
                    </div>
                    </div>
                    </div>
                    <!-- 分頁 -->
                      <div class="flex justify-between items-center mt-4 px-4">
                        <div class="text-sm text-gray-500">
                          共 {{ totalItems }} 筆資料
                        </div>
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
          </div>
          <!-- 按鈕區域 -->
          <div class="mt-6 flex justify-end space-x-4">
            <button 
              @click="handleBack"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              返回
            </button>
          </div>
        </div>
      </main>
    </div>
  </v-main>
</v-layout>
</template>

<style scoped>
.warehouse-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  /* font-weight: bold; */
}

.warehouse-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 1.5fr 1fr 0.8fr 0.8fr;
  padding: 12px;
  border-bottom: 1px solid #ddd;
  align-items: center;
}

.warehouse-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 1.5fr 1fr 0.8fr 0.8fr;
}

.warehouse-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}
</style>