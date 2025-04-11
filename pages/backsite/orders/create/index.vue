<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const breadcrumbItems = [
  {
    title: '首頁',
    href: '/backsite',
    disabled: false
  },
  {
    title: '訂單管理',
    href: '/backsite/orders',
    disabled: false
  },
  {
    title: '列印領貨用表單',
    disabled: true
  }
]

const router = useRouter()

const isSortSelectOpen = ref(false)

const handleSortSelectClick = () => {
  isSortSelectOpen.value = !isSortSelectOpen.value
}

const handleSortSelectBlur = () => {
  isSortSelectOpen.value = false
}

// 列表資料
const orders = ref([
  {
    id: 1,
    selected: false,
    stockNumber: '2330',
    stockName: '台積電',
    gift: '環保購物袋',
    giftImage: '/images/gift1.jpg',
    status: '已領取'
  },
  {
    id: 2,
    selected: false,
    stockNumber: '2330',
    stockName: '台積電',
    gift: '環保購物袋',
    giftImage: '/images/gift1.jpg',
    status: '已領取'
  }
])

// 搜尋條件
const searchQuery = ref('')

// 全選狀態
const selectAll = ref(false)

// 處理全選/取消全選
const handleSelectAll = () => {
  const newValue = selectAll.value
  orders.value.forEach(order => {
    order.selected = newValue
  })
}

// 監聽個別勾選狀態
watch(orders, (newValue) => {
  // 只在所有項目都被選中時，才設置全選狀態為 true
  const allSelected = newValue.every(order => order.selected)
  if (selectAll.value !== allSelected) {
    selectAll.value = allSelected
  }
}, { deep: true })


// 排序
const sortBy = ref('stockNumber')
const sortDesc = ref(false)

// 搜尋功能
const filteredOrders = computed(() => {
  return orders.value.filter(order => 
    order.stockNumber.includes(searchQuery.value) ||
    order.stockName.includes(searchQuery.value)
  )
})

// 列印功能
const handlePrint = () => {
  const selectedOrders = orders.value.filter(order => order.selected)
  // 實作列印邏輯
}

const handleBack = () => {
  router.push('/backsite/orders')
}

</script>

<template>
    <div class="min-h-screen bg-white w-full flex">
      <Sidebar />
      <div class="flex-1 flex flex-col">
        <Header />
        <main class="flex-1 pt-24 px-6">
          <div class="max-w-7xl mx-auto bg-white p-6">
            <!-- 麵包屑 -->
            <div class="mb-6">
              <v-breadcrumbs
                :items="breadcrumbItems"
                divider="/"
                class="mb-4 bg-white rounded-lg shadow-sm p-3 relative z-50"
              >
                <template v-slot:divider>
                  <v-icon icon="mdi-chevron-right"></v-icon>
                </template>
              </v-breadcrumbs>
            </div>

            <h2 class="text-2xl font-semibold text-gray-800 mb-6">列印領貨用表單</h2>

            <!-- 搜尋和功能區 -->
            <div class="mb-6 grid grid-cols-12 gap-4 items-center">
              <!-- 搜尋框 -->
              <div class="col-span-5">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜尋股號或股名"
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <!-- 排序選擇 -->
              <div class="col-span-5 relative">
                <select
                  v-model="sortBy"
                  @click="handleSortSelectClick"
                  @blur="handleSortSelectBlur"
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer pr-10"
                >
                  <option value="stockNumber">依股號</option>
                  <option value="stockName">依股名</option>
                  <option value="status">依狀態</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg 
                    class="fill-current h-4 w-4 transition-transform duration-200"
                    :class="{ 'rotate-180': !isSortSelectOpen }"
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>

              <!-- 列印按鈕 -->
              <div class="col-span-2">
                <button 
                  @click="handlePrint"
                  class="w-full bg-[#0F93A2] text-white px-4 py-2 rounded-lg hover:bg-[#0d8291] flex items-center justify-center"
                >
                  <v-icon icon="mdi-printer" class="mr-2" size="small" />
                  列印
                </button>
              </div>
            </div>

            <!-- 表格區域 -->
            <div v-if="!isLoading && !error && orders.length > 0" class="warehouse-table">
              <div class="warehouse-header">
                <span class="checkbox">
                  <input 
                    type="checkbox" 
                    v-model="selectAll"
                    @change="handleSelectAll"
                    class="rounded" 
                  />
                </span>
                <span class="stock-number">股號</span>
                <span class="stock-name">股名</span>
                <span class="gift-name ">紀念品</span>
                <span class="gift-image ">紀念品圖片</span>
                <span class="status">狀態</span>
              </div>

              <div v-for="(order, index) in filteredOrders" :key="order.id" class="warehouse-item">
                <div 
                  class="warehouse-row"
                  :class="[
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                    'hover:bg-gray-100 transition-colors duration-150'
                  ]"
                >
                  <span class="checkbox">
                    <input type="checkbox" v-model="order.selected" class="rounded" />
                  </span>
                  <span class="stock-number">{{ order.stockNumber }}</span>
                  <span class="stock-name">{{ order.stockName }}</span>
                  <span class="gift-name">{{ order.gift }}</span>
                  <span class="gift-image">
                    <img 
                      :src="order.giftImage" 
                      class="w-16 h-16 object-cover rounded"
                      alt="紀念品圖片"
                    />
                  </span>
                  <span class="status">{{ order.status }}</span>
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
    </div>
  </template>

<style scoped>
.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.warehouse-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.warehouse-header {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.5fr 1.5fr 1fr 0.8fr 0.8fr;
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: 500;
  border-bottom: 1px solid #ddd;
}

.warehouse-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.5fr 1.5fr 1fr 0.8fr 0.8fr;
  padding: 12px;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.warehouse-row:last-child {
  border-bottom: none;
}

.warehouse-row:hover {
  @apply bg-gray-50 transition-colors duration-150;
}

.text-end {
  text-align: right;
}

.checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
}

.gift-image {
  display: flex;
  justify-content: center;
}

.status {
  text-align: center;
}
</style>