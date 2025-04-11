<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ScrollToTop from '~/components/common/ScrollToTop.vue'
import { useRouter } from 'vue-router'
const router = useRouter()

definePageMeta({
  title: '我的子帳號'
})

const authStore = useAuthStore()

// 三點下拉
const showDropdown = ref(false)
const showDeleteConfirm = ref(false)
const deleteItemId = ref(null)
const isSubmitted = ref(false)
const isLoading = ref(true)
const error = ref(null)
// 子帳號
const keyword = ref('')

const newUser = ref({
  idCardNum: '',
  name: '',
  memo: '',
  agreementChecked: false
})

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
const showAddModal = ref(false)
const activeTab = ref('content')
const uploadTime = ref('')
// 子帳號
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(0)
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
    // 更新 URL 參數
    router.push({
        query: {
            page: '1',
            keyword: keyword.value || undefined
        }
    })
    
    currentPage.value = 1
    fetchSubAccounts()
}

// 抓取子帳號列表
const fetchSubAccounts = async () => {
    isLoading.value = true
    error.value = null
    
    try {
        const queryParams = new URLSearchParams({
            page: currentPage.value.toString(),
            ...(keyword.value && { keyword: keyword.value })
        }).toString()

        const response = await fetch(`/index.php/api/client/subAccount?${queryParams}`, {
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
            items.value = result.data.items.map(item => ({
                id: item.id,
                idCardNum: item.idCardNum,
                name: item.name,
                memo: item.memo,
                idCard: item.idCard,
                drivingLicense: item.drivingLicense,
                hic: item.healthCard,
                hrt: item.hrt,
                hc: item.hc,
                owner: item.owner,
                isHovered: false,
                showDropdown: false
            }))
            
            total.value = result.data.total
            currentPage.value = Number(result.data.page)
            totalPages.value = Number(result.data.totalPages)
        } else {
            error.value = result.message || '獲取資料失敗'
        }
    } catch (error) {
        error.value = '系統錯誤'
        console.error('API請求失敗:', error)
    } finally {
        isLoading.value = false
    }
}

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

const handleSubmitNewUser = async () => {
  try {
    isSubmitted.value = true

    if (!newUser.value.idCardNum || !newUser.value.name) {
      alert('請填寫必填欄位')
      return
    }
    // 檢查是否同意個資聲明
    if (!newUser.value.agreementChecked) {
      alert('請先同意個資聲明')
      return
    }

    // 準備 API 請求資料
    const payload = {
      idCardNum: newUser.value.idCardNum,
      name: newUser.value.name,
      memo: newUser.value.memo,
    }

    const response = await fetch('/index.php/api/client/subAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    // 根據 API 回應來顯示相應訊息
    if (data.status) {
      alert(data.message) // 顯示"新增成功"
      showAddModal.value = false
      // 重置表單
      newUser.value = {
        idCardNum: '',
        name: '',
        memo: '',
        agreementChecked: false
      }
    } else {
      // 顯示錯誤訊息
      alert(data.message)
    }
     // 無論成功或失敗都重置表單
     newUser.value = {
      idCardNum: '',
      name: '',
      memo: '',
      agreementChecked: false
    }

  } catch (error) {
    console.error('錯誤:', error)
    // 如果是授權相關錯誤，可能需要重新登入
    if (error.response?.status === 401) {
      authStore.clearAuth()
      alert('登入已過期，請重新登入')
    } else {
      alert('新增失敗，請稍後再試')
    }
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
    isSubmitted.value = true

    // 驗證必填欄位
    if (!formData.value.name) {
        alert('請填寫必填欄位')
        return
    }
  try {
    console.log('要更新的子帳號ID:', formData.value.id)
    console.log('更新前的檔案狀態:', selectedFiles.value)
    // 準備要更新的資料，包含證件狀態
    const payload = {
        name: formData.value.name,
        memo: formData.value.note
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
  isSubmitted.value = false
}


const handleDelete = async () => {
  try {
    const response = await fetch(`/index.php/api/client/subAccount/${deleteItemId.value}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (result.status) {
      alert('刪除成功')
      showDeleteConfirm.value = false
      deleteItemId.value = null
      await fetchSubAccounts() // 重新獲取列表
    } else {
      alert(result.message || '刪除失敗')
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('系統發生錯誤，請稍後再試')
  }
}

const changePage = async (page) => {
    currentPage.value = page
    await fetchSubAccounts()
    
    // 更新 URL 參數
    router.push({
        query: {
            ...router.currentRoute.value.query,
            page: page.toString()
        }
    })
}

// 抓取子帳號列表組件掛載時獲取資料
onMounted(async() => {
    await nextTick()
    await fetchSubAccounts()
})
</script>

<template>
    <div>
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-8 px-4">
      <ScrollToTop />
    </div>

    <div class="min-h-[75vh] bg-white">
        <!-- todo Breadcrumb -->
        <div class="bg-white p-4 sm:p-6 mb-6 border-t border-gray-200">
            <div class="w-full max-w-[1760px] mx-auto mt-2 sm:mt-5 px-4 sm:px-6">
                <!-- 麵包屑導航 -->
                <p class="text-xs sm:text-sm text-gray-600 flex items-center flex-wrap gap-2">
                    <NuxtLink to="/" class="hover:text-primary transition-colors inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke-width="1.5" 
                            stroke="currentColor" 
                            class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2">
                            <path stroke-linecap="round" 
                                stroke-linejoin="round" 
                                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        首頁
                    </NuxtLink>
                    <span class="text-gray-400">/</span>
                    <span>會員管理</span>
                    <span class="text-gray-400">/</span>
                    <span>我的子帳號</span>
                </p>
                
                <!-- 頁面標題 -->
                <h1 class="text-xl sm:text-2xl mt-4 sm:mt-8 font-bold text-gray-900">我的子帳號</h1>
            </div>
        </div>

        <!-- todo 搜尋 -->
        <div class="w-full max-w-[1760px] mx-auto px-4 sm:px-6">
            <div class="flex items-center gap-4">
                <!-- 搜尋輸入框 -->
                <div class="flex w-full border border-teal-400 rounded-lg overflow-hidden">
                    <input
                        v-model="keyword"
                        type="text"
                        placeholder="姓名或身分證字號"
                        @input="handleSearch"
                        class="flex-1 h-10 sm:h-12 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 outline-none"
                    />
                    <button class="px-3 sm:px-4 py-2 text-teal-400 hover:bg-teal-100 transition-colors">
                        <svg class="w-4 h-4 sm:w-5 sm:h-5" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor">
                            <path stroke-linecap="round" 
                                stroke-linejoin="round" 
                                stroke-width="2" 
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1117.5 9a7.5 7.5 0 01-4.85 7.65z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- todo 報表標題 -->
        <div class="w-full max-w-[1760px] mx-auto px-4 sm:px-6">
            <div class="flex items-center justify-between bg-white py-4 sm:py-6 rounded-lg mt-4 border-gray-200">
                <!-- 右側按鈕群組 -->
                <div class="flex items-center gap-2 sm:gap-4">
                     <!-- 新增按鈕 -->
                <v-dialog max-width="560">
                    <!-- 觸發按鈕 -->
                    <template v-slot:activator="{ props }">
                    <button 
                        v-bind="props"
                        class="bg-[#0F93A2] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#0d8291] flex items-center text-sm sm:text-base"
                    >
                        <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        新增
                    </button>
                    </template>

                    <!-- Dialog 內容 -->
                    <template v-slot:default="{ isActive }">
                        <v-card>
                            <!-- 標題與關閉按鈕 -->
                            <v-card-title class="d-flex justify-space-between align-center border-b">
                            <span class="text-lg sm:text-xl font-medium">新增子帳號</span>
                            <v-btn icon @click="isActive.value = false">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                            </v-card-title>

                            <v-card-text class="p-4 sm:p-6">
                                <!-- 表單內容 -->
                                <form @submit.prevent="handleSubmitNewUser" class="space-y-4">
                                    <!-- 身分證字號 -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">
                                            身分證字號<span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                            v-model="newUser.idCardNum"
                                            type="text"
                                            required
                                            placeholder="請輸入身分證字號"
                                            :class="[
                                                'w-full h-10 sm:h-12 px-3 sm:px-4 py-2 text-xs sm:text-sm border rounded-xl transition-colors',
                                                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50',
                                                !newUser.idCardNum && isSubmitted ? 'border-red-500' : 'border-gray-300'
                                            ]"
                                        />
                                        <p v-if="!newUser.idCardNum && isSubmitted" class="text-xs sm:text-sm text-red-500">
                                            請輸入身分證字號
                                        </p>
                                    </div>

                                    <!-- 姓名 -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">
                                            姓名<span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                            v-model="newUser.name"
                                            type="text"
                                            required
                                            placeholder="請輸入姓名以比對委託繳交項目"
                                            :class="[
                                                'w-full h-10 sm:h-12 px-3 sm:px-4 py-2 text-xs sm:text-sm border rounded-xl transition-colors',
                                                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50',
                                                !newUser.name && isSubmitted ? 'border-red-500' : 'border-gray-300'
                                            ]"
                                        />
                                        <p v-if="!newUser.name && isSubmitted" class="text-xs sm:text-sm text-red-500">
                                            請輸入姓名
                                        </p>
                                    </div>

                                    <!-- 備註 -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">備註</label>
                                        <input 
                                            v-model="newUser.memo"
                                            type="text"
                                            placeholder="請輸入想標註事項"
                                            class="w-full h-10 sm:h-12 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                                        />
                                    </div>

                                    <!-- 個資提供同意書區塊 -->
                                    <div class="border rounded-lg p-4 sm:p-6 bg-gray-50">
                                        <h3 class="text-base sm:text-lg font-medium mb-4">蒐集個人資料告知事項暨個人資料提供同意書</h3>
                                        
                                        <!-- 可滾動內容區域 -->
                                        <div class="h-[250px] sm:h-[300px] overflow-y-auto bg-white p-4 rounded border mb-4">
                                            <div class="space-y-4">
                                                <h4 class="font-medium">蒐集個人資料告知事項</h4>
                                                <p class="text-gray-600">股代網為遵守個人資料保護法規定，在您提供個人資料予本站前，依法告知下列事項：</p>
                                                
                                                <div class="space-y-2 text-gray-600">
                                                    <p>一、股代網(以下簡稱本站)因協助代領股東會紀念品等目的而獲取您下列個人資料類別：姓名、國民身分證統一編號、性別、證件圖檔、連絡方式(包括但不限於電話號碼、E-MAIL、居住或工作地址)等，或其他得以直接或間接識別您個人之資料。</p>
                                                    <p>二、本站將依個人資料保護法及相關法令之規定下，依本站隱私權保護政策，蒐集、處理及利用您的個人資料。</p>
                                                    <p>三、本站將於蒐集目的之存續期間合理利用您的個人資料。</p>
                                                    <p>四、除蒐集之目的涉及國際業務或活動外，本站僅於中華民國領域內利用您的個人資料。</p>
                                                    <p>五、本站將於原蒐集之特定目的、協助代領股東會紀念品、以及其他上市櫃/興櫃公司請求審查協助之目的範圍內，合理利用您的個人資料。</p>
                                                    <p>六、您可依個人資料保護法第3條規定，就您的個人資料向本站行使之下列權利：</p>
                                                    <div class="ml-4">
                                                        <p>(一)查詢或請求閱覽。</p>
                                                        <p>(二)請求製給複製本。</p>
                                                        <p>(三)請求補充或更正。</p>
                                                        <p>(四)請求停止蒐集、處理及利用。</p>
                                                        <p>(五)請求刪除。</p>
                                                    </div>
                                                    <p>您因行使上述權利而導致對您的權益產生減損時，本站不負相關賠償責任。另依個人資料保護法第14條規定，本站得酌收行政作業費用。</p>
                                                    <p>七、若您未提供正確之個人資料，本站將無法為您提供特定目的之相關業務。</p>
                                                    <p>八、本站因業務需要而委託其他機關處理您的個人資料時，本站將會善盡監督之責。</p>
                                                    <p>九、您瞭解此一同意書符合個人資料保護法及相關法規之要求，且同意本站留存此同意書，供日後取出查驗。</p>
                                                </div>

                                                <h4 class="font-medium mt-6">個人資料之同意提供</h4>
                                                <div class="space-y-2 text-gray-600">
                                                    <p>一、本人已充分知悉貴站上述告知事項。</p>
                                                    <p>二、本人同意貴站蒐集、處理、利用本人之個人資料，以及其他上市櫃/興櫃公司請求代領協助目的之提供。</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 同意勾選 -->
                                        <div class="flex items-center gap-2">
                                            <input 
                                                v-model="newUser.agreementChecked"
                                                type="checkbox"
                                                class="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                            />
                                            <label class="text-xs sm:text-sm text-gray-700">我已了解並同意以上內容</label>
                                        </div>
                                    </div>

                                    <!-- 個資提供同意書群組 -->
                                    <div class="flex justify-end gap-2 sm:gap-4 mt-6 sm:mt-8">
                                        <button 
                                            type="button"
                                            @click="showAddModal = false"
                                            class="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            取消
                                        </button>
                                        <button 
                                            type="submit"
                                            :disabled="!newUser.agreementChecked"
                                            class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-teal-600 text-white rounded-md disabled:bg-gray-400"
                                        >
                                            確認新增
                                        </button>
                                    </div>
                                </form>
                            </v-card-text>
                        </v-card>
                    </template>
                </v-dialog>
                </div>
            </div>
        </div>


        <!-- todo 報表內容 -->
        <div class="w-full max-w-[1760px] mx-auto mt-4 mb-40 px-4 sm:px-6">
            <div class="overflow-x-auto">
                    <div>
                        <!-- 標題和總筆數 -->
                        <div class="mb-4">
                            <h3 class="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-4">子帳號列表</h3>
                        </div>

                            <!-- 無資料時的提示 -->
                            <div v-if="!items.length" class="space-y-4 sm:space-y-6">
                                <div class="flex flex-col items-center justify-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
                                    <svg class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p class="text-base sm:text-lg text-gray-600 font-medium">無子帳號資料</p>
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
                                }"
                                @mouseover="item.isHovered = true"
                                @mouseleave="item.isHovered = false"
                                >
                                <!-- 第一格 -->
                                <td class="py-3 sm:py-4 px-4 sm:px-6 w-1/2">
                                    <div class="flex items-center">
                                    <div class="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-4"></div>
                                    <span class="text-sm sm:text-base text-gray-600">
                                        - {{ item.name }} {{ item.idCardNum }} ({{ item.owner }} 持有)
                                    </span>
                                    </div>
                                </td>
                                
                                <!-- 第二格 -->
                                <td class="py-3 sm:py-4 px-4 sm:px-6 w-1/2">
                                    <div class="flex items-center justify-between">
                                    <!-- 備註內容 -->
                                    <div class="flex items-center">
                                        <span class="text-sm sm:text-base font-medium text-gray-700 mr-2">備註</span>
                                        <span class="text-sm sm:text-base text-gray-500">{{ item.memo || '--' }}</span>
                                    </div>
                                    
                                    <!-- 三點圖示下拉選單 -->
                                    <div class="relative">
                                        <button 
                                        @click.stop="toggleDropdown(item)"
                                        class="p-1 sm:p-2 text-gray-500 hover:text-gray-700"
                                        >
                                        <svg class="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                        </button>
                                        
                                        <!-- 下拉選單內容 -->
                                        <div
                                        v-if="item.showDropdown"
                                        :class="[
                                            'absolute right-0 w-32 sm:w-40 bg-white rounded-lg shadow-lg py-1 border border-gray-200 z-50',
                                            index === items.length - 1 ? 'bottom-full' : 'top-full'
                                        ]"
                                        >
                                        <a 
                                            href="#" 
                                            class="block px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-100"
                                            @click.prevent="handleEditClick(item.id)"
                                        >修改</a>
                                        <a 
                                            href="#" 
                                            class="block px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-red-600 hover:bg-gray-100"
                                            @click.prevent="deleteItemId = item.id; showDeleteConfirm = true"
                                        >刪除</a>
                                        </div>
                                    </div>
                                    </div>
                                </td>
                                </tr>
                                <!-- TODO 修改彈出視窗 -->
                                <div 
                                    v-if="showPaymentModal" 
                                    class="modal fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-6"
                                    >
                                    <div class="bg-white rounded-lg p-4 sm:p-8 w-full max-w-[95%] sm:max-w-[960px]">
                                        <!-- 標題與關閉按鈕 -->
                                        <div class="flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-200">
                                        <h3 class="text-lg sm:text-xl font-medium">編輯子帳號</h3>
                                        <button 
                                            @click="showPaymentModal = false" 
                                            class="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        </div>

                                    <!-- 標籤頁切換 -->
                                    <div class="flex border-b border-gray-200 mt-4 sm:mt-6">
                                    <button 
                                        @click="activeTab = 'content'"
                                        :class="[
                                        'px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium',
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
                                    <div v-if="activeTab === 'content'" class="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                                    <!-- 身分證字號 -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">
                                        身分證字號
                                        <span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                        v-model="formData.idNumber"
                                        type="text"
                                        readonly
                                        required
                                        class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-gray-500"
                                        />
                                        <p class="text-xs sm:text-sm text-gray-600">懶股投軟體用戶必填，經懶股投投票後無法再行更改，將可能導致電投或代領流程發生錯誤。</p>
                                    </div>

                                    <!-- 姓名 -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">
                                        姓名
                                        <span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                        v-model="formData.name"
                                        type="text"
                                        required
                                        :class="[
                                            'w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500',
                                            !formData.name && isSubmitted ? 'border-red-500' : 'border-gray-300'
                                        ]"
                                        />
                                        <p v-if="!formData.name && isSubmitted" class="text-xs sm:text-sm text-red-500">
                                        請輸入姓名
                                        </p>
                                    </div>

                                    <!-- 備註 -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-700">備註</label>
                                        <input 
                                        v-model="formData.note"
                                        type="text"
                                        class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                                    <div class="flex justify-end gap-2 sm:gap-4 mt-6 sm:mt-8">
                                        <button 
                                            @click="handleCancel"
                                            class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200"
                                        >
                                            取消
                                        </button>
                                        <button 
                                            @click="updateSubAccount"
                                            class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-teal-600 text-white rounded-md hover:bg-teal-700"
                                        >
                                            更新
                                        </button>
                                    </div>
                                </div>
                                </div>

                                <!--TODO 刪除確認彈跳視窗 -->
                                <div 
                                v-if="showDeleteConfirm" 
                                class="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-0"
                                >
                                <div class="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[95%] sm:max-w-[400px]">
                                    <!-- 標題 -->
                                    <h3 class="text-base sm:text-lg font-medium mb-2 sm:mb-4">
                                    確認刪除
                                    </h3>
                                    
                                    <!-- 內容 -->
                                    <p class="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                                    確定要刪除這個子帳號嗎？此操作無法復原。
                                    </p>
                                    
                                    <!-- 按鈕群組 -->
                                    <div class="flex justify-end gap-2 sm:gap-4">
                                    <!-- 取消按鈕 -->
                                    <button 
                                        @click="showDeleteConfirm = false" 
                                        class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        取消
                                    </button>
                                    
                                    <!-- 確認刪除按鈕 -->
                                    <button 
                                        @click="handleDelete"
                                        class="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                    >
                                        確認刪除
                                    </button>
                                    </div>
                                </div>
                                </div>

                                <!-- 第二行 - 證件狀態 -->
                                <tr 
                                class="border-b border-gray-300"
                                :class="{
                                    'bg-white': index % 2 === 0,
                                    'bg-gray-50': index % 2 === 1
                                }"
                                >
                                <td class="py-3 sm:py-4 px-4 sm:px-6" colspan="2">
                                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <!-- 標題 -->
                                    <span class="text-sm sm:text-base font-medium text-gray-700 ml-4 sm:ml-6">正本</span>
                                    
                                    <!-- 證件狀態列表 -->
                                    <div class="flex flex-wrap gap-2 justify-start ml-4 sm:ml-0">
                                        <!-- 身分證狀態 -->
                                        <span :class="[
                                        'px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1',
                                        item.idCard ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        ]">
                                        <span>身分證正面</span>
                                        <svg v-if="item.idCard" class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        </span>

                                        <!-- 駕照狀態 -->
                                        <span :class="[
                                        'px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1',
                                        item.drivingLicense ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        ]">
                                        <span>駕照</span>
                                        <svg v-if="item.drivingLicense" class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        </span>

                                        <!-- 健保卡狀態 -->
                                        <span :class="[
                                        'px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1',
                                        item.hic ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        ]">
                                        <span>健保卡</span>
                                        <svg v-if="item.hic" class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        </span>

                                        <!-- 戶籍謄本狀態 -->
                                        <span :class="[
                                        'px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1',
                                        item.hrt ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        ]">
                                        <span>戶籍謄本</span>
                                        <svg v-if="item.hrt" class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        </span>

                                        <!-- 戶口名簿狀態 -->
                                        <span :class="[
                                        'px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1',
                                        item.hc ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        ]">
                                        <span>戶口名簿</span>
                                        <svg v-if="item.hc" class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                    <div class="mt-4 sm:mt-6">
                        <div class="text-xs sm:text-sm text-gray-500 flex justify-end">
                            共 {{ total }} 筆，{{ totalPages }} 頁
                        </div>
                        <!-- Loading 狀態 -->
                        <div v-if="isLoading" class="flex justify-center">
                            <Loading class="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>

                        <!-- 錯誤提示 -->
                        <div v-else-if="error" class="text-xs sm:text-sm text-red-600 text-center">
                            {{ error }}
                        </div>

                        
                        <!-- 分頁控制項 -->
                        <div v-else>
                            <v-pagination
                            v-if="totalPages > 1"
                            v-model="currentPage"
                            :length="totalPages"
                            :total-visible="5"
                            @update:model-value="changePage"
                            color="primary"
                            rounded
                            show-first-last-page
                            first-icon="mdi-page-first"
                            last-icon="mdi-page-last"
                            prev-icon="mdi-chevron-left"
                            next-icon="mdi-chevron-right"
                            class="mt-4 sm:mt-6 flex justify-center"
                            :class="{
                                'pagination-sm': $vuetify.display.smAndDown,
                                'pagination-md': $vuetify.display.mdAndUp
                            }"
                            />
                        </div>
                        </div>
                    </div>
            </div>
        </div>
    
    </div>
    </div>
</template>