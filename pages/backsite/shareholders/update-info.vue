<script setup>
import { ref,onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const isLoading = ref(false)
const error = ref(null)
const mopsData = ref([])

const editingRow = ref(null)
const editedData = ref({})

const options = ref({
  meetingType: [],
  marketType: [],
  giftStatus: [],
  documents: []
})

// 進入編輯模式
const startEditing = (item) => {
  editingRow.value = item.stockCode
  editedData.value = { ...item }
}

const fetchOptions = async () => {
  try {
    const response = await fetch('/index.php/api/options', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    if (result.status) {
      options.value = result.data
    } else {
      throw new Error(result.message || '獲取選項失敗')
    }
  } catch (err) {
    console.error('獲取選項失敗:', err)
    error.value = err.message || '系統錯誤，請稍後再試'
  }
}

const fetchMopsData = async () => {
  try {
    isLoading.value = true
    error.value = null

    if (!authStore.token) {
      throw new Error('未登入或登入已過期')
    }

    const response = await fetch('/index.php/api/admin/stock', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    if (result.status) {
      mopsData.value = result.data
    } else {
      throw new Error(result.message || '獲取資料失敗')
    }
  } catch (err) {
    console.error('獲取 MOPS 列表失敗:', err)
    error.value = err.message || '系統錯誤，請稍後再試'
    
    if (err.message.includes('未登入')) {
      navigateTo('/login')
    }
  } finally {
    isLoading.value = false
  }
}

const saveEditing = async (item) => {
  try {
    isLoading.value = true
    
    if (!authStore.token) {
      throw new Error('未登入或登入已過期')
    }

    // 只提取需要的欄位
    const updateData = {
      stockCode: editedData.value.stockCode,
      stockName: editedData.value.stockName,
      meetingDate: editedData.value.meetingDate,
      meetingType: editedData.value.meetingType,
      giftStatus: editedData.value.giftStatus,
      lastBuyDate: editedData.value.lastBuyDate,
      giftName: editedData.value.giftName || null
    }

    const response = await fetch('/index.php/api/admin/stock', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    })
    
    const result = await response.json()
    if (result.status) {
      await fetchMopsData() // 更新成功後重新獲取資料
      // 可以加入成功提示
      alert('更新成功')
    } else {
      throw new Error(result.message || '更新失敗')
    }
  } catch (err) {
    console.error('更新失敗:', err)
    error.value = err.message || '系統錯誤，請稍後再試'
    
    if (err.message.includes('未登入')) {
      navigateTo('/login')
    }
  } finally {
    isLoading.value = false
    editingRow.value = null
  }
}

// 取消編輯
const cancelEditing = () => {
  editingRow.value = null
  editedData.value = {}
}

onMounted(async () => {
  await fetchOptions()
  await fetchMopsData()
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
              title: '股東會資訊',
              href: '/backsite/shareholders',
              disabled: false
            },
            {
              title: '更新資訊',
              disabled: true
            }
          ]"
          divider="/"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>

        <div class="w-full mx-auto">
          <div class="w-full mx-auto">
            <div class="max-w-[1680px] border-[1px] border-solid border-[#0F93A2] rounded-[12px] bg-white p-6">
            <h2 class="text-xl font-medium mb-6">更新資訊</h2>

            <!-- Loading 狀態 -->
            <div v-if="isLoading" class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F93A2]"></div>
            </div>

            <!-- 錯誤訊息 -->
            <div v-else-if="error" class="text-red-500 text-center py-8">
                {{ error }}
            </div>

            <!-- 資料表格 -->
            <div v-else class="overflow-x-auto">
                <div class="min-w-[1500px] max-w-[2400px] mx-auto">
                    <div class="max-h-[600px] overflow-y-auto">
                        <table class="min-w-full border-collapse">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">股號</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">股名</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">開會資訊連結</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">發布時間</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">開會性質</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">開會日期</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">最後買進日</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">紀念品資訊</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">紀念品狀態</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">紀念品名稱</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">操作</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="item in mopsData" :key="item.stockCode" class="hover:bg-gray-50">
                                    <!-- 股票代號 (唯讀) -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {{ item.stockCode }}
                                    </td>
                                    
                                    <!-- 公司名稱 -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <template v-if="editingRow === item.stockCode">
                                            <input 
                                                v-model="editedData.stockName"
                                                type="text"
                                                class="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#0F93A2]"
                                            />
                                        </template>
                                        <template v-else>
                                            {{ item.stockName }}
                                        </template>
                                    </td>

                                    <!-- 連結 (唯讀) -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <a :href="item.link" target="_blank" class="text-[#0F93A2] hover:text-[#0d8291]">查看</a>
                                    </td>

                                    <!-- 發佈日期 (唯讀) -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {{ item.pubDate }}
                                    </td>

                                    <!-- 會議類型 -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      <template v-if="editingRow === item.stockCode">
                                        <select 
                                          v-model="editedData.meetingType"
                                          class="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#0F93A2]"
                                        >
                                          <option 
                                            v-for="type in options.meetingType" 
                                            :key="type.value" 
                                            :value="type.value"
                                          >
                                            {{ type.label }}
                                          </option>
                                        </select>
                                      </template>
                                      <template v-else>
                                        <span>
                                          {{ options.meetingType?.find(t => t.value === item.meetingType)?.label || item.meetingType }}
                                        </span>
                                      </template>
                                    </td>

                                    <!-- 開會日期 -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <template v-if="editingRow === item.stockCode">
                                            <input 
                                                v-model="editedData.meetingDate"
                                                type="date"
                                                class="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#0F93A2]"
                                            />
                                        </template>
                                        <template v-else>
                                            <span>{{ item.meetingDate }}</span>
                                        </template>
                                    </td>

                                    <!-- 最後買進日 -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <template v-if="editingRow === item.stockCode">
                                            <input 
                                                v-model="editedData.lastBuyDate"
                                                type="date"
                                                class="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#0F93A2]"
                                            />
                                        </template>
                                        <template v-else>
                                            <span>{{ item.lastBuyDate }}</span>
                                        </template>
                                    </td>

                                    <!-- 紀念品資訊 -->
                                    <td class="px-6 py-4 whitespace-normal text-sm text-gray-900">
                                        {{ item.giftInfo }}
                                    </td>

                                    <!-- 紀念品狀態 -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <template v-if="editingRow === item.stockCode">
                                            <select 
                                                v-model="editedData.giftStatus"
                                                class="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#0F93A2]"
                                            >
                                                <option 
                                                    v-for="status in options.giftStatus" 
                                                    :key="status.value" 
                                                    :value="status.value"
                                                >
                                                    {{ status.label }}
                                                </option>
                                            </select>
                                        </template>
                                        <template v-else>
                                            <span :class="{
                                                'text-green-600': item.giftStatus === 2 || item.giftStatus === 3,
                                                'text-yellow-600': item.giftStatus === 1,
                                                'text-gray-400': item.giftStatus === 0
                                            }">
                                                {{ options.giftStatus?.find(s => s.value === item.giftStatus)?.label || '未設定' }}
                                            </span>
                                        </template>
                                    </td>

                                    <!-- 紀念品名稱 -->
                                    <td class="px-6 py-4 whitespace-normal text-sm text-gray-900">
                                        <template v-if="editingRow === item.stockCode">
                                            <input 
                                                v-model="editedData.giftName"
                                                type="text"
                                                class="w-full px-2 py-1 border rounded focus:outline-none focus:border-[#0F93A2]"
                                            />
                                        </template>
                                        <template v-else>
                                            {{ item.giftName }}
                                        </template>
                                    </td>

                                    <!-- 操作按鈕 -->
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        <template v-if="editingRow === item.stockCode">
                                            <div class="flex space-x-2">
                                                <button 
                                                    @click="saveEditing(item)"
                                                    class="text-green-600 hover:text-green-800"
                                                >
                                                    儲存
                                                </button>
                                                <button 
                                                    @click="cancelEditing"
                                                    class="text-red-600 hover:text-red-800"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        </template>
                                        <template v-else>
                                            <button 
                                                @click="startEditing(item)"
                                                class="text-[#0F93A2] hover:text-[#0d8291]"
                                            >
                                                編輯
                                            </button>
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </div>
        </div>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<style scoped>
.container-main {
  padding: 20px;
  width: 100%;
}

/* 表格捲動條美化 */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

/* 表格邊框樣式 */
table {
  border-spacing: 0;
}

th, td {
  border-bottom: 1px solid #e5e7eb;
}

tbody tr:last-child td {
  border-bottom: none;
}

input {
  background-color: white;
  border-color: #e5e7eb;
}

input:focus {
  border-color: #0F93A2;
  box-shadow: 0 0 0 1px #0F93A2;
}

/* 編輯按鈕樣式 */
button {
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

button:hover {
  opacity: 0.8;
}

.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px; /* Y軸捲動條寬度 */
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 3px;
}

/* 固定表頭 */
thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #f9fafb;
}

thead th {
    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.05);
}


td, th {
    min-width: 120px;
    padding: 0.5rem 0.5rem; /* 將左右內距從 0.75rem 改為 0.5rem */
    font-size: 0.875rem;
}

/* 特定欄位寬度調整 */
td:nth-child(1), th:nth-child(1) { /* 股號 */
    min-width: 70px;
    padding: 0.5rem 0.25rem;
}

td:nth-child(2), th:nth-child(2) { /* 股名 */
    min-width: 120px;
    padding: 0.5rem 0.5rem;
}

td:nth-child(3), th:nth-child(3) { /* 開會資訊連結 */
    min-width: 140px;
    padding: 0.5rem 0.25rem;
}

td:nth-child(4), th:nth-child(4) { /* 發布時間 */
    min-width: 100px;
    padding: 0.5rem 0.375rem;
}

td:nth-child(5), th:nth-child(5) { /* 開會性質 */
    min-width: 120px;
    padding: 0.5rem 0.375rem;
}

td:nth-child(6), th:nth-child(6), /* 開會日期 */
td:nth-child(7), th:nth-child(7) { /* 最後買進日 */
    min-width: 130px;
    width: 130px;
    padding: 0.5rem 0.375rem;
}

/* 確保日期輸入框寬度一致 */
input[type="date"] {
    width: 100%;
    min-width: 110px; /* 確保日期輸入框有足夠寬度 */
}

td:nth-child(8), th:nth-child(8) { /* 紀念品資訊 */
    min-width: 180px;
    padding: 0.5rem 0.5rem;
}

td:nth-child(9), th:nth-child(9) { /* 紀念品狀態 */
    min-width: 100px;
    padding: 0.5rem 0.375rem;
}

td:nth-child(10), th:nth-child(10) { /* 紀念品名稱 */
    min-width: 100px;
    padding: 0.5rem 0.5rem;
}

td:nth-child(11), th:nth-child(11) { /* 操作 */
    min-width: 40px;
    padding: 0.5rem 0.25rem;
}

input, select {
    padding: 0.25rem 0.375rem;
}

/* 調整表格容器的最大寬度和高度 */
.min-w-[1500px] {
    min-width: 1200px;
}

.max-h-[600px] {
    max-height: 500px;
}

/* 調整表格間距 */
.divide-y > * + * {
    margin-top: 0;
    border-top-width: 1px;
}
</style>