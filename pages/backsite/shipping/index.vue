<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const searchKeyword = ref('')

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(5)

const startDate = ref(null);
const endDate = ref(null);

const shippingData = ref([])
const totalItems = ref(0)

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// 新增搜尋函數
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
  searchShipping()
}

// 搜尋出貨列表
const searchShipping = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString(),
      ...(searchKeyword.value && { keyword: searchKeyword.value }),
      ...(startDate.value && { startDate: formatDate(startDate.value) }),
      ...(endDate.value && { endDate: formatDate(endDate.value) })
    }).toString()
    
    console.log('API URL:', `/index.php/api/admin/shipment?${queryParams}`)

    const response = await fetch(`/index.php/api/admin/shipment?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    
    if (result.status && result.data) {
      shippingData.value = result.data.items
      currentPage.value = parseInt(result.data.page)
      totalPages.value = parseInt(result.data.totalPages)
      totalItems.value = parseInt(result.data.total)
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    error.value = '系統錯誤'
    console.error('API Error:', err)
    shippingData.value = []
  } finally {
    isLoading.value = false
  }
}

const clearFilters = () => { 
  searchKeyword.value = ''
  startDate.value = null
  endDate.value = null
  currentPage.value = 1
  searchShipping()
}

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
  
  // 執行搜尋
  searchShipping()
}

const navigateToEdit = (id) => {
  // 保存搜尋條件
  const searchState = {
    page: currentPage.value,
    keyword: searchKeyword.value,
    startDate: startDate.value,
    endDate: endDate.value
  }
  localStorage.setItem('shippingSearchState', JSON.stringify(searchState))
  
  router.push(`/backsite/shipping/edit/${id}`)
}

const deleteShipping = async (id) => {
  if (!confirm('確定要刪除此出貨資料？')) return
  
  try {
    const response = await fetch(`/index.php/api/admin/shipment/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    
    if (result.status) {
      searchShipping()
    } else {
      throw new Error(result.message || '刪除失敗')
    }
  } catch (err) {
    console.error('刪除失敗:', err)
    error.value = err.message || '系統錯誤'
  }
}

onMounted(() => {
  searchShipping()
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
              title: '出貨作業',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full shipping-content">
            <!--todo 出貨作業主要搜尋內容區塊 -->
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
                  class="w-[400px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="出貨單號、會員名稱、電話" 
                />

                <!-- 按鈕群組 -->
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

              <div class="flex items-center gap-4 ml-20">
                <!-- 新增按鈕 -->
                <router-link 
                  to="/backsite/shipping/create" 
                  class="inline-block"
                >
                  <button 
                    class="w-[120px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center transition-colors duration-200 hover:bg-[#0d8291]"
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
                    新增
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
                v-else-if="shippingData.length === 0" 
                message="尚無出貨資料"
              />
            </div>

          <div v-if="!isLoading && !error && shippingData.length > 0" class="shipping-table mt-10">
            <div class="shipping-header table-header">
              <span>出貨單號</span>
              <span>日期</span>
              <span>會員名稱</span>
              <span>電話</span>
              <span>備註</span>
              <span>建立日期</span>
              <span class="edit">修改</span>
              <span class="delete">刪除</span>
            </div>

            <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
              <div v-for="(item, index) in shippingData" :key="item.id" class="shipping-row">
                <span>{{ item.number }}</span>
                <span>{{ item.date }}</span>
                <span>{{ item.userName }}</span>
                <span>{{ item.phone }}</span>
                <span>{{ item.memo }}</span>
                <span>{{ item.createdAt }}</span>
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
                    @click="deleteShipping(item.id)"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-start w-full text-gray-500 text-sm">
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

.shipping-search input {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.shipping-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.shipping-row,
.shipping-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr 1.2fr 0.6fr 0.6fr;
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

/* 所有資料欄位置中對齊 */
.shipping-id,
.shipping-date,
.shipping-creator,
.shipping-create-time,
.shipping-modifier,
.shipping-modify-time,
.shipping-actions {
  text-align: left;
}
</style>