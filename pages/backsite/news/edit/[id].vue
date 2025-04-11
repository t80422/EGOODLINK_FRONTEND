<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const errorMessage = ref('')
const router = useRouter()
const route = useRoute()
const id = route.params.id
const errors = ref({})
const isSubmitting = ref(false)
const isLoading = ref(true)

// 表單數據
const formData = ref({
  title: '',
  content: ''
})

// 讀取資料
const fetchData = async () => {
  try {
    isLoading.value = true
    const response = await fetch(`/index.php/api/admin/news/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const result = await response.json()
    
    if (result.status) {
      formData.value = {
        title: result.data.title,
        content: result.data.content
      }
    } else {
      errorMessage.value = result.message || '讀取失敗'
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = '系統錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 表單驗證
const validateForm = () => {
  errors.value = {}
  if (!formData.value.title?.trim()) {
    errors.value.title = '標題為必填'
    return false
  }
  return true
}

// 提交表單
const handleSubmit = async () => {
  if (!validateForm()) return
  isSubmitting.value = true
  
  try {
    const response = await fetch(`/index.php/api/admin/news/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        title: formData.value.title,
        content: formData.value.content
      })
    })
    
    const result = await response.json()
    
    if (result.status) {
      alert('更新成功')
      router.push('/backsite/news')
    } else {
      errorMessage.value = result.message || '更新失敗'
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = '系統錯誤，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}

// 返回上一頁
const handleBack = () => {
  router.push('/backsite/news')
}

const handleBreadcrumbClick = (path) => {
  if (path) {
    router.push(path)
  }
}

// 麵包屑設定
const breadcrumbItems = [
  {
    title: '首頁',
    href: '/backsite',
    disabled: false
  },
  {
    title: '最新消息',
    href: '/backsite/news',
    disabled: false
  },
  {
    title: '編輯消息',
    disabled: true
  }
]

onMounted(() => {
  fetchData()
})
</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    <v-main>
    <div class="flex-1 flex flex-col">
      <main class="flex-1 pt-24 px-4 md:px-6">
        <div class="max-w-7xl mx-auto bg-white p-4 md:p-6">
          <!-- 麵包屑 -->
          <div class="mb-4 md:mb-6">
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

          <h2 class="text-lg md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">編輯消息</h2>

          <!-- 載入中 -->
          <div v-if="isLoading" class="flex justify-center items-center h-64 text-xs sm:text-sm md:text-base">
            <span class="text-gray-500">載入中...</span>
          </div>

          <!-- 表單內容 -->
          <div v-else class="grid grid-cols-1 gap-4 md:gap-6">
            <!-- 標題 -->
            <div class="col-span-1">
              <label class="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                標題
                <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                v-model="formData.title"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base"
                :class="{ 'border-red-500': errors.title }"
                placeholder="請輸入標題"
              >
              <p v-if="errors.title" class="mt-1 text-xs md:text-sm text-red-500">{{ errors.title }}</p>
            </div>

            <!-- 內容 -->
            <div class="col-span-1">
              <label class="block text-xs md:text-sm font-medium text-gray-700 mb-2">內容</label>
              <textarea 
                v-model="formData.content"
                rows="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base"
                placeholder="請輸入內容"
              ></textarea>
            </div>

            <div v-if="errorMessage" class="mt-4 text-center text-red-500 text-xs sm:text-sm md:text-base">
              {{ errorMessage }}
            </div>

            <!-- 按鈕 -->
            <div class="flex justify-end space-x-4 mt-4 md:mt-6">
              <button 
                @click="handleBack"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs sm:text-sm md:text-base"
              >
                返回
              </button>
              <button 
                @click="handleSubmit"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm md:text-base"
              >
                {{ isSubmitting ? '更新中...' : '更新' }}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </v-main>
</v-layout>
</template>