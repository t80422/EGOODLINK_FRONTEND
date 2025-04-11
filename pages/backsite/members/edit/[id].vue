<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id

// 2. Data refs
const roleOptions = ref([])
const isRoleSelectOpen = ref(false)
const locationOptions = ref([])
const groupOptions = ref([])
const showAutoVoteOption = computed(() => {
  // 確保使用嚴格比較並轉換為字串
  return authStore.user?.roleId === '1'
})
const formData = ref({
  name: '',
  phone: '',
  locationId: '',
  roleId: '',
  groupId: '', 
  postalCode: '',
  address: '',
  canAutoVote: false
})
const errors = ref({})
const isSubmitting = ref(false)

const isLocationSelectOpen = ref(false)
const isGroupSelectOpen = ref(false)
const originalData = ref({})

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
    title: '編輯會員',
    disabled: true
  }
]

const handleRoleSelectClick = () => {
  isRoleSelectOpen.value = !isRoleSelectOpen.value
}

const handleRoleSelectBlur = () => {
  isRoleSelectOpen.value = false
}

const handleLocationSelectBlur = () => {
  isLocationSelectOpen.value = false
}

// 新增電話驗證函數
const validatePhone = (phone) => {
  const phoneRegex = /^09\d{8}$/
  return phoneRegex.test(phone)
}

// 更新驗證函數
const validateForm = () => {
  errors.value = {}
  let isValid = true
  
  // 必填欄位驗證
  if (!formData.value.name) {
    errors.value.name = '請輸入姓名'
    isValid = false
  }

  // 手機必填和格式驗證
  if (!formData.value.phone) {
    errors.value.phone = '請輸入手機號碼'
    isValid = false
  } else if (!validatePhone(formData.value.phone)) {
    errors.value.phone = '請輸入正確的手機格式'
    isValid = false
  }

  // 角色必填驗證
  if (!formData.value.roleId) {
    errors.value.roleId = '請選擇角色'
    isValid = false
  }

  // 如果有錯誤，在控制台輸出
  if (!isValid) {
    console.log('表單驗證錯誤:', errors.value)
  }

  return isValid
}


const handleBack = () => {
  router.push('/backsite/members')
}

// 5. Computed
const isGroupDisabled = computed(() => {
  return !formData.value.locationId
})

// 6. Watchers
watch(() => formData.value.locationId, (newLocationId) => {
  formData.value.groupId = ''  // 清空群組選擇
  groupOptions.value = []      // 清空群組選項
  
  if (newLocationId) {
    fetchGroupOptions(newLocationId)  // 獲取新的群組選項
  }
})

// 7. Event Handlers
const handleGroupSelectClick = (event) => {
  if (isGroupDisabled.value) {
    event.preventDefault()
    alert('請先選擇據點')
    return
  }
  isGroupSelectOpen.value = !isGroupSelectOpen.value
}

// 8. Lifecycle
onMounted(async () => {
  try {
    await fetchLocationOptions()
    await fetchMemberData()
    if (formData.value.locationId) {
      await fetchGroupOptions(formData.value.locationId)
    }
  } catch (error) {
    console.error('初始化失敗:', error)
  }
})

const fetchMemberData = async () => {
  try {
    const response = await fetch(`/index.php/api/admin/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const result = await response.json()
    
    if (result.status && result.data) {
      originalData.value = { ...result.data }
      // 更新表單資料
      formData.value = {
        name: result.data.name || '',
        phone: result.data.phone || '',
        locationId: result.data.locationId || '',
        groupId: result.data.groupId || '',
        postalCode: result.data.postalCode || '',
        address: result.data.address || '',
        roleId: result.data.roleId || '',
        canAutoVote: result.data.canAutoVote === "1"
      }
    }
  } catch (error) {
    console.error('獲取會員資料失敗:', error)
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    const errorMessages = Object.values(errors.value).join('\n')
    alert(errorMessages)
    return
  }

  // 修改比對邏輯，確保型別一致
  const hasChanges = Object.keys(formData.value).some(key => {
    // 將兩邊的值都轉為字串比較
    const formValue = String(formData.value[key] || '')
    const originalValue = String(originalData.value[key] || '')
    const isDifferent = formValue !== originalValue
    
    if (isDifferent) {
      console.log(`${key} 變更:`, {
        form: formValue,
        original: originalValue
      })
    }
    
    return isDifferent
  })

  if (!hasChanges) {
    alert('沒有資料變更，無需更新')
    return
  }
  
  try {
    isSubmitting.value = true
    
    // 只提交需要的欄位
    const submitData = {
      name: formData.value.name,
      phone: formData.value.phone,
      locationId: formData.value.locationId || null, // 如果沒有選擇據點，傳送 null
      groupId: formData.value.groupId || null, // 如果沒有選擇群組，傳送 null
      postalCode: formData.value.postalCode || '',
      address: formData.value.address || '',
      roleId: formData.value.roleId || null, // 如果沒有選擇角色，傳送 null
      canAutoVote: formData.value.canAutoVote ? "1" : "0"
    }

    const response = await fetch(`/index.php/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitData)
    })

    const result = await response.json()
    
    if (result.status) {
      alert('更新成功')
      router.push('/backsite/members')
    } else {
      alert(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新會員失敗:', error)
    alert('系統發生錯誤')
  } finally {
    isSubmitting.value = false
  }
}

// 獲取據點選項
const fetchLocationOptions = async () => {
  try {
    const response = await fetch('/index.php/api/locationOptions')
    const result = await response.json()
    
    if (result.status && result.data?.options) {
      locationOptions.value = result.data.options
      console.log('獲取據點選項:', result.data.options)
    }
  } catch (error) {
    console.error('取得據點選項失敗:', error)
  }
}

// 獲取群組選項
const fetchGroupOptions = async (locationId) => {
  if (!locationId) {
    groupOptions.value = []
    return
  }

  try {
    const response = await fetch(`/index.php/api/admin/users/groupOptions?locationId=${parseInt(locationId)}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    console.log('群組選項回應:', result)
    
    if (result.status && result.data) {
      groupOptions.value = result.data
    }
  } catch (error) {
    console.error('取得群組選項失敗:', error)
    groupOptions.value = []
  }
}

// 獲取角色選項的函數
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

const handleLocationSelectClick = () => {
  isLocationSelectOpen.value = !isLocationSelectOpen.value
}

// 群組關閉處理
const handleGroupSelectBlur = () => {
  isGroupSelectOpen.value = false
}

onMounted(async () => {
  try {
    await fetchRoleOptions()
    // 1. 先獲取據點選項
    await fetchLocationOptions()
    // 2. 再獲取會員資料
    await fetchMemberData()
    // 3. 如果有據點ID，獲取群組選項
    if (formData.value.locationId) {
      await fetchGroupOptions(formData.value.locationId)
    }
  } catch (error) {
    console.error('初始化失敗:', error)
  }
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

          <h2 class="text-2xl font-semibold text-gray-800 mb-6">編輯會員</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 姓名 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">姓名<span class="text-red-500">*</span></label>
              <input 
                type="text" 
                v-model="formData.name"
                placeholder="請輸入姓名"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
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
            </div>

            <!-- 據點 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">據點</label>
              <div class="relative">
                <select 
                  v-model="formData.locationId"
                  @click="handleLocationSelectClick"
                  @blur="handleLocationSelectBlur"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">請選擇據點</option>
                  <option v-for="option in locationOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <p v-if="errors.locationId" class="mt-1 text-sm text-red-600">{{ errors.locationId }}</p>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="fill-current h-4 w-4" :class="{ 'rotate-180': !isLocationSelectOpen }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 群組 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">群組</label>
              <div class="relative">
                <select 
                  v-model="formData.groupId"
                  @click="handleGroupSelectClick"
                  @blur="handleGroupSelectBlur"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  :class="{ 'opacity-50 cursor-not-allowed': isGroupDisabled }"
                  :disabled="isGroupDisabled"
                >
                  <option value="">{{ isGroupDisabled ? '請先選擇據點' : '請選擇群組' }}</option>
                  <option v-for="option in groupOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <p v-if="errors.groupId" class="mt-1 text-sm text-red-600">{{ errors.groupId }}</p>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="fill-current h-4 w-4" :class="{ 'rotate-180': !isGroupDisabled }"
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">角色 <span class="text-red-500">*</span></label>
              <div class="relative">
                <select 
                  v-model="formData.roleId"
                  @click="handleRoleSelectClick"
                  @blur="handleRoleSelectBlur"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
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
            </div>

            <!-- 郵遞區號 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">郵遞區號</label>
              <input 
                type="number" 
                v-model="formData.postalCode"
                placeholder="請輸入郵遞區號"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- 地址 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">地址</label>
              <input 
                type="text" 
                v-model="formData.address"
                placeholder="請輸入地址"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
          </div>

          <div v-if="showAutoVoteOption" class="mt-6">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                v-model="formData.canAutoVote"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              >
              <span>使用E股投</span>
            </label>
          </div>

          <!-- 按鈕群組 -->
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
              {{ isSubmitting ? '更新中...' : '更新' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </v-main>
</v-layout>
</template>