<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const id = route.params.id

const breadcrumbItems = [
  {
    title: '首頁',
    href: '/backsite',
    disabled: false
  },
  {
    title: '訂單管理',
    href: '/backsite/orders',
    disabled: false
  },
  {
    title: '訂單詳細',
    disabled: true
  }
]

const errors = ref({})
const isSubmitting = ref(false)

// 訂單詳細資料
const orderDetails = ref({
  subAccountName: '',
  mainAccountName: '',
  giftName: ''
})

// 獲取訂單詳細資料
onMounted(async () => {
  try {
    // const response = await fetch(`/api/orders/${id}`)
    // const data = await response.json()
    // orderDetails.value = data
  } catch (error) {
    console.error('Error:', error)
  }
})

const handleBack = () => {
  router.push('/backsite/orders')
}

</script>

<template>
  <div class="min-h-screen bg-white w-full flex">
    <Sidebar />
    <div class="flex-1 flex flex-col">
      <Header />
      <main class="flex-1 pt-24 px-6">
        <div class="max-w-7xl mx-auto bg-white p-6">
          <div class="mb-6">
            <v-breadcrumbs
              :items="breadcrumbItems"
              divider="/"
              class="mb-4 bg-white rounded-lg shadow-sm p-3 relative z-50"
            >
              <template v-slot:divider>
                <v-icon icon="mdi-chevron-right"></v-icon>
              </template>
            </v-breadcrumbs>
          </div>
          
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">編輯訂單</h2>
          
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 子帳號名稱 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">子帳號名稱</label>
              <div class="px-3 py-2 bg-gray-50 rounded-md">
                {{ orderDetails.subAccountName }}
              </div>
            </div>

            <!-- 所屬帳號 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">所屬帳號</label>
              <div class="px-3 py-2 bg-gray-50 rounded-md">
                {{ orderDetails.mainAccountName }}
              </div>
            </div>

            <!-- 紀念品 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">紀念品</label>
              <div class="px-3 py-2 bg-gray-50 rounded-md">
                {{ orderDetails.giftName }}
              </div>
            </div>
        </div>

          <!-- 按鈕群組 -->
          <div class="mt-6 flex justify-end space-x-4">
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
  </div>
</template>