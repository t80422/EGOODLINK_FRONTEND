<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const id = route.params.id
const errors = ref({})
const isSubmitting = ref(false)
const previewImage = ref(null)
const isLoading = ref(true)

// 表單數據
const formData = ref({
  name: '',
  image: null,
  phone: '',
  address: '',
  lineLink: ''
})

const fetchData = async () => {
  try {
    isLoading.value = true
    const response = await fetch(`/index.php/api/admin/locations/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const result = await response.json()
    console.log('修改據點的result:', result)
    
    if (result.status && result.data) {
      formData.value = {
        name: result.data.name || '',
        image: null,
        phone: result.data.phone || '',
        address: result.data.address || '',
        lineLink: result.data.lineLink || ''
      }
      
      // 直接使用完整的 imageUrl
      if (result.data.imageUrl) {
        previewImage.value = result.data.imageUrl
      } else {
        previewImage.value = null
      }
    }
  } catch (error) {
    console.error('獲取據點資料失敗:', error)
  } finally {
    isLoading.value = false
  }
}

// API 提交函數
const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    // 檢查必填欄位
    if (!formData.value.name) {
      throw new Error('請填寫據點名稱')
    }

    // 準備表單資料
    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.value.name)
    formDataToSend.append('phone', formData.value.phone)
    formDataToSend.append('address', formData.value.address)
    formDataToSend.append('lineLink', formData.value.lineLink)

    // 檢查圖片上傳狀態
    console.log('圖片狀態:', formData.value.image)

    // 如果有新上傳的圖片才加入
    if (formData.value.image instanceof File) {
      formDataToSend.append('image', formData.value.image)
    }

    // 發送更新請求
    const response = await fetch(`/index.php/api/admin/locations/${route.params.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formDataToSend
    })

    // 檢查上傳的表單資料
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0] + ': ' + pair[1])
    }

    const result = await response.json()
    console.log('更新回應:', result)

    if (result.status) {
      alert('更新成功')
      router.push('/backsite/option')
    } else {
      throw new Error(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新失敗:', error)
    alert(error.message)
  } finally {
    isSubmitting.value = false
  }
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
    title: '據點管理',
    href: '/backsite/option',
    disabled: false
  },
  {
    title: '編輯據點',
    disabled: true
  }
]

// 處理函數
const handleBack = () => {
  router.push('/backsite/option')
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  
  // 檢查檔案是否存在
  if (!file) return

  // 檢查檔案類型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    alert('只能上傳 JPG 或 PNG 格式的圖片')
    event.target.value = '' // 清除選擇的檔案
    return
  }

  // 通過驗證後設定圖片
  formData.value.image = file
  previewImage.value = URL.createObjectURL(file)
}

const validateForm = () => {
  errors.value = {}
  if (!formData.value.name) {
    errors.value.name = '名稱為必填欄位'
    return false
  }
  return true
}

const fileInput = ref(null)
const clearImage = () => {
  // 清除預覽圖
  if (previewImage.value) {
    URL.revokeObjectURL(previewImage.value)
  }
  previewImage.value = null
  formData.value.image = null
  
  // 重置 file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

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

            <h2 class="text-2xl font-semibold text-gray-800 mb-6">編輯據點</h2>

            <!-- 內容區域 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 名稱 -->
            <div class="col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                名稱
                <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                v-model="formData.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.name }"
              >
              <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
            </div>

              <!-- 圖片上傳 -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">圖片</label>
                <div class="flex items-center space-x-4">
                  <div class="w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                    <img 
                      v-if="previewImage" 
                      :src="previewImage" 
                      class="w-full h-full object-cover"
                      alt="據點圖片"
                    >
                    <div 
                      v-else 
                      class="w-full h-full flex items-center justify-center bg-gray-50"
                    >
                      <span class="text-gray-400">尚無圖片</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <input 
                        type="file" 
                        accept="image/*"
                        @change="handleImageUpload" 
                        class="hidden" 
                        ref="fileInput"
                      >
                    <button 
                      @click="$refs.fileInput.click()"
                      class="px-4 py-2 mr-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      {{ previewImage ? '更換圖片' : '上傳圖片' }}
                    </button>
                    <button 
                      v-if="previewImage"
                      @click="clearImage"
                      class="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      取消上傳
                    </button>
                  </div>
                </div>
              </div>

                <!-- 電話 -->
                <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">電話</label>
                <input 
                    type="tel" 
                    v-model="formData.phone"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p v-if="errors.phone" class="mt-1 text-sm text-red-500">{{ errors.phone }}</p>
                </div>

                <!-- 地址 -->
                <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">地址</label>
                <input 
                    type="text" 
                    v-model="formData.address"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p v-if="errors.address" class="mt-1 text-sm text-red-500">{{ errors.address }}</p>
                </div>

                <div class="col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Line</label>
                  <input 
                    type="text" 
                    v-model="formData.lineLink"
                    placeholder="請輸入 Line 好友連結"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <p v-if="errors.lineLink" class="mt-1 text-sm text-red-500">{{ errors.lineLink }}</p>
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
                <button 
                @click="handleSubmit"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                {{ isSubmitting ? '提交中...' : '更新' }}
                </button>
            </div>
          </div>
        </main>
      </div>
    </v-main>
  </v-layout>
  </template>

<style scoped>
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}
</style>