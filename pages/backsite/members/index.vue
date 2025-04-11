<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRouter,useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const route = useRoute()
const authStore = useAuthStore()
const isLoading = ref(false)
const router = useRouter()
const memberData = ref([])      // 列表資料
const error = ref(null)
const currentPage = ref(1)      // 目前頁數
const totalPages = ref(1)       // 總頁數
const totalItems = ref(0)       // 總筆數
const locationOptions = ref([])
const groupOptions = ref([])
const searchKeyword = ref('')
const selectedRole = ref('')
const isRoleSelectOpen = ref(false)
const roleOptions = ref([]) 

const navigateToEdit = (id) => {
  // 保存搜尋條件到 localStorage
  const searchState = {
    page: currentPage.value,
    roleId: selectedRole.value,
    locationId: selectedLocation.value,
    groupId: selectedGroup.value,
    keyword: searchKeyword.value
  }
  localStorage.setItem('memberSearchState', JSON.stringify(searchState))
  
  // 導航到編輯頁面
  navigateTo(`/backsite/members/edit/${id}`)
}

// 查看詳細資料
const viewDetails = (id) => {
  // 保存搜尋條件到 localStorage
  const searchState = {
    page: currentPage.value,
    roleId: selectedRole.value,
    locationId: selectedLocation.value,
    groupId: selectedGroup.value,
    keyword: searchKeyword.value
  }
  localStorage.setItem('memberSearchState', JSON.stringify(searchState))
  
  // 導航到詳細頁面
  router.push(`/backsite/members/${id}`)
}

const isLocationSelectOpen = ref(false)
const isGroupSelectOpen = ref(false)

const handleLocationSelectClick = () => {
  isLocationSelectOpen.value = !isLocationSelectOpen.value
}

const handleLocationSelectBlur = () => {
  isLocationSelectOpen.value = false
}

const handleGroupSelectBlur = () => {
  isGroupSelectOpen.value = false
}

const handleRoleSelectClick = () => {
  isRoleSelectOpen.value = !isRoleSelectOpen.value
}

const handleRoleSelectBlur = () => {
  isRoleSelectOpen.value = false
}

// 新增選擇值
const selectedLocation = ref('')
const selectedGroup = ref('')

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
  if (!selectedLocation.value) {
    console.log('尚未選擇營運據點')
    return
  }

  // 發送獲取群組選項請求
  fetchGroupOptions(selectedLocation.value)
  
  // 切換下拉選單狀態
  isGroupSelectOpen.value = !isGroupSelectOpen.value
}

// 監聽據點變化
watch(() => selectedLocation.value, (newLocationId) => {
  if (newLocationId) {
    fetchGroupOptions(newLocationId)
  } else {
    groupOptions.value = []
  }
  selectedGroup.value = ''  // 清空群組選擇
})


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
        'Content-Type': 'application/json',
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
    console.log('角色選項回應:', result)
    
    if (result.status && result.data) {
      roleOptions.value = result.data
    }
  } catch (error) {
    console.error('取得角色選項失敗:', error)
  }
}

// 在 onMounted 中恢復搜尋條件
onMounted(() => {
  // 嘗試從 localStorage 恢復搜尋狀態
  const savedState = localStorage.getItem('memberSearchState')
  
  if (savedState) {
    const { page, roleId, locationId, groupId, keyword } = JSON.parse(savedState)
    currentPage.value = parseInt(page) || 1
    selectedRole.value = roleId || ''
    selectedLocation.value = locationId || ''
    selectedGroup.value = groupId || ''
    searchKeyword.value = keyword || ''
    
    // 清除已使用的狀態
    localStorage.removeItem('memberSearchState')
  } else {
    // 如果沒有儲存的狀態，使用 URL 參數
    const { page, roleId, locationId, groupId, keyword } = route.query
    currentPage.value = parseInt(page) || 1
    selectedRole.value = roleId || ''
    selectedLocation.value = locationId || ''
    selectedGroup.value = groupId || ''
    searchKeyword.value = keyword || ''
  }
  
  fetchMembers()
  fetchLocationOptions()
  fetchRoleOptions()
})

// 修改 fetchMembers 函數
const fetchMembers = async (page = currentPage.value) => {
  try {
    isLoading.value = true
    error.value = null
    
    // 建立查詢參數
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(selectedRole.value && { roleId: selectedRole.value }),
      ...(selectedLocation.value && { locationId: selectedLocation.value }),
      ...(selectedGroup.value && { groupId: selectedGroup.value }),
      ...(searchKeyword.value && { keyword: searchKeyword.value })
    }).toString()
    
    const response = await fetch(`/index.php/api/admin/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    const result = await response.json()
    console.log('會員列表回應:', result)
    
    if (result.status) {
      memberData.value = result.data.items
      currentPage.value = parseInt(result.data.page)
      totalPages.value = parseInt(result.data.totalPages)
      totalItems.value = parseInt(result.data.total)
    } else {
      error.value = result.message || '獲取資料失敗'
    }
  } catch (err) {
    error.value = '系統發生錯誤'
    console.error('獲取會員列表失敗:', err)
  } finally {
    isLoading.value = false
  }
}

// 新增搜尋處理函數
const handleSearch = () => {
  // 更新 URL 參數
  router.push({
    query: {
      page: 1,
      roleId: selectedRole.value || undefined,
      locationId: selectedLocation.value || undefined,
      groupId: selectedGroup.value || undefined,
      keyword: searchKeyword.value || undefined
    }
  })
  
  fetchMembers(1)
}

// 清除條件
const clearFilters = () => {
  selectedLocation.value = ''
  selectedGroup.value = ''
  selectedRole.value = ''
  searchKeyword.value = ''
  
  router.push({ query: {} })
  fetchMembers(1)
}

// 換頁處理
const changePage = (page) => {
  currentPage.value = page

  router.push({
    query: {
      ...route.query,
      page: page.toString()
    }
  })
  
  fetchMembers()
}

const handleDelete = async (id) => {
  // 確認對話框
  if (!confirm('確定要刪除此會員嗎？')) {
    return
  }

  try {
    const response = await fetch(`/index.php/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (result.status) {
      // 刪除成功
      alert('刪除成功')
      // 重新載入列表
      fetchMembers(currentPage.value)
    } else {
      alert(result.message || '刪除失敗')
    }
  } catch (error) {
    console.error('刪除會員失敗:', error)
    alert('系統發生錯誤')
  }
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
              title: '會員管理',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full member-content">
          <div class="flex items-center border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-[#8ADCE7] py-4 px-6 w-full">
                <!-- 左側搜尋區塊 -->
                <div class="flex-1 flex items-center gap-3">
                <!-- 據點選擇 -->
                <div class="w-[180px] relative">
                    <select
                      v-model="selectedLocation"
                      @click="handleLocationSelectClick"
                      @blur="handleLocationSelectBlur"
                      class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer pr-10"
                    >
                      <option value="">請選擇據點</option>
                      <option 
                      v-for="location in locationOptions" 
                      :key="location.value"
                      :value="location.value"
                      >
                        {{ location.label }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F93A2]">
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

                  <!-- 群組選擇 -->
                  <div class="w-[180px] relative">
                    <select
                      v-model="selectedGroup"
                      @click="handleGroupSelectClick"
                      @blur="handleGroupSelectBlur"
                      class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer pr-10"
                      :disabled="!selectedLocation"
                    >
                    <option value="">請選擇群組</option>
                    <option 
                    v-for="group in groupOptions" 
                    :key="group.value"
                    :value="group.value"
                    >
                      {{ group.label }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F93A2]">
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

                    <!-- 角色選擇 -->
                  <div class="w-[180px] relative">
                    <select
                      v-model="selectedRole"
                      @click="handleRoleSelectClick"
                      @blur="handleRoleSelectBlur"
                      class="w-full h-[48px] text-sm border-[1px] border-solid border-[#0F93A2] rounded-[12px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white appearance-none cursor-pointer pr-10"
                    >
                      <option value="">請選擇角色</option>
                      <option 
                        v-for="role in roleOptions" 
                        :key="role.value"
                        :value="role.value"
                      >
                        {{ role.label }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0F93A2]">
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

                  <!-- todo 搜尋區域 -->
                  <div class="flex items-center gap-4">
                    <input 
                      v-model="searchKeyword"
                      class="w-[200px] h-[48px] border-[1px] border-solid !border-[#0F93A2] rounded-[12px] py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="請輸入姓名、電話" 
                    />
                    <button 
                      @click="clearFilters"
                      class="w-[100px] h-[48px] bg-[#004850] text-white rounded-[12px] transition-colors duration-200 hover:bg-[#003840]"
                    >
                      清除條件
                    </button>

                    <button 
                      @click="handleSearch"
                      class="w-[100px] h-[48px] bg-[#0F93A2] text-white rounded-[12px] flex items-center justify-center gap-1 transition-colors duration-200 hover:bg-[#0d8291]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                      搜尋
                    </button>
                  </div>
              </div>
              <!-- 右側按鈕 -->
              <router-link 
              to="/backsite/members/create" 
              class="flex-shrink-0 ml-auto"
            >
              <button class="add-btn w-[140px] h-[48px] bg-[#0F93A2] text-white px-4 py-2 rounded-[12px] flex items-center justify-center">
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
                新增會員
              </button>
            </router-link>
          </div>


          <!-- Loading 狀態 -->
          <div v-if="isLoading">
            <Loading />
          </div>
          <div v-else>
            <ErrorMsg 
              v-if="error" 
              :message="error"
            />
            <ErrorMsg 
              v-else-if="!memberData.length" 
              message="尚無會員資料"
            />
          </div>

          <div v-if="!isLoading && !error && memberData.length > 0" class="member-table mt-10">
            <div class="member-header table-header">
              <span class="member-location">據點</span>
              <span class="member-role">角色</span>
              <span class="member-group">群組</span>
              <span class="member-name">姓名</span>
              <span class="member-account">信箱</span>
              <span class="member-phone">手機</span>
              <span class="member-detail">詳細</span>
              <span class="member-edit">編輯</span>
              <span class="member-delete">刪除</span>
            </div>

            <div  class="scroll-content" style="overflow-y: auto; height: 55vh;">
              <div class="member-item" v-for="(item, index) in memberData" :key="item.id">
              <div 
                class="member-row"
                :class="[
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  'hover:bg-gray-100 transition-colors duration-150'
                ]"
              >
              <div class="member-location">{{ item.location }}</div>
                <div class="member-role">{{ item.role }}</div>
                <div class="member-group">{{ item.group }}</div>  
              <div class="member-name">{{ item.name }}</div>
                <div class="member-account">{{ item.email }}</div>
                <div class="member-phone">{{ item.phone }}</div>
                <span class="view-action">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewDetails(item.id)"
                  />
                </span>
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
                    @click="handleDelete(item.id)"
                  />
                </span>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-start w-full text-gray-500 text-sm">
          共 {{ totalItems }} 筆
        </div>
        <v-pagination
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
        />
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

.member-search input {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.member-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.member-row:hover {
  background-color: rgb(243 244 246) !important;
  cursor: pointer;
}


.member-row,
.member-header {
  display: grid;
  grid-template-columns: 1fr 
  2fr 
  1fr 
  1fr 
  1fr 
  1fr 
  0.5fr 
  0.5fr 
  0.5fr;
  padding: 12px;
  align-items: center;
  gap: 8px;
}

.member-row {
  border-bottom: 1px solid #ddd;
  transition: all 0.15s ease-in-out;
}

.member-row:hover {
  background-color: rgb(243 244 246) !important;
}

.member-name,
.member-account,
.member-phone,
.member-location,
.member-role,
.member-group {
  text-align: center;
}

.loading-state, .error-message, .no-data {
  text-align: center;
  padding: 20px;
}

</style>