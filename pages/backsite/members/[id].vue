<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const id = route.params.id
const errors = ref({})

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
    title: '會員詳細',
    disabled: true
  }
]
const authStore = useAuthStore()
// 基本資訊的資料
const account = ref('') // 用來存放 email
const name = ref('')
const phone = ref('')
const locationName = ref('')
const groupName = ref('')
const roleName = ref('')
const zipCode = ref('') // 用來存放 postalCode
const address = ref('')

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.name?.trim()) {
    errors.value.name = '請輸入姓名'
    isValid = false
  }

  return isValid
}

const handleBack = () => {
  router.push('/backsite/members')
}

const fetchMemberData = async () => {
  try {
    const response = await fetch(`/index.php/api/admin/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const result = await response.json()
    
    if (result.status && result.data) {
      // 更新資料，移除 || '--' 讓資料更乾淨
      account.value = result.data.email
      name.value = result.data.name
      phone.value = result.data.phone
      locationName.value = result.data.locationName
      roleName.value = result.data.roleName
      groupName.value = result.data.groupName
      zipCode.value = result.data.postalCode
      address.value = result.data.address
    }
  } catch (error) {
    console.error('獲取會員資料失敗:', error)
  }
}

onMounted(async () => {
  try {
    await fetchMemberData()
  } catch (error) {
    console.error('初始化失敗:', error)
  }
})

// 三點下拉
const showDropdown = ref(false)

// 點擊三點下拉其他地方關閉下拉選單
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showDropdown.value = false
    }
  })
})
const selectedFiles = ref({
  idCard: false,         // 身分證
  drivingLicense: false, // 駕照
  hic: false,           // 健保卡
  hrt: false,           // 戶籍謄本
  hc: false             // 戶口名簿
})

// 繳交身分證管理彈出視窗
const showPaymentModal = ref(false)
const activeTab = ref('content')
const uploadTime = ref('')
// 子帳號
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(0)
// 持股紀錄下拉
const showStockRecordModal = ref(false)
const stockSearchKeyword = ref('')
const items = ref([
  {
    id: 1,
    isHovered: false,
    showDropdown: false, // 為每個項目添加獨立的下拉狀態
  }
])

const toggleDropdown = (item) => {
  // 關閉其他項目的下拉選單
  items.value.forEach(i => {
    if (i.id !== item.id) {
      i.showDropdown = false
    }
  })
  // 切換當前項目的下拉狀態
  item.showDropdown = !item.showDropdown
}

// 修改點擊外部關閉下拉選單的邏輯
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-trigger')) {
      items.value.forEach(item => item.showDropdown = false)
    }
  })
})

const handleSearch = () => {
  currentPage.value = 1
  fetchSubAccounts()
}

// 抓取子帳號列表
const fetchSubAccounts = async () => {
  try {
    const queryParams = new URLSearchParams({
      page: currentPage.value.toString()
    }).toString()

    const response = await fetch(`/index.php/api/admin/subAccount/${id}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    if (result.status) {
      items.value = result.data.items
      total.value = result.data.total
      totalPages.value = result.data.totalPages
    } else {
      console.error('獲取資料失敗:', result.message)
    }
  } catch (error) {
    console.error('API請求失敗:', error)
  }
}

const handlePageChange = async (page) => {
  currentPage.value = page
  await fetchSubAccounts()
}

// 抓取子帳號列表組件掛載時獲取資料
onMounted(() => {
  fetchSubAccounts()
})

// 繳交管理表單數據
const formData = ref({
    id: '',
    idNumber: '',    // 身分證字號
    name: '',        // 姓名
    note: '',        // 備註
})

// 處理編輯點擊的方法
const handleEditClick = async (id) => {
  try {
    console.log('要獲取的子帳號ID:', id)
    const success = await fetchSubAccountData(id)
    if (success) {
      showPaymentModal.value = true
    }
  } catch (error) {
    console.error('編輯操作失敗:', error)
    alert('獲取資料失敗，請稍後再試')
  }
}

// 獲取修改子帳號人頭的方法
const fetchSubAccountData = async (id) => {
  try {
    const response = await fetch(`/index.php/api/admin/subAccount/detail/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    console.log('駕照狀態:', result.data.drivingLicense)

    if (result.status) {
      // 更新表單資料
      formData.value = {
        id: id,
        idNumber: result.data.idCardNum,
        name: result.data.name, 
        note: result.data.memo,
      }

      console.log('更新前的 selectedFiles:', selectedFiles.value)
      // 更新檔案選取狀態
      selectedFiles.value = {
        idCard: Boolean(result.data.idCard),
        drivingLicense: Boolean(result.data.drivingLicense), // 特別注意這行
        hic: Boolean(result.data.hic),
        hrt: Boolean(result.data.hrt),
        hc: Boolean(result.data.hc)
      }
      console.log('更新後的 selectedFiles:', selectedFiles.value)

      return true
    } else {
      alert(result.message || '獲取資料失敗')
      return false
    }
  } catch (error) {
    console.error('獲取資料失敗:', error)
    if (error.response?.status === 401) {
      authStore.clearAuth()
      alert('登入已過期，請重新登入') 
    } else {
      alert('系統發生錯誤，請稍後再試')
    }
    return false
  }
}

const updateSubAccount = async () => {
  try {
    if (!validateForm()) {
      return
    }
    console.log('要更新的子帳號ID:', formData.value.id)
    console.log('更新前的檔案狀態:', selectedFiles.value)
    // 準備要更新的資料，包含證件狀態
    const payload = {
      name: formData.value.name,
      memo: formData.value.note,
      idCard: selectedFiles.value.idCard,
      drivingLicense: selectedFiles.value.drivingLicense,
      hic: selectedFiles.value.hic,
      hrt: selectedFiles.value.hrt,
      hc: selectedFiles.value.hc
    }
    console.log('準備發送的資料:', payload)
    const response = await fetch(`/index.php/api/admin/subAccount/${formData.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    console.log('API 回傳的結果:', result)

    if (result.status) {
      alert('更新成功')
      showPaymentModal.value = false
      await fetchSubAccountData(formData.value.id)
      await fetchSubAccounts()

      console.log('更新後的檔案狀態:', selectedFiles.value)
    } else {
      alert(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新失敗:', error)
    if (error.response?.status === 401) {
      authStore.clearAuth()
      alert('登入已過期，請重新登入')
    } else {
      alert('系統發生錯誤，請稍後再試')
    }
  }
}

const handleCancel = () => {
  showPaymentModal.value = false
}

const handleCheckboxChange = (field) => {
  selectedFiles.value[field] = !selectedFiles.value[field]
  console.log(`${field} 狀態更改為:`, selectedFiles.value[field])
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
          
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">詳細會員</h2>
          
        <div>
            <div class="">

                <div class="mb-8 grid grid-cols-2 gap-6">
                <!-- 左側欄位 -->
                <div class="space-y-4">
                  <div class="flex items-start">
                    <span class="w-24 text-gray-600">信箱：</span>
                    <span class="flex-1 font-medium">{{ account || '--' }}</span>
                  </div>
                    
                  <div class="flex items-start">
                    <span class="w-24 text-gray-600">姓名：</span>
                    <span class="flex-1 font-medium">{{ name || '--' }}</span>
                  </div>

                    <div class="flex items-start">
                    <span class="w-24 text-gray-600">電話：</span>
                    <span class="flex-1 font-medium">{{ phone || '--' }}</span>
                    </div>

                    <div class="flex items-start">
                    <span class="w-24 text-gray-600">據點：</span>
                    <span class="flex-1 font-medium">{{ locationName || '--' }}</span>
                    </div>
                </div>

                <!-- 右側欄位 -->
                <div class="space-y-4">
                    <div class="flex items-start">
                    <span class="w-24 text-gray-600">群組：</span>
                    <span class="flex-1 font-medium">{{ groupName || '--' }}</span>
                    </div>

                    <div class="flex items-start">
                    <span class="w-24 text-gray-600">角色：</span>
                    <span class="flex-1 font-medium">{{ roleName || '--' }}</span>
                    </div>

                    <div class="flex items-start">
                    <span class="w-24 text-gray-600">郵遞區號：</span>
                    <span class="flex-1 font-medium">{{ zipCode || '--' }}</span>
                    </div>

                    <div class="flex items-start">
                    <span class="w-24 text-gray-600">地址：</span>
                    <span class="flex-1 font-medium">{{ address || '--' }}</span>
                    </div>
                </div>
                </div>

                <h3 class="text-lg font-medium text-gray-800 mb-4">子帳號列表</h3>
                <div class="scroll-content w-full" style="overflow-y: auto; height: 38vh;">
                    <!-- 無資料時的提示 -->
                    <div v-if="!items.length" class="space-y-6">
                      <div class="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                        <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p class="text-lg text-gray-600 font-medium">此帳號目前無子帳號資料</p>
                      </div>
                      
                      <!-- 返回按鈕 -->
                      <div class="flex justify-center">
                        <button 
                          @click="router.back()"
                          class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          <span>返回上一頁</span>
                        </button>
                      </div>
                    </div>

                <table v-else class="table-auto w-full border-collapse border-t border-b border-gray-300">
                    <tbody>
                        <template v-for="(item, index) in items" :key="item.id">
                        <!-- 第一行 -->
                        <tr 
                                class="border-b border-gray-300 group"
                                :class="{
                                  'bg-white': index % 2 === 0,
                                  'bg-gray-50': index % 2 === 1,
                                  // 'hover:bg-gray-100': true
                                }"
                                @mouseover="item.isHovered = true"
                                @mouseleave="item.isHovered = false"
                                >
                                <td class="py-4 px-6 w-1/2">
                                <div class="flex items-center">
                                    <div class="w-4 h-4 mr-4"></div>
                                    <span class="text-gray-600">- {{ item.name }} {{ item.idCardNum }} ({{ item.owner }} 持有)</span>
                                </div>
                                </td>
                                <td class="py-4 px-6 w-1/2">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center">
                                            <span class="font-medium text-gray-700 mr-2">備註</span>
                                            <span class="text-gray-500">{{ item.memo || '--' }}</span>
                                            </div>
                                        <!-- 三點圖示下拉選單 -->
                                        <div class="relative">
                                          <button 
                                            @click="handleEditClick(item.id)"
                                            class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 flex items-center gap-2"
                                          >
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                          </button>
                                        </div>
                                        </div>
                                </td>
                              </tr>


                            <!-- 修改彈出視窗 -->
                            <div 
                            v-if="showPaymentModal" 
                            class="modal fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50"
                            >
                            <div class="bg-white rounded-lg p-8 w-[960px]">
                                <!-- 標題與關閉按鈕 -->
                                <div class="flex justify-between items-center pb-4 border-b border-gray-200">
                                <h3 class="text-xl font-medium">編輯子帳號</h3>
                                <button 
                                    @click="showPaymentModal = false" 
                                    class="text-gray-400 hover:text-gray-600"
                                >
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                </div>

                                <!-- 標籤頁切換 -->
                                <div class="flex border-b border-gray-200 mt-6">
                                <button 
                                    @click="activeTab = 'content'"
                                    :class="[
                                    'px-6 py-3 text-sm font-medium',
                                    activeTab === 'content' 
                                        ? 'border-b-2 border-teal-500 text-teal-600' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    ]"
                                >
                                    內容
                                </button>
                                <!-- <button 
                                    @click="activeTab = 'payment'"
                                    :class="[
                                    'px-6 py-3 text-sm font-medium',
                                    activeTab === 'payment' 
                                        ? 'border-b-2 border-teal-500 text-teal-600' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    ]"
                                >
                                    繳交管理
                                </button> -->
                                </div>

                                <!-- 內容標籤頁 -->
                                <div v-if="activeTab === 'content'" class="mt-6 space-y-6">
                                    <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">身分證字號</label>
                                    <input 
                                        v-model="formData.idNumber"
                                        type="text"
                                        readonly
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-gray-500"
                                    />
                                    <p class="text-sm text-gray-600">E股投用戶請正確填寫，投票後不得更改，避免影響電投或代領流程。</p>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">
                                          姓名
                                          <span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                          v-model="formData.name"
                                          type="text"
                                          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                                          :class="{'border-red-500': errors.name, 'border-gray-300': !errors.name}"
                                        />
                                        <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
                                      </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">備註</label>
                                    <input 
                                    v-model="formData.note"
                                    type="text"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                </div>

                                <!-- 繳交管理標籤頁 -->
                                <div v-if="activeTab === 'payment'" class="mt-6">
                                  <div class="space-y-4">
                                  <!-- 身分證正面 -->
                                  <div class="border border-gray-200 hover:border-teal-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white">
                                        <div class="flex justify-between items-center">
                                          <div class="flex items-center space-x-4">
                                            <input 
                                              type="checkbox"
                                              :checked="selectedFiles.idCard"
                                              @change="() => handleCheckboxChange('idCard')"
                                              class="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
                                            >
                                            <span class="font-medium text-gray-900">身分證正面</span>
                                          </div>
                                          <div class="flex items-center space-x-2">
                                            <span :class="[
                                              'px-3 py-1 rounded-md text-sm',
                                              selectedFiles.idCard ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                            ]">
                                              {{ selectedFiles.idCard ? '已選取' : '未選取' }}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                    <!-- 駕照 -->
                                    <div class="border border-gray-200 hover:border-teal-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white">
                                      <div class="flex justify-between items-center">
                                        <div class="flex items-center space-x-4">
                                          <input 
                                            type="checkbox"
                                            :checked="selectedFiles.drivingLicense"
                                            @change="() => handleCheckboxChange('drivingLicense')"
                                            class="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
                                          >
                                          <span class="font-medium text-gray-900">駕照</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                          <span :class="[
                                            'px-3 py-1 rounded-md text-sm',
                                            selectedFiles.drivingLicense ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                          ]">
                                            {{ selectedFiles.drivingLicense ? '已選取' : '未選取' }}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <!-- 健保卡正面 -->
                                    <div class="border border-gray-200 hover:border-teal-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white">
                                      <div class="flex justify-between items-center">
                                        <div class="flex items-center space-x-4">
                                          <input 
                                            type="checkbox"
                                            :checked="selectedFiles.hic"
                                            @change="() => handleCheckboxChange('hic')"
                                            class="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
                                          >
                                          <span class="font-medium text-gray-900">健保卡正面</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                          <span :class="[
                                            'px-3 py-1 rounded-md text-sm',
                                            selectedFiles.hic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                          ]">
                                            {{ selectedFiles.hic ? '已選取' : '未選取' }}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <!-- 戶籍謄本 -->
                                    <div class="border border-gray-200 hover:border-teal-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white">
                                      <div class="flex justify-between items-center">
                                        <div class="flex items-center space-x-4">
                                          <input 
                                            type="checkbox"
                                            :checked="selectedFiles.hrt"
                                            @change="() => handleCheckboxChange('hrt')"
                                            class="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
                                          >
                                          <span class="font-medium text-gray-900">戶籍謄本</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                          <span :class="[
                                            'px-3 py-1 rounded-md text-sm',
                                            selectedFiles.hrt ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                          ]">
                                            {{ selectedFiles.hrt ? '已選取' : '未選取' }}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <!-- 戶口名簿 -->
                                    <div class="border border-gray-200 hover:border-teal-500 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white">
                                      <div class="flex justify-between items-center">
                                        <div class="flex items-center space-x-4">
                                          <input 
                                            type="checkbox"
                                            :checked="selectedFiles.hc"
                                            @change="() => handleCheckboxChange('hc')"
                                            class="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
                                          >
                                          <span class="font-medium text-gray-900">戶口名簿</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                          <span :class="[
                                            'px-3 py-1 rounded-md text-sm',
                                            selectedFiles.hc ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                          ]">
                                            {{ selectedFiles.hc ? '已選取' : '未選取' }}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <!-- 按鈕區 -->
                                <div class="flex justify-end space-x-4 mt-8">
                                  <button 
                                    @click="handleCancel"
                                    class="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200"
                                  >
                                    取消
                                  </button>
                                  <button 
                                    @click="updateSubAccount"
                                    class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                                  >
                                    更新
                                  </button>
                                </div>
                            </div>
                            </div>

                          <!-- 第二行 - 證件狀態 -->
                          <tr 
                              class="border-b border-gray-300"
                              :class="{
                                'bg-white': index % 2 === 0,
                                'bg-gray-50': index % 2 === 1,
                                // 'hover:bg-gray-100': item.isHovered
                              }"
                              >
                              <td class="py-4 px-6" colspan="2">
                                  <div class="flex items-center gap-2">
                                  <!-- <input type="checkbox" class="w-4 h-4 mr-2"> -->
                                  <span class="font-medium text-gray-700 mr-4 ml-6">正本</span>
                                  <div class="flex flex-wrap gap-2 justify-start">
                                      <!-- 身分證狀態 -->
                                      <span :class="[
                                      'px-3 py-1 rounded-md text-sm flex items-center gap-1',
                                      item.idCard ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      ]">
                                      <span>身分證正面</span>
                                      <svg v-if="item.idCard" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      </span>

                                      <!-- 駕照狀態 -->
                                      <span :class="[
                                      'px-3 py-1 rounded-md text-sm flex items-center gap-1',
                                      item.drivingLicense ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      ]">
                                      <span>駕照</span>
                                      <svg v-if="item.drivingLicense" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      </span>

                                      <!-- 健保卡狀態 -->
                                      <span :class="[
                                        'px-3 py-1 rounded-md text-sm flex items-center gap-1',
                                        item.hic ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      ]">
                                        <span>健保卡</span>
                                        <svg v-if="item.hic" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </span>

                                      <!-- 戶籍謄本狀態 -->
                                      <span :class="[
                                      'px-3 py-1 rounded-md text-sm flex items-center gap-1',
                                      item.hrt ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      ]">
                                      <span>戶籍謄本</span>
                                      <svg v-if="item.hrt" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      </span>

                                      <!-- 戶口名簿狀態 -->
                                      <span :class="[
                                      'px-3 py-1 rounded-md text-sm flex items-center gap-1',
                                      item.hc ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      ]">
                                      <span>戶口名簿</span>
                                      <svg v-if="item.hc" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      </span>
                                  </div>
                                  </div>
                              </td>
                          </tr>
                        </template>
                    </tbody>
                </table>
                </div>
                <div class="mt-6 flex flex-col items-center">
                  <!-- 總筆數顯示 -->
                  <div class="w-full text-gray-500 text-sm mb-4">
                    共 {{ total }} 筆
                  </div>

                  <!-- 分頁組件 -->
                  <div class="w-full flex justify-center">
                    <v-pagination
                      v-if="totalPages > 1"
                      v-model="currentPage"
                      :length="totalPages"
                      :total-visible="7"
                      @update:model-value="handlePageChange"
                      color="primary"
                      rounded
                      show-first-last-page
                      first-icon="mdi-page-first"
                      last-icon="mdi-page-last"
                      prev-icon="mdi-chevron-left"
                      next-icon="mdi-chevron-right"
                    />
                  </div>
                </div>
            </div>
        </div>

          <!-- 按鈕群組 -->
          <div v-if="items.length" class="mt-6 flex justify-end space-x-4">
            <button 
              @click="handleBack"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              返回
            </button>
          </div>
        </div>
      </main>
    </div>
  </v-main>
</v-layout>
</template>

<style scoped>

</style>