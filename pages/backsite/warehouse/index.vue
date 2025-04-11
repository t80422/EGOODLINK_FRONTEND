<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'


definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const warehouseData = ref([])
const totalItems = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const startDate = ref(null)
const endDate = ref(null)
const isLoading = ref(true)
const error = ref(null)
const router = useRouter()
const searchKeyword = ref('')

const formatDate = (date) => {
  if (!date) return null
  
  // 如果是 Date 物件，進行格式化
  if (date instanceof Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // 如果已經是字串格式，直接返回
  return date
}


const fetchWarehouseData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const formattedStartDate = startDate.value ? formatDate(startDate.value) : null
    const formattedEndDate = endDate.value ? formatDate(endDate.value) : null
    
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      ...(formattedStartDate && { startDate: formattedStartDate }),
      ...(formattedEndDate && { endDate: formattedEndDate }),
      ...(searchKeyword.value && { keyword: searchKeyword.value })
    }).toString()

    const response = await fetch(`/index.php/api/admin/product?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    
    if (result.status) {
      warehouseData.value = result.data.items
      totalItems.value = result.data.total
      totalPages.value = result.data.totalPage
      currentPage.value = Number(result.data.page) // 確保轉換為數字
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    error.value = '系統錯誤'
    console.error('API Error:', err)
  } finally {
    isLoading.value = false
  }
}

// 修改搜尋處理函數
const handleSearch = () => {
  // 更新 URL 參數
  router.push({
    query: {
      page: 1,
      startDate: startDate.value ? formatDate(startDate.value) : undefined,
      endDate: endDate.value ? formatDate(endDate.value) : undefined,
      keyword: searchKeyword.value || undefined
    }
  })
  
  currentPage.value = 1
  fetchWarehouseData()
}

const navigateToEdit = (id) => {
  // 保存搜尋條件到 localStorage
  const searchState = {
    page: currentPage.value,
    keyword: searchKeyword.value,
    startDate: startDate.value,
    endDate: endDate.value
  }
  localStorage.setItem('warehouseSearchState', JSON.stringify(searchState))
  
  router.push(`/backsite/warehouse/edit/${id}`)
}

const changePage = async (page) => {
  currentPage.value = page
  await fetchWarehouseData()
  
  // 更新 URL 參數
  router.push({
    query: {
      ...router.currentRoute.value.query,
      page: page.toString()
    }
  })
}

const clearFilters = () => {
  startDate.value = null
  endDate.value = null
  searchKeyword.value = ''
  currentPage.value = 1
  fetchWarehouseData()
}

const deleteWarehouse = async (id) => {
  if(!confirm('確定要刪除此紀念品資料嗎?')) {
    return;
  }

  try {
    const response = await fetch(`/index.php/api/admin/product/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    const result = await response.json();

    if(result.status) {
      // 刪除成功，重新載入資料
      alert('刪除成功');
      fetchWarehouseData();
    } else {
      alert(result.message || '刪除失敗');
    }
  } catch (err) {
    console.error('Delete API Error:', err);
    alert('系統錯誤，請稍後再試');
  }
}

onMounted(() => {
  // 檢查是否有儲存的搜尋狀態
  const savedState = localStorage.getItem('warehouseSearchState')
  
  if (savedState) {
    const state = JSON.parse(savedState)
    currentPage.value = state.page || 1
    searchKeyword.value = state.keyword || ''
    startDate.value = state.startDate || null
    endDate.value = state.endDate || null
    
    // 清除儲存的狀態
    localStorage.removeItem('warehouseSearchState')
  }
  
  fetchWarehouseData()
})
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
              title: '倉庫管理',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full warehouse-content">
            <!--todo 倉庫管理主要搜尋內容區塊 -->
            <div class="flex justify-between border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7] py-4 px-6">
              <div class="flex items-center gap-2">
                <!-- 建立時間起 -->
                <div class="w-[200px]">
                  <VueDatePicker
                    v-model="startDate"
                    :format="formatDate"
                    locale="zh-TW"
                    auto-apply
                    placeholder="選擇建立時間起"
                    :enable-time-picker="false"
                    :clearable="true"
                    :input-class-name="'h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white'"
                  />
                </div>

                <!-- 建立時間迄 -->
                <div class="w-[200px]">
                  <VueDatePicker
                    v-model="endDate"
                    :format="formatDate"
                    locale="zh-TW"
                    auto-apply
                    placeholder="選擇建立時間迄"
                    :enable-time-picker="false"
                    :clearable="true"
                    :input-class-name="'h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center justify-between bg-white'"
                  />
                </div>

                <!-- 搜尋框 -->
                <input 
                  v-model="searchKeyword"
                  @keyup.enter="handleSearch"
                  class="w-[360px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="股號、股名、紀念品名稱" 
                />

                <!-- 按鈕群組 -->
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

              <div class="flex items-center gap-4 ml-20">
                <!-- 新增按鈕 -->
                <router-link to="/backsite/warehouse/create" class="inline-block">
                  <button class="w-[140px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center transition-colors duration-200 hover:bg-[#0d8291]">
                    <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    新增資訊
                  </button>
                </router-link>

                <!-- 異動歷程按鈕 -->
                <router-link to="/backsite/warehouse/history">
                  <button class="w-[140px] h-[48px] bg-white text-[#0F93A2] border border-[#0F93A2] rounded-[12px] flex items-center justify-center transition-colors duration-200 hover:bg-gray-100">
                    <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                      <path d="M16.5 7.5L12 12" />
                    </svg>
                    異動歷程
                  </button>
                </router-link>

              </div>
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
                v-else-if="warehouseData.length === 0" 
                message="尚無倉庫資料"
              />
            </div>

          <div v-if="!isLoading && !error && warehouseData.length > 0" class="warehouse-table mt-10">
            <div class="warehouse-header table-header">
              <span class="stock-info">股東會</span>
              <span class="souvenir-name">紀念品名稱</span>
              <span class="souvenir-image">紀念品圖</span>
              <span class="creator">建立人</span>
              <span class="create-time">建立時間</span>
              <span class="modifier">修改人</span>
              <span class="modify-time">修改時間</span>
              <span class="edit">修改</span>
              <span class="delete">刪除</span>
            </div>

            <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
              <div v-for="(item, index) in warehouseData" :key="item.id" class="warehouse-item">
              <div 
                class="warehouse-row"
                :class="[
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  'hover:bg-gray-100 transition-colors duration-150'
                ]"
              >
                <span>{{ item.stock }}</span>
                <span>{{ item.name }}</span>
                <span><img :src="item.img" alt="紀念品圖片" class="w-16 h-16 object-cover" /></span>
                <span>{{ item.createdBy }}</span>
                <span>{{ item.createdAt }}</span>
                <span>{{ item.updatedBy || '-' }}</span>
                <span>{{ item.updatedAt || '-' }}</span>
                <span class="edit-action">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="navigateToEdit(item.id)"
                  />
                </span>
                <span class="delete-action">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    @click="deleteWarehouse(item.id)"
                  />
                </span>
              </div>
              </div>
            </div>
          </div>
        </div>
        <!-- <div class="mt-10">
          <span class="text-gray-700">共 {{ totalItems }} 筆資料</span>
        </div> -->

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

.container-main {
  padding: 20px;
  width: 100%;
}

.warehouse-search input {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.warehouse-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.warehouse-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 0.8fr 1fr 0.8fr 1fr 0.5fr 0.5fr;
  padding: 12px;
  border-bottom: 1px solid #ddd;
  align-items: center;
}

.warehouse-header {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 0.8fr 1fr 0.8fr 1fr 0.5fr 0.5fr;
}

.warehouse-row:hover {
  background-color: rgb(243 244 246) !important; /* 使用 !important 確保hover效果優先 */
  cursor: pointer;
}

.warehouse-status {
  text-align: center;
}

.warehouse-capacity {
  text-align: right;
  padding-right: 20px;
}

.dp__input {
  width: 100% !important;
  height: 48px !important;
  border-radius: 12px !important;
  border: 1px solid #0F93A2 !important;
}

.dp__input:focus {
  outline: none !important;
  box-shadow: 0 0 0 2px rgb(94 234 212) !important;
}

.dp__calendar_header,
.dp__calendar {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto !important;
}
</style>