<script setup>
import { ref, computed, watch, onMounted  } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useAuthStore } from '~/stores/auth'

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
    title: '出貨管理',
    href: '/backsite/shipping',
    disabled: false
  },
  {
    title: '修改出貨',
    disabled: true
  }
]

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id

// 驗證錯誤
const errors = ref({})
const isSubmitting = ref(false)
const formData = ref({
  id: '',
  number: '',
  date: '',
  memo: '',
  userName: '',
  phone: '',
})

const handleBack = () => {
  router.push('/backsite/shipping')
}

const shippingItems = ref([
  {
    stock: '',        // 改為 stock (2330 台積電)
    productName: '',  // 改為 productName
    qty: ''          // 改為 qty
  }
])

// 新增項目
const addItem = () => {
  shippingItems.value.push({
    stock: '',
    productName: '',
    qty: ''
  })
}

// 刪除項目
const removeItem = (index) => {
  shippingItems.value.splice(index, 1)
}

const fetchShipmentData = async () => {
  try {
    const response = await fetch(`/index.php/api/admin/shipment/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('網路回應不正確')
    }

    const result = await response.json()
    
    if (result.status) {
      // 更新表單資料
      formData.value = {
        id: result.data.id,
        number: result.data.number,
        date: result.data.date,
        memo: result.data.memo,
        userName: result.data.userName,
        phone: result.data.phone
      }

      // 更新項目列表
      shippingItems.value = result.data.items.map(item => ({
        stock: item.stock,
        productName: item.productName,
        qty: item.qty
      }))

      console.log('資料載入成功:', formData.value)
    } else {
      throw new Error(result.message || '獲取資料失敗')
    }
  } catch (error) {
    console.error('獲取出貨資料失敗:', error)
    alert('獲取資料失敗，請稍後再試')
  }
}

// 在元件掛載時獲取資料
onMounted(() => {
  if (id) {
    fetchShipmentData()
  }
})

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.number) {
    errors.value.number = '請輸入出貨單號'
  }
  if (!formData.value.userName) {
    errors.value.userName = '請輸入會員名稱'
  }
  if (!formData.value.date) {
    errors.value.date = '請選擇出貨日期'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  if (!validateForm()) {
    alert('請檢查必填欄位')
    return
  }

  isSubmitting.value = true

  try {
    const response = await fetch(`/index.php/api/admin/shipment/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: formData.value.number,
        date: formData.value.date,
        memo: formData.value.memo,
        userName: formData.value.userName,
        phone: formData.value.phone,
        items: shippingItems.value
      })
    })

    if (!response.ok) {
      throw new Error('網路回應不正確')
    }

    const result = await response.json()
    
    if (result.status) {
      alert('更新成功')
      router.push('/backsite/shipping')
    } else {
      throw new Error(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新出貨資料失敗:', error)
    alert('更新失敗：' + error.message)
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

            <h2 class="text-2xl font-semibold text-gray-800 mb-6">修改出貨</h2>

            <!-- 內容區域 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 出貨單號 -->
                <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-2">出貨單號</label>
                    <input 
                        type="text" 
                        v-model="formData.number"
                        class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
                        placeholder="請輸入出貨單號"
                        readonly
                    >
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-2">會員名稱</label>
                    <input 
                        type="text" 
                        v-model="formData.userName"
                        class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
                        placeholder="請輸入會員名稱"
                        readonly
                    >
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-2">手機</label>
                    <input 
                        type="text" 
                        v-model="formData.phone"
                        class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
                        placeholder="請輸入手機"
                        readonly
                    >
                </div>

                <!-- 出貨日期 -->
                <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">出貨日期</label>
                <input 
                    type="date" 
                    v-model="formData.date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                </div>

                <!-- 備註 -->
                <div class="col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-2">備註</label>
                <textarea 
                  v-model="formData.memo"
                  rows="3"
                  placeholder="請輸入備註"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
                </div>
            </div>

            <!-- 內容區域下方新增 -->
            <div class="col-span-full mt-6">
              <div class="shipping-table">
                <div class="shipping-header table-header">
                  <span class="shipping-stock">股東會</span>
                  <span class="shipping-gift">紀念品名稱</span>
                  <span class="shipping-qty">需求數量</span>
                </div>

                <div v-for="(item, index) in shippingItems" :key="index" class="shipping-item">
                  <div 
                    class="shipping-row"
                    :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                  >
                    <span class="shipping-stock">{{ item.stock }}</span>
                    <span class="shipping-gift">{{ item.productName }}</span>
                    <span class="shipping-qty">{{ item.qty }}</span>
                  </div>
                </div>
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

.shipping-table {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.shipping-header {
  background-color: #f5f5f5;
  padding: 12px;
  font-weight: bold;
}

.shipping-row,
.shipping-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  padding: 12px;
  align-items: center;
}

.shipping-row {
  border-bottom: 1px solid #ddd;
}

.shipping-row:hover {
  background-color: rgb(243 244 246) !important;
}

.shipping-stock,
.shipping-gift,
.shipping-qty {
  padding: 8px;
  font-size: 15px;
  color: black;
}

.shipping-qty {
  text-align: center;
}
</style>