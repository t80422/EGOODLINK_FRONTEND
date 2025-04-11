<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const router = useRouter()
const errors = ref({})
const isSubmitting = ref(false)
const previewImage = ref(null)

// 表單數據
const formData = ref({
  name: '',
  image: null,
  phone: '',
  address: '',
  lineLink: ''
})

const phoneError = ref('')
// 電話驗證函式
const validatePhone = (phone) => {
  const phoneRegex = /^09\d{8}$/
  if (!phone) {
    phoneError.value = '請輸入電話號碼'
    return false
  }
  if (!phoneRegex.test(phone)) {
    phoneError.value = '請輸入正確的手機號碼格式 (09開頭的10位數)'
    return false
  }
  phoneError.value = ''
  return true
}

// 監聽電話輸入
const handlePhoneInput = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '')  // 只允許數字
  if (value.length > 10) {
    value = value.slice(0, 10)  // 限制最大長度為10
  }
  formData.phone = value
  validatePhone(value)
}
// API 提交函數
const submitForm = async (data) => {
  const formDataToSend = new FormData()
  formDataToSend.append('name', data.name)
  formDataToSend.append('phone', data.phone)
  formDataToSend.append('address', data.address)
  formDataToSend.append('lineLink', data.lineLink)
  if (data.image) {
    formDataToSend.append('image', data.image)
  }

  const response = await fetch('/index.php/api/admin/locations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authStore.token}`
    },
    body: formDataToSend
  })

  const result = await response.json()
  if (!result.status) {
    throw new Error(result.message || '提交失敗')
  }
  return result
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
    title: '新增據點',
    disabled: true
  }
]

// 處理函數
const handleBack = () => {
  router.push('/backsite/option')
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.image = file
    previewImage.value = URL.createObjectURL(file)
  }
}

const validateForm = () => {
  errors.value = {}
  if (!formData.value.name) {
    errors.value.name = '名稱為必填欄位'
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  isSubmitting.value = true
  try {
    await submitForm(formData.value)
    router.push('/backsite/option')
  } catch (error) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    <v-main>
      <div class="flex-1 flex flex-col">
        <!-- <Header /> -->
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

            <h2 class="text-2xl font-semibold text-gray-800 mb-6">新增</h2>

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
                placeholder="請輸入名稱"
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
                  >
                  <div v-else class="w-full h-full flex items-center justify-center bg-gray-50">
                    <span class="text-gray-400">預覽圖</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept=".jpg,.png"
                  @change="handleImageUpload" 
                  class="hidden" 
                  ref="fileInput"
                >
                <button 
                  @click="$refs.fileInput.click()"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  上傳圖片
                </button>
              </div>
            </div>

            <!-- 電話 -->
            <div class="col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">電話</label>
              <input 
                type="tel" 
                v-model="formData.phone"
                @input="handlePhoneInput"
                placeholder="請輸入手機 (例：0912345678)"
                maxlength="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{'border-red-500': phoneError}"
              >
              <p v-if="phoneError" class="mt-1 text-sm text-red-500">{{ phoneError }}</p>
            </div>

            <!-- 地址 -->
            <div class="col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">地址</label>
              <input 
                type="text" 
                v-model="formData.address"
                placeholder="請輸入地址"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div class="col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">Line</label>
              <input 
                type="text" 
                v-model="formData.lineLink"
                placeholder="請輸入 Line 連結"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
                {{ isSubmitting ? '提交中...' : '新增' }}
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