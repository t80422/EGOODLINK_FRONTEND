<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRoute,useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const newsData = ref([])
const keyword = ref('')
const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(3)

const searchContent = () => {
  // 實作搜尋邏輯
}

// 獲取消息列表
const fetchNewsData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetch('/index.php/api/news')
    const result = await response.json()

    if (result.status) {
      newsData.value = result.data
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    console.error('獲取消息列表失敗:', err)
    error.value = '系統錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 頁面載入時獲取資料
onMounted(() => {
  fetchNewsData()
})

const route = useRoute()
const router = useRouter()

const navigateToEdit = (id) => {
  router.push(`/backsite/news/edit/${id}`)
}

const deleteNews = async (id) => {
  if(!confirm('確定要刪除嗎?')) return
    
  try {
    isLoading.value = true
    
    const response = await fetch(`/index.php/api/admin/news/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()

    if (result.status) {
      await fetchNewsData()
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

const changePage = (page) => {
  currentPage.value = page
  // 實作換頁邏輯
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
              title: '最新消息',
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

        <div class="news-management">

          <div class="flex justify-end w-full">
            <router-link 
              to="/backsite/news/create" 
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
              新增消息
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
            v-else-if="newsData.length === 0" 
            message="尚無最新消息"
          />
        </div>

          <div v-if="!isLoading && !error && newsData.length > 0" class="news-table md:mt-5 mt-5">
            <div class="news-row table-header text-sm md:text-base">
              <div class="news-date">日期</div>
              <div class="news-title">標題</div>
              <div class="news-content">內容</div>
              <div class="news-edit">編輯</div>
              <div class="news-delete">刪除</div>
            </div>

            <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
            <div v-for="(item, index) in newsData" :key="item.id" class="news-item">
              <div 
                class="news-row text-xs sm:text-sm md:text-base"
                :class="[
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  'hover:bg-gray-100 transition-colors duration-150'
                ]"
              >
                <div class="news-date">{{ item.date }}</div>
                <div class="news-title">{{ item.title }}</div>
                <div class="news-content">{{ item.content }}</div>
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
                    @click="deleteNews(item.id)"
                  />
                </span>
              </div>
            </div>
            </div>
          </div>
        </div>
        <div class="flex justify-start w-full text-gray-500 text-sm">
          共 {{ newsData.length }} 筆
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
          class="mt-4 d-flex justify-center"
        /> -->
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

.news-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  font-weight: bold;
}

.news-row,
.news-header {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 0.4fr 0.4fr;
  padding: 8px;
  align-items: center;
  gap: 4px;
}

.news-edit-header,
.news-delete-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.news-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 0.5fr 0.5fr;
  padding: 12px;
  align-items: center;
  border-bottom: 1px solid #ddd;
  transition: all 0.15s ease-in-out;
}

.news-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}

.news-title,
.news-content,
.news-date {
  text-align: left;
}

@media (max-width: 640px) {
  .news-edit .v-btn,
  .news-delete .v-btn {
    transform: scale(0.8);
    justify-content: end;
  }
}

@media (min-width: 768px) {
  .news-row,
  .news-header {
    grid-template-columns: 1.5fr 1fr 3fr 0.5fr 0.5fr;
    padding: 12px;
    gap: 8px;
  }
}

</style>