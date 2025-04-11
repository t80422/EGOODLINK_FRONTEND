<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})
const router = useRouter()
// 查看詳細資料
const viewDetails = (id) => {
  router.push(`/backsite/orders/${id}`)
}

const isLoading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(5)

const isLocationSelectOpen = ref(false)
const isStatusSelectOpen = ref(false)

const handleLocationSelectClick = () => {
  isLocationSelectOpen.value = !isLocationSelectOpen.value
}

const handleStatusSelectClick = () => {
  isStatusSelectOpen.value = !isStatusSelectOpen.value
}

const handleLocationSelectBlur = () => {
  isLocationSelectOpen.value = false
}

const handleStatusSelectBlur = () => {
  isStatusSelectOpen.value = false
}

const changePage = (page) => {
  currentPage.value = page
  // 實作換頁邏輯
}

const locations = ref([
  { value: '台北總部', label: '台北總部' },
  { value: '新竹分部', label: '新竹分部' },
  { value: '台中分部', label: '台中分部' }
])

const statusOptions = ref([
  { value: '正常', label: '正常' },
  { value: '停用', label: '停用' }
])

// 新增選擇值
const selectedLocation = ref('')
const selectedStatus = ref('')

const ordersData = ref([
  {
    id: '001',
    name: '張小明',
    location: '台北總部',
    phone: '0912-345-678',
    status: '正常',
  },
  {
    id: '002',
    name: '王小華',
    location: '新竹分部',
    phone: '0923-456-789',
    status: '停用',
  },
  {
    id: '003',
    name: '李小菁',
    location: '台中分部',
    phone: '0934-567-890',
    status: '正常',
  }
])
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
              title: '訂單管理',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full orders-content">
            <!--todo 訂單主要搜尋內容區塊 -->
            <div class="flex justify-between border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7] py-4 px-6">
              <div class="flex items-center gap-2">
                <input 
                  v-model="searchKeyword"
                  class="w-[200px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="姓名、電話" 
                />
                
                <div class="relative">
                  <select
                    v-model="selectedLocation"
                    @click="handleLocationSelectClick"
                    @blur="handleLocationSelectBlur"
                    class="w-[200px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer pr-10"
                  >
                    <option value="">請選擇據點</option>
                    <option 
                      v-for="location in locations" 
                      :key="location.value"
                      :value="location.value"
                    >
                      {{ location.label }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F93A2]">
                    <svg 
                      class="fill-current h-4 w-4 transition-transform duration-200"
                      :class="{ 'rotate-180': !isLocationSelectOpen }"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                    </svg>
                  </div>
                </div>

                <div class="relative">
                  <select
                      v-model="selectedStatus"
                      @click="handleStatusSelectClick"
                      @blur="handleStatusSelectBlur"
                      class="w-[200px] h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer pr-10"
                    >
                    <option value="">請選擇狀態</option>
                    <option 
                      v-for="status in statusOptions" 
                      :key="status.value"
                      :value="status.value"
                    >
                      {{ status.label }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F93A2]">
                    <svg 
                      class="fill-current h-4 w-4 transition-transform duration-200"
                      :class="{ 'rotate-180': !isStatusSelectOpen }"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                    </svg>
                  </div>
                </div>

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

              <div class="flex gap-4 ml-20">
                <router-link 
                  to="/backsite/orders/create" 
                  class="inline-block"
                >
                  <button 
                    class="w-[180px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center transition-colors duration-200 hover:bg-[#0d8291]"
                  >
                    <v-icon 
                      icon="mdi-printer" 
                      class="mr-2"
                      size="small"
                    />
                    列印領貨用表單
                  </button>
                </router-link>
              </div>
            </div>


          <div v-if="isLoading" class="loading-state">
            載入中...
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="!isLoading && !error && ordersData.length === 0" class="no-data">
            尚無訂單資料
          </div>

          <div class="order-list mt-10">
            <div class="order-header table-header">
              <span class="order-name">姓名</span>
              <span class="order-location">據點</span>
              <span class="order-phone">電話</span>
              <span class="order-status">狀態</span>
              <span class="order-detail">明細</span>
            </div>

            <div v-for="(item, index) in ordersData" :key="item.id" class="order-item">
              <div 
                class="order-row"
                :class="[
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  'hover:bg-gray-100 transition-colors duration-150'
                ]"
              >
                <div class="order-name">{{ item.name }}</div>
                <div class="order-location">{{ item.location }}</div>
                <div class="order-phone">{{ item.phone }}</div>
                <div class="order-status">{{ item.status }}</div>
                <div class="order-detail">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewDetails(item.id)"
                  />
                </div>
              </div>
            </div>
          </div>
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
    </v-main>
  </v-layout>
</template>

<style scoped>
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

.order-list {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.order-row,
.order-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  padding: 12px;
  align-items: center;
}

.order-row {
  border-bottom: 1px solid #ddd;
  transition: all 0.15s ease-in-out;
}

.order-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}

.order-state {
  text-align: center;
}

.order-amount {
  text-align: right;
  padding-right: 20px;
}

.container-main {
  padding: 20px;
  width: 100%;
}

.orders-search input {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.loading-state, 
.error-message, 
.no-data {
  text-align: center;
  padding: 20px;
}
</style>