<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Loading from '~/components/common/Loading.vue'
import ErrorMsg from '~/components/common/ErrorMsg.vue'

definePageMeta({
  layout: 'backsite',
})

const authStore = useAuthStore()
const isLoading = ref(true)
const error = ref(null)

// 角色相關
const roles = ref([])
const selectedRole = ref('')

// 功能相關
const features = ref([])
const selectedFeatures = ref([])
const authorizedFeatures = ref([])

// 取得角色選單
const fetchRoles = async () => {
  try {
    const response = await fetch('/index.php/api/admin/users/options', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = await response.json()
    if (data.status) {
      roles.value = data.data
    }
  } catch (err) {
    error.value = '取得角色資料失敗'
  }
}

// 取得所有功能
const fetchFeatures = async () => {
  try {
    const response = await fetch('/index.php/api/admin/permission', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = await response.json()
    if (data.status) {
      features.value = data.data
    }
  } catch (err) {
    error.value = '取得功能資料失敗'
  }
}

// 取得角色功能權限
const fetchRoleFeatures = async (roleId) => {
  try {
    const response = await fetch(`/index.php/api/admin/permission/${roleId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = await response.json()
    if (data.status) {
      // 儲存授權狀態
      authorizedFeatures.value = data.data
      // 設置已授權的功能ID
      selectedFeatures.value = data.data
        .filter(item => item.authorized)
        .map(item => Number(item.id))
    }
  } catch (err) {
    error.value = '取得角色權限失敗'
  }
}

// 更新角色權限
const updateRoleFeatures = async () => {
  try {
    const response = await fetch(`/index.php/api/admin/permission/${selectedRole.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        featureIds: selectedFeatures.value
      })
    })
    const data = await response.json()
    if (data.status) {
      alert('權限更新成功')
    }
  } catch (err) {
    error.value = '更新權限失敗'
  }
}

// 角色選擇處理
const handleRoleChange = async (roleId) => {
  if (!roleId) {
    selectedRole.value = ''
    selectedFeatures.value = []
    authorizedFeatures.value = []
    return
  }
  
  selectedRole.value = roleId
  await fetchRoleFeatures(roleId)
}

// 新增輔助函數
const normalizeId = (id) => String(id)
const denormalizeId = (id) => Number(id)

// 修改 isFeatureAuthorized
const isFeatureAuthorized = (featureValue) => {
  const normalizedId = normalizeId(featureValue)
  const feature = authorizedFeatures.value.find(f => f.id === normalizedId)
  return feature?.authorized || false
}

const handleFeatureChange = (featureValue, checked) => {
  const id = denormalizeId(featureValue)
  if (checked) {
    if (!selectedFeatures.value.includes(id)) {
      selectedFeatures.value.push(id)
    }
  } else {
    selectedFeatures.value = selectedFeatures.value.filter(fid => fid !== id)
  }
}

onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.all([fetchRoles(), fetchFeatures()])
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    
    <v-main class="px-6 py-4 mt-15">
      <div v-if="isLoading">
        <Loading />
      </div>
      <div v-else-if="error">
        <ErrorMsg :message="error" />
      </div>
      <div v-else class="max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold mb-6">權限管理</h2>
        
        <!-- 角色選單 -->
        <div class="mb-8">
          <label class="block text-sm font-medium text-gray-700 mb-2">選擇角色</label>
           <select 
                v-model="selectedRole"
                @change="handleRoleChange($event.target.value)"
                class="w-full p-2 border rounded-md"
            >
                <option value="">請選擇角色</option>
                <option 
                v-for="role in roles" 
                :key="role.value" 
                :value="role.value"
                >
                {{ role.label }}
                </option>
            </select>
        </div>
        
        <!-- 功能選項 -->
        <div v-if="selectedRole" class="space-y-4">
            <h3 class="text-xl font-semibold mb-4">功能權限設定</h3>
            <div class="grid grid-cols-3 gap-4">
            <div 
                v-for="feature in features" 
                :key="feature.value" 
                class="flex items-center space-x-2"
            >
            <input 
              type="checkbox"
              :id="feature.value"
              :value="feature.value"
              :checked="isFeatureAuthorized(feature.value)"
              @change="(e) => handleFeatureChange(feature.value, e.target.checked)"
              class="rounded"
            >
                <label :for="feature.value">{{ feature.label }}</label>
            </div>
            </div>
            
            <!-- 儲存按鈕 -->
            <div class="mt-8">
            <button 
                @click="updateRoleFeatures"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                儲存權限設定
            </button>
            </div>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<style scoped>
.v-main {
  background-color: #f3f4f6;
}
</style>