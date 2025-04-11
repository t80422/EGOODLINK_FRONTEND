<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const searchKeyword = ref('')
const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(5)
const startDate = ref(null);
const endDate = ref(null);
const router = useRouter()
const route = useRoute()
const totalItems = ref(0)

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const navigateToEdit = (id) => {
  // 保存搜尋條件到 localStorage
  const searchState = {
    page: currentPage.value,
    keyword: searchKeyword.value,
    startDate: startDate.value,
    endDate: endDate.value
  }
  localStorage.setItem('purchaseSearchState', JSON.stringify(searchState))
  
  router.push(`/backsite/purchase/edit/${id}`)
}

const purchaseData = ref([
])

// 分頁處理
const changePage = (page) => {
  // 更新當前頁碼
  currentPage.value = page
  
  // 更新 URL 參數，保持其他查詢參數
  router.push({
    query: {
      ...route.query,
      page: page.toString()
    }
  })
  
  // 獲取資料
  fetchPurchaseList()
}

const handleSearch = () => {
  // 更新 URL 參數
  router.push({
    query: {
      page: 1,
      keyword: searchKeyword.value || undefined,
      startDate: startDate.value ? formatDate(startDate.value) : undefined,
      endDate: endDate.value ? formatDate(endDate.value) : undefined
    }
  })
  
  currentPage.value = 1
  fetchPurchaseList()
}

const fetchPurchaseList = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      ...(searchKeyword.value?.trim() && { keyword: searchKeyword.value.trim() }),
      ...(startDate.value && { startDate: formatDate(startDate.value) }),
      ...(endDate.value && { endDate: formatDate(endDate.value) })
    }).toString()
    
    console.log('API URL:', `/index.php/api/admin/purchase?${queryParams}`)

    const response = await fetch(`/index.php/api/admin/purchase?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    
    if (result.status && result.data) {
      purchaseData.value = result.data.items
      currentPage.value = parseInt(result.data.page)
      totalPages.value = parseInt(result.data.totalPages)
      totalItems.value = parseInt(result.data.total)
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

// 清除過濾條件
const clearFilters = () => {
  currentPage.value = 1
  searchKeyword.value = ''
  startDate.value = null
  endDate.value = null
  fetchPurchaseList()
}

const deletePurchase = async (id) => {
  if(confirm('確定要刪除嗎?')) {
    try {
      const response = await fetch(`/index.php/api/admin/purchase/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.status) {
        // 重新載入列表
        fetchPurchaseList()
        alert('刪除成功')
      } else {
        alert(result.message || '刪除失敗')
      }
    } catch (err) {
      console.error('Delete Error:', err)
      alert('刪除失敗，請稍後再試')
    }
  }
}

onMounted(() => {
  // 檢查是否有儲存的搜尋狀態
  const savedState = localStorage.getItem('purchaseSearchState')
  
  if (savedState) {
    const state = JSON.parse(savedState)
    currentPage.value = state.page || 1
    searchKeyword.value = state.keyword || ''
    startDate.value = state.startDate || null
    endDate.value = state.endDate || null
    
    // 清除儲存的狀態
    localStorage.removeItem('purchaseSearchState')
  } else {
    // 如果沒有儲存狀態，則使用 URL 參數
    const { page, keyword, startDate: urlStartDate, endDate: urlEndDate } = route.query
    currentPage.value = parseInt(page) || 1
    searchKeyword.value = keyword || ''
    startDate.value = urlStartDate || null
    endDate.value = urlEndDate || null
  }
  
  fetchPurchaseList()
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
              title: '進貨管理',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full purchase-content">
        <!--todo 進貨主要搜尋內容區塊 -->
        <div class="flex justify-between border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7] py-4 px-6">
          <!-- todo 搜尋區域 -->
          <div class="flex justify-between items-center gap-4">
            <input 
              v-model="searchKeyword"
              class="w-[250px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="搜尋股號、股名、紀念品名稱" 
            />

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
            </div>

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

          <div class="flex gap-4 ml-20">
            <!-- 新增按鈕 -->
            <router-link 
              to="/backsite/purchase/create" 
              class="inline-block"
            >
              <button 
                class="w-[180px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center transition-colors duration-200 hover:bg-[#0d8291]"
              >
                <svg 
                  class="w-5 h-5 mr-2" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新增進貨單
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
              v-else-if="purchaseData.length === 0" 
              message="尚無資料"
            />
          </div>

          <div v-if="!isLoading && !error && purchaseData.length > 0" class="purchase-table mt-10">
            <div class="purchase-header table-header">
              <span>進貨編號</span>
              <span>日期</span>
              <span>備註</span>
              <span>修改</span>
              <span>刪除</span>
            </div>

            <div class="scroll-content" style="overflow-y: auto; height: 55vh;">
              <div v-for="(item, index) in purchaseData" :key="item.id" class="purchase-item">
                  <div 
                      class="purchase-row"
                      :class="[
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                          'hover:bg-gray-100 transition-colors duration-150'
                      ]"
                  >
                      <span class="purchase-id">{{ item.id }}</span>
                      <div class="purchase-date">{{ item.date }}</div>
                      <div class="purchase-memo">{{ item.memo }}</div>
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
                          @click="deletePurchase(item.id)"
                        />
                      </span>
                  </div>
              </div>
            </div>
          </div>
        </div>

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

.container-main {
  padding: 20px;
  width: 100%;
}

.purchase-search input {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.purchase-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.purchase-header,
.purchase-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 0.5fr 0.5fr;
    padding: 12px;
    align-items: center;
}

.purchase-row {
  border-bottom: 1px solid #ddd;
  transition: all 0.15s ease-in-out;
}

.purchase-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}

.loading-state, 
.error-message, 
.no-data {
  text-align: center;
  padding: 20px;
}

.purchase-status {
  text-align: center;
}

.purchase-total {
  text-align: right;
  padding-right: 20px;
}

</style>