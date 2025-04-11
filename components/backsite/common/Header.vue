<script setup>
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  try {
    // 清除認證資訊
    authStore.clearAuth()
    
    // 導向登入頁
    await navigateTo('/backsite/login')
  } catch (error) {
    console.error('登出錯誤:', error)
  }
}

const userMenu = [
  { title: '登出', icon: 'mdi-logout', action: handleLogout }
]


</script>

<template>
  <v-app-bar elevation="0" color="blue-darken-3">
    <v-app-bar-title class="text-white">
      <img 
        src="/egolinkLOGO.png" 
        alt="E股領後台管理系統"
        class="header-logo"
      />
    </v-app-bar-title>
    <v-spacer></v-spacer>
    
    <!-- 使用者選單 -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn
        v-bind="props"
        color="white"
        variant="text"
        class="d-flex align-center"
      >
      <span class="text-white me-2 text-xs md:text-sm">{{ authStore.userName }}</span>
      <v-icon color="white" class="text-base md:text-lg">mdi-account-circle</v-icon>
      </v-btn>
      </template>
      
      <v-list>
        <v-list-item
          v-for="(item, i) in userMenu"
          :key="i"
          :value="item"
          @click="item.action"
        >
        <v-list-item-title>
            <v-icon :icon="item.icon" class="me-2 text-base md:text-lg"></v-icon>
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  border-radius: 8px;
}

.header-logo {
  height: 45px;
  width: auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .header-logo {
    height: 24px;
  }
}
</style>