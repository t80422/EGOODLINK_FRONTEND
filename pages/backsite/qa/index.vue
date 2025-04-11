<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const qaData = ref([])
const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalItems = ref(0)

const changePage = (page) => {
  currentPage.value = page
  // 實作換頁邏輯
}

// 獲取 QA 列表
const fetchQaData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetch('/index.php/api/qa')
    const result = await response.json()

    if (result.status) {
      qaData.value = result.data
      
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    console.error('獲取 QA 列表失敗:', err)
    error.value = '系統錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 刪除 QA
const deleteQa = async (id) => {
  if(!confirm('確定要刪除嗎?')) return
    
  try {
    isLoading.value = true
    const response = await fetch(`/index.php/api/admin/qa/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()

    if (result.status) {
      await fetchQaData()
      alert('刪除成功')
    } else {
      alert(result.message || '刪除失敗')
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('系統錯誤，請稍後再試')
  } finally {
    isLoading.value = false
  }
}

// 頁面載入時獲取資料
onMounted(() => {
  fetchQaData()
})

const route = useRoute()
const router = useRouter()

const navigateToEdit = (id) => {
  router.push(`/backsite/qa/edit/${id}`)
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
              title: '常見問題',
              disabled: true
            }
          ]"
          divider="/"
          class="text-xs sm:text-sm md:text-base"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right" class="text-sm md:text-base"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="qa-management">
          <div class="flex justify-end w-full">
            <router-link 
              to="/backsite/qa/create" 
              class="inline-block"
            >
              <button 
                class="add-btn bg-[#0F93A2] mt-3 mb-5 text-white px-4 py-2 rounded-lg flex items-center text-xs sm:text-sm md:text-base"
              >
                <svg 
                  class="w-4 h-4 md:w-5 md:h-5 mr-2" 
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
                新增問題
              </button>
            </router-link>
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
              v-else-if="qaData.length === 0" 
              message="尚無常見問題"
            />
          </div>

            <div v-if="!isLoading && !error && qaData.length > 0" class="qa-table md:mt-5 mt-5">
              <div class="qa-header table-header text-sm md:text-base">
                <span class="qa-date-header">日期</span>
                <span class="qa-title-header">標題</span>
                <span class="qa-content-header">內容</span>
                <span class="qa-edit-header">編輯</span>
                <span class="qa-delete-header">刪除</span>
              </div>

              <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
                <div v-for="(item, index) in qaData" :key="item.id" class="qa-item">
                  <div 
                    class="qa-row text-xs sm:text-sm md:text-base"
                    :class="[
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                      'hover:bg-gray-100 transition-colors duration-150'
                    ]"
                  >
                    <div class="qa-date">{{ item.date }}</div>
                    <div class="qa-title">{{ item.title }}</div>
                    <div class="qa-content">{{ item.content }}</div>
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
                        @click="deleteQa(item.id)"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </div>
        <div class="flex justify-start w-full text-gray-500 text-sm">
          共 {{ qaData.length }} 筆
        </div>
        <!-- <v-pagination
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
          class="mt-4 flex justify-center scale-75 sm:scale-90 md:scale-100"
        /> -->
      </div>
    </v-main>
  </v-layout>
</template>

<style scoped>
@media (max-width: 640px) {
  .qa-edit .v-btn,
  .qa-delete .v-btn {
    transform: scale(0.8);
    justify-content: end;
  }
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

.container-main {
  padding: 20px;
  width: 100%;
}

.qa-search input {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.qa-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.qa-row,
.qa-header {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 0.4fr 0.4fr;
  padding: 8px;
  align-items: center;
  gap: 4px;
}

@media (min-width: 768px) {
  .qa-row,
  .qa-header {
    grid-template-columns: 1.5fr 1fr 3fr 0.5fr 0.5fr;
    padding: 12px;
    gap: 8px;
  }
}

.qa-row {
  border-bottom: 1px solid #ddd;
  transition: all 0.15s ease-in-out;
}

.qa-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}

.qa-title,
.qa-content,
.qa-date {
  text-align: left;
}
</style>