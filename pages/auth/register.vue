<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const errorMessage = ref('')
const emailMessage = ref('')
const emailStatus = ref(null)
const isLoading = ref(false)

// 表單資料
const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  postalCode: '',
  address: '',
  locationId: ''
})

// 表單錯誤
const errors = ref({})

const isLocationSelectOpen = ref(false)

const handleLocationSelectClick = () => {
  isLocationSelectOpen.value = !isLocationSelectOpen.value
}

// 驗證規則
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '請輸入有效的電子信箱格式'
  },
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,  // 修改為最少8碼
    message: '密碼必須包含大小寫字母和數字，且長度至少8碼'
  },
  phone: {
    pattern: /^(09|\+886-9)\d{8}$/,
    message: '請輸入有效的手機號碼格式 (例如: 0912345678)'
  }
}

// 檢查信箱函數
const checkEmail = async (email) => {
  if (!email) return
  
  if (!validationRules.email.pattern.test(email)) {
    emailMessage.value = validationRules.email.message
    emailStatus.value = false
    return
  }

  try {
    const response = await fetch(`/index.php/api/check-account?email=${email}`)
    const data = await response.json()
    
    emailStatus.value = !data.data.isExist
    emailMessage.value = data.message
    
  } catch (error) {
    console.error('檢查信箱錯誤:', error)
    emailMessage.value = '檢查信箱發生錯誤'
    emailStatus.value = false
  }
}

// 驗證單一欄位
const validateField = (fieldName, value) => {
  delete errors.value[fieldName]
  
  if (!value?.trim()) {
    errors.value[fieldName] = `請輸入${fieldName}`
    return false
  }

  if (validationRules[fieldName]?.pattern && !validationRules[fieldName].pattern.test(value)) {
    errors.value[fieldName] = validationRules[fieldName].message
    return false
  }

  return true
}

// 驗證確認密碼
const validateConfirmPassword = () => {
  delete errors.value.confirmPassword
  
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = '請再次輸入密碼'
    return false
  }
  
  if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = '密碼不一致'
    return false
  }
  
  return true
}

// 註冊處理
const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (isLoading.value) return
  // 驗證所有必填欄位
  validateField('email', formData.value.email)
  validateField('password', formData.value.password)
  validateField('phone', formData.value.phone)
  validateField('name', formData.value.name)
  validateConfirmPassword()
  
  // 檢查是否有錯誤
  if (Object.keys(errors.value).length > 0) {
    return
  }

  // 檢查信箱狀態
  if (!emailStatus.value) {
    errorMessage.value = '請使用其他信箱'
    return
  }

  try {

    isLoading.value = true

     // 加入 5 秒延遲
     await new Promise(resolve => setTimeout(resolve, 5000))

    const response = await fetch('/index.php/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.value.email,
        password: formData.value.password,
        name: formData.value.name,
        locationId: Number(formData.value.locationId),
        phone: formData.value.phone,
        postalCode: formData.value.postalCode,
        address: formData.value.address,
        locationId: formData.value.locationId || null
      })
    })

    const data = await response.json()

    if (data.status) {
      alert(data.message)
      router.push('/auth/login')
    } else {
      errorMessage.value = data.message
    }
  } catch (error) {
    errorMessage.value = '註冊失敗，請稍後再試'
    console.error('註冊錯誤:', error)
  }
}

// 新增據點選項的狀態
const locationOptions = ref([])

// 獲取據點選項
const fetchLocationOptions = async () => {
  try {
    const response = await fetch('/index.php/api/locationOptions')
    const result = await response.json()
    
    if (result.status && result.data?.options) {
      locationOptions.value = result.data.options
    }
  } catch (error) {
    console.error('取得據點選項失敗:', error)
  }
}

// 組件掛載時獲取據點選項
onMounted(() => {
  fetchLocationOptions()
})
</script>

<template>
  <div class="min-h-[75vh] bg-white">
    <!-- Breadcrumb -->
    <div class="bg-white p-4 mb-6 border-t border-gray-200">
      <div class="container mx-auto px-4">
        <p class="text-sm text-gray-600 flex items-center">
          <NuxtLink to="/" class="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </NuxtLink>
          <span class="mx-2">/</span>
          <span>會員註冊</span>
        </p>
      </div>
    </div>

    <!-- Form Container -->
    <main class="flex items-center justify-center px-4 mb-20">
      <div class="w-full max-w-[640px] space-y-6 md:space-y-8">
        <!-- 標題 -->
        <div class="mb-6 md:mb-8">
          <h1 class="text-center text-xl md:text-2xl font-bold text-gray-900 mt-6 md:mt-10">會員註冊</h1>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6 md:space-y-8">
          <div v-if="errorMessage" class="text-red-500 text-center text-sm md:text-base">
            {{ errorMessage }}
          </div>

          <!-- 信箱 -->
          <div>
            <label for="email" class="block text-base md:text-lg font-medium text-gray-700">信箱</label>
            <div class="flex flex-col">
              <input
                v-model="formData.email"
                type="email"
                id="email"
                @blur="checkEmail(formData.email)"
                :class="[
                  'mt-1 block w-full h-[40px] md:h-[48px] px-3 py-2 border rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
                  (errors.email || !emailStatus && emailMessage) ? 'border-red-500' : 'border-[#E6E6E6]'
                ]"
                placeholder="請輸入您的電子信箱"
              />
              <div v-if="emailMessage" :class="['mt-1 text-sm md:text-base', emailStatus ? 'text-green-600' : 'text-red-600']">
                {{ emailMessage }}
              </div>
            </div>
          </div>

          <!-- 密碼 -->
          <div>
            <label for="password" class="block text-base md:text-lg font-medium text-gray-700">密碼</label>
            <input
              v-model="formData.password"
              type="password"
              id="password"
              @blur="validateField('password', formData.password)"
              class="mt-1 block w-full h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="請輸入您的密碼(英數字包含大小寫8碼)"
            />
            <div v-if="errors.password" class="mt-1 text-sm md:text-base text-red-600">
              {{ errors.password }}
            </div>
          </div>

          <!-- 再次確認密碼 -->
          <div>
            <label for="confirm-password" class="block text-base md:text-lg font-medium text-gray-700">再次確認密碼</label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              id="confirm-password"
              @blur="validateConfirmPassword"
              class="mt-1 block w-full h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="請再次輸入密碼"
            />
            <div v-if="errors.confirmPassword" class="mt-1 text-sm md:text-base text-red-600">
              {{ errors.confirmPassword }}
            </div>
          </div>

          <!-- 姓名 -->
          <div>
            <label for="name" class="block text-base md:text-lg font-medium text-gray-700">姓名</label>
            <input
              v-model="formData.name"
              type="text"
              id="name"
              @blur="validateField('name', formData.name)"
              class="mt-1 block w-full h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="請輸入姓名"
            />
            <div v-if="errors.name" class="mt-1 text-sm md:text-base text-red-600">
              {{ errors.name }}
            </div>
          </div>

          <!-- 電話 -->
          <div>
            <label for="phone" class="block text-base md:text-lg font-medium text-gray-700">電話</label>
            <input
              v-model="formData.phone"
              type="text"
              id="phone"
              @blur="validateField('phone', formData.phone)"
              class="mt-1 block w-full h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="請輸入可聯繫電話"
            />
            <div v-if="errors.phone" class="mt-1 text-sm md:text-base text-red-600">
              {{ errors.phone }}
            </div>
          </div>

          <!-- 地址 -->
          <div>
            <label class="block text-base md:text-lg font-medium text-gray-700">地址</label>
            <div class="flex gap-3 mt-1">
              <input
                v-model="formData.postalCode"
                type="text"
                id="postal-code"
                class="w-[120px] h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="郵遞區號"
              />
              <input
                v-model="formData.address"
                type="text"
                id="address"
                class="flex-1 h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="請輸入地址"
              />
            </div>
          </div>

          <!-- 營運據點 -->
          <div>
            <label class="block text-base md:text-lg font-medium text-gray-700">營運據點</label>
            <div class="relative mt-1">
              <select 
                v-model="formData.locationId"
                @click="handleLocationSelectClick"
                class="w-full h-[40px] md:h-[48px] px-3 py-2 border border-gray-300 rounded-[12px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="" disabled>請選擇營運據點</option>
                <option 
                  v-for="option in locationOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg 
                  class="fill-current h-4 w-4 transition-transform duration-200"
                  :class="{ 'rotate-180': isLocationSelectOpen }"
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full h-[40px] md:h-[48px] flex justify-center items-center border border-transparent rounded-[12px] shadow-sm text-sm md:text-base font-medium text-white bg-[#0F93A2] hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? '送出中...' : '送出' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>