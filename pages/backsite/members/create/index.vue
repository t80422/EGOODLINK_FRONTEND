<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const handleBreadcrumbClick = (path) => {
  if (path) {
    router.push(path)
  }
}

const breadcrumbItems = [
  {
    title: '首頁',
    href: '/backsite',
    disabled: false
  },
  {
    title: '會員管理',
    href: '/backsite/members',
    disabled: false
  },
  {
    title: '新增',
    disabled: true
  }
]

const router = useRouter()
const authStore = useAuthStore()
const showAutoVoteOption = computed(() => {
  // 確保使用嚴格比較並轉換為字串
  return authStore.user?.roleId === '1'
})

// 表單資料
const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  role: '',
  postalCode: '',
  address: '',
  locationId: '',
  group: '',
  canAutoVote: false
})
const emailMessage = ref('')
const emailStatus = ref(null)

const errorMessage = ref('')
const isSubmitting = ref(false)

// 新增群組選項狀態
const groupOptions = ref([])
const isGroupSelectOpen = ref(false)

const handleGroupSelectBlur = () => {
  isGroupSelectOpen.value = false
}

// 下拉選單選項
const roleOptions = ref([])

const locationOptions = ref([])

// 下拉箭頭狀態
const isRoleSelectOpen = ref(false)
const isLocationSelectOpen = ref(false)

// 處理下拉選單點擊
const handleRoleSelectClick = () => {
  isRoleSelectOpen.value = !isRoleSelectOpen.value
}

const handleLocationSelectClick = () => {
  isLocationSelectOpen.value = !isLocationSelectOpen.value
}

const handleRoleSelectBlur = () => {
  isRoleSelectOpen.value = false
}

const handleLocationSelectBlur = () => {
  isLocationSelectOpen.value = false
}

const errors = ref({})

// 驗證規則
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '請輸入有效的電子信箱格式'
  },
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,
    message: '密碼必須包含大小寫字母和數字，且長度至少8碼'
  },
  phone: {
    pattern: /^(09|\+886-9)\d{8}$/,
    message: '請輸入有效的手機號碼格式 (例如: 0912345678)'
  }
}

// 檢查信箱是否存在
const checkEmail = async (email) => {
  if (!email) return false
  
  if (!validationRules.email.pattern.test(email)) {
    emailMessage.value = validationRules.email.message
    emailStatus.value = false
    return false
  }

  try {
    const response = await fetch(`/index.php/api/check-account?email=${email}`)
    const data = await response.json()
    
    emailStatus.value = !data.data.isExist
    emailMessage.value = data.message
    return !data.data.isExist
    
  } catch (error) {
    console.error('檢查信箱錯誤:', error)
    emailMessage.value = '檢查信箱發生錯誤'
    emailStatus.value = false
    return false
  }
}

// validateForm 函數
const validateForm = async () => {
  errors.value = {}
  
  // 檢查基本必填欄位
  if (!formData.value.email) {
    errors.value.email = '請輸入信箱'
    return false
  }
  
  // 檢查信箱格式和重複
  await checkEmail(formData.value.email)
  if (!emailStatus.value) {
    errors.value.email = emailMessage.value
    return false
  }

  // 檢查密碼
  if (!formData.value.password) {
    errors.value.password = '請輸入密碼'
    return false
  }
  if (!validationRules.password.pattern.test(formData.value.password)) {
    errors.value.password = validationRules.password.message
    return false
  }

  // 檢查確認密碼
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = '請確認密碼'
    return false
  }
  if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = '密碼不一致'
    return false
  }

  // 檢查姓名
  if (!formData.value.name) {
    errors.value.name = '請輸入姓名'
    return false
  }

  // 檢查手機 (必填)
  if (!formData.value.phone) {
    errors.value.phone = '請輸入手機號碼'
    return false
  }
  if (!validationRules.phone.pattern.test(formData.value.phone)) {
    errors.value.phone = validationRules.phone.message
    return false
  }

  // 檢查角色
  if (!formData.value.role) {
    errors.value.role = '請選擇角色'
    return false
  }

  return true
}

const handleBack = () => {
  router.push('/backsite/members')
}

// 新增獲取角色選項的函數
const fetchRoleOptions = async () => {
  try {
    const response = await fetch('/index.php/api/admin/users/options', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (result.status && result.data) {
      roleOptions.value = result.data
    }
  } catch (error) {
    console.error('取得角色選項失敗:', error)
  }
}

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

// 當點擊群組選單時觸發
const handleGroupSelectClick = () => {
  // 檢查是否有選擇營運據點
  if (!formData.value.locationId) {
    console.log('尚未選擇營運據點')
    return
  }

  // 發送獲取群組選項請求
  fetchGroupOptions(formData.value.locationId)
  
  // 切換下拉選單狀態
  isGroupSelectOpen.value = !isGroupSelectOpen.value
}

// 獲取群組選項
const fetchGroupOptions = async (locationId) => {
  if (!locationId) {
    groupOptions.value = []
    return
  }

  try {
    // 使用 GET 方法，將參數加到 URL 上
    const response = await fetch(`/index.php/api/admin/users/groupOptions?locationId=${parseInt(locationId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('群組選項回應:', result)
    
    if (result.status && result.data) {
      groupOptions.value = result.data
    } else {
      groupOptions.value = []
    }
  } catch (error) {
    console.error('取得群組選項失敗:', error)
    groupOptions.value = []
  }
}

// 組件掛載時獲取據點選項
onMounted(() => {
  fetchRoleOptions()
  fetchLocationOptions()
})

const handleSubmit = async () => {
  try {
    // 檢查登入狀態
    isSubmitting.value = true
    errorMessage.value = ''
    
    // 先進行表單驗證
    const isValid = await validateForm()
    if (!isValid) {
      console.log('表單驗證失敗:', errors.value)
      // 顯示錯誤訊息
      errorMessage.value = '請檢查必填欄位'
      return
    }
    
    // 建立要發送的資料物件
    const submitData = {
      email: formData.value.email,
      password: formData.value.password,
      name: formData.value.name,
      roleId: parseInt(formData.value.role),
      locationId: formData.value.locationId ? parseInt(formData.value.locationId) : null,
      groupId: formData.value.group ? parseInt(formData.value.group) : null,
      phone: formData.value.phone,
      postalCode: formData.value.postalCode,
      address: formData.value.address,
      canAutoVote: formData.value.canAutoVote
    }
    
    console.log('送出的資料:', submitData)

    const response = await fetch('/index.php/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(submitData)
    })
    
    const result = await response.json()

    if (result.status) {
      alert('註冊成功,請檢查您的信箱進行驗證')
      router.push('/backsite/members')
    } else {
      errorMessage.value = result.message || '新增失敗'
    }
  } catch (error) {
    console.error('新增會員失敗:', error)
    errorMessage.value = '系統錯誤，請稍後再試'
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
          
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">新增會員管理</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 帳號 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">信箱 <span class="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    v-model="formData.email"
                    placeholder="請輸入信箱"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{'border-red-500': errors.email}"
                  >
                  <p v-if="emailMessage && !emailStatus" class="text-red-500 text-xs">{{ emailMessage }}</p>
                </div>

                <!-- 密碼 -->
                <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">密碼 <span class="text-red-500">*</span></label>
                <input 
                    type="password" 
                    v-model="formData.password"
                      placeholder="請輸入密碼"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{'border-red-500': errors.password}"
                >
                <p v-if="errors.password" class="text-red-500 text-xs">{{ errors.password }}</p>
                </div>

                <!-- 確認密碼 -->
                <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">確認密碼 <span class="text-red-500">*</span></label>
                <input 
                    type="password" 
                     placeholder="請再次確認密碼"
                    v-model="formData.confirmPassword"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{'border-red-500': errors.confirmPassword}"
                >
                <p v-if="errors.confirmPassword" class="text-red-500 text-xs">{{ errors.confirmPassword }}</p>
                </div>

                <!-- 姓名 -->
                <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">姓名<span class="text-red-500">*</span></label>
                <input 
                    type="text" 
                    v-model="formData.name"
                      placeholder="請輸入姓名"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                </div>

                <!-- 手機 -->
                <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">手機<span class="text-red-500">*</span></label>
                <input 
                    type="tel" 
                    v-model="formData.phone"
                    placeholder="請輸入手機 (例：0912345678)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p v-if="errors.phone" class="text-red-500 text-xs">{{ errors.phone }}</p>
                </div>

                <!-- 地址 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">地址</label>
                  <div class="flex gap-3">
                    <input
                      v-model="formData.postalCode"
                      type="number"
                      id="postal-code"
                      class="w-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="郵遞區號"
                    />
                    <input
                      v-model="formData.address"
                      type="text"
                      id="address"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="請輸入地址"
                    />
                  </div>
                </div>

              <!-- 角色 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">角色 <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select 
                    v-model="formData.role"
                    @click="handleRoleSelectClick"
                    @blur="handleRoleSelectBlur"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    :class="{'border-red-500': errors.role}"
                  >
                    <option value="">請選擇角色</option>
                    <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg 
                      class="fill-current h-4 w-4 transition-transform duration-200"
                      :class="{ 'rotate-180': !isRoleSelectOpen }"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                    </svg>
                  </div>
                </div>
                <p v-if="errors.role" class="text-red-500 text-xs">{{ errors.role }}</p>
              </div>
              <!-- 營運據點 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">營運據點</label>
                  <div class="relative">
                    <select 
                      v-model="formData.locationId"
                      @click="handleLocationSelectClick"
                      @blur="handleLocationSelectBlur"
                      :class="[
                        'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none',
                        errors.locationId ? 'border-red-500' : 'border-gray-300'
                      ]"
                    >
                      <option value="">請選擇營運據點</option>
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
                        :class="{ 'rotate-180': !isLocationSelectOpen }"
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                      </svg>
                    </div>
                  </div>
                  <div v-if="errors.locationId" class="mt-1 text-sm text-red-600">
                    {{ errors.locationId }}
                  </div>
              </div>

              <!-- 群組選擇 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">
                  群組
                </label>
                <div class="relative">
                  <select
                    v-model="formData.group"
                    @click="handleGroupSelectClick"
                    @blur="handleGroupSelectBlur"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                    :disabled="!formData.locationId"
                  >
                    <option value="">請選擇群組</option>
                    <option
                      v-for="option in groupOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg 
                      class="fill-current h-4 w-4 transition-transform duration-200"
                      :class="{ 'rotate-180': !isGroupSelectOpen }"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                    </svg>
                  </div>
                </div>
                <p v-if="!formData.locationId" class="mt-1 text-sm text-gray-500">
                  請先選擇營運據點
                </p>
              </div>
            </div>

            <div v-if="showAutoVoteOption" class="space-y-2">
              <label class="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  v-model="formData.canAutoVote"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                >
                <span>使用E股投</span>
              </label>
            </div>

            <div v-if="errorMessage" class="mt-4 text-center text-red-500">
              {{ errorMessage }}
            </div>

          <!-- 送出按鈕 -->
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
/* 檢查這裡的 CSS 是否有語法錯誤 */
</style>