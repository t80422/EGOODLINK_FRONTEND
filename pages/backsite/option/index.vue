<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const optionData = ref([])
const isLoading = ref(true)
const error = ref(null)

const router = useRouter()
const route = useRoute()

const navigateToEdit = (id) => {
  router.push(`/backsite/option/edit/${id}`)
}

const deleteContent = async (id) => {
  if (!confirm('確定要刪除嗎?')) {
    return
  }

  try {
    isLoading.value = true
    const response = await fetch(`/index.php/api/admin/locations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()
    
    if (result.status) {
      alert('刪除成功')
      // 重新載入據點列表
      await fetchOptionData()
    } else {
      throw new Error(result.message || '刪除失敗')
    }
  } catch (error) {
    console.error('刪除據點失敗:', error)
    alert(error.message || '系統發生錯誤')
  } finally {
    isLoading.value = false
  }
}

// 獲取據點列表
const fetchOptionData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetch('/index.php/api/admin/locations', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const result = await response.json()
    console.log('獲取據點列表:', result)

    if (result.status && result.data?.items) {
      optionData.value = result.data.items
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (error) {
    console.error('獲取據點列表失敗:', error)
    error.value = '系統發生錯誤'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchOptionData()
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
              title: '營運據點',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="option-management">

          <div class="flex justify-end w-full">
            <router-link 
              to="/backsite/option/create" 
              class="inline-block"
            >
            <button 
                class="add-btn bg-[#0F93A2] mt-3 mb-5 text-white px-4 py-2 rounded-lg flex items-center text-xs sm:text-sm md:text-base"
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
                新增據點
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
              v-else-if="optionData.length === 0" 
              message="尚無營運據點"
            />
          </div>

          <div v-if="!isLoading && !error && optionData.length > 0" class="option-table md:mt-5 mt-5">
            <div class="option-row table-header">
                <div class="option-name">名稱</div>
                <div class="option-image">圖</div>
                <div class="option-phone">電話</div>
                <div class="option-address">地址</div>
                <div class="option-line">Line</div>
                <div class="option-edit">編輯</div>
                <div class="option-delete">刪除</div>
            </div>

            <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
            <div v-for="(item, index) in optionData" :key="item.id" class="option-item">
              <div class="option-row" :class="[index % 2 === 0 ? 'bg-white' : 'bg-gray-50']">
                <div class="option-name">{{ item.name }}</div>
                <div class="option-image">
                  <img 
                    :src="item.imgUrl || '/images/no-image.jpg'" 
                    :alt="item.name"
                    class="location-img"
                  />
                </div>
                <div class="option-phone">{{ item.phone }}</div>
                <div class="option-address">{{ item.address }}</div>
                <div class="option-line">
                    <a v-if="item.lineLink" :href="item.lineLink" target="_blank" class="text-blue-500 hover:text-blue-700">
                        <v-icon icon="mdi-link" size="small" />
                    </a>
                    <span v-else>-</span>
                </div>
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
                    @click="deleteContent(item.id)"
                  />
                </span>
              </div>
            </div>
            </div>
            </div>
        </div>

        <div class="flex justify-start w-full text-gray-500 text-sm ">
          共 {{ optionData.length }} 筆
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
.location-img {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
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

.option-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  font-weight: bold;
}

.option-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 2fr 0.5fr 0.5fr 0.5fr;
    padding: 12px;
    align-items: center;
    border-bottom: 1px solid #ddd;
    transition: all 0.15s ease-in-out;
}

.location-img {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.option-line {
    text-align: center;
}

.option-image {
  display: flex;
  justify-content: center;
}

.option-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}

/* 新增文字對齊 */
.option-name,
.option-phone {
  text-align: center;
}

</style>