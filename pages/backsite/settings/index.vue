<script setup>
import { ref } from 'vue'
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'

definePageMeta({
  layout: 'backsite'
})

const settings = ref({
  basic: {
    title: '基本設定',
    items: [
      { id: 1, name: '網站名稱', value: 'EgoLink 電商平台', type: 'text' },
      { id: 2, name: '網站描述', value: '專業的電商管理平台', type: 'textarea' },
      { id: 3, name: '客服電話', value: '0800-123-456', type: 'text' },
      { id: 4, name: '客服信箱', value: 'service@egolink.com', type: 'email' }
    ]
  },
  system: {
    title: '系統設定',
    items: [
      { id: 5, name: '維護模式', value: false, type: 'switch' },
      { id: 6, name: '每頁顯示筆數', value: '20', type: 'number' },
      { id: 7, name: '系統時區', value: 'Asia/Taipei', type: 'select' }
    ]
  },
  notification: {
    title: '通知設定',
    items: [
      { id: 8, name: '訂單通知', value: true, type: 'switch' },
      { id: 9, name: '庫存警示', value: true, type: 'switch' },
      { id: 10, name: '會員註冊通知', value: false, type: 'switch' }
    ]
  },
})

const saveSettings = () => {
  // 實作儲存設定邏輯
}
</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    
    <v-main>
      <div class="container-main">
        <h1 class="text-h4 mb-6 text-center mt-5">系統設定</h1>
        
        <v-container class="d-flex justify-center">
          <v-row justify="center">
            <v-col cols="12" md="8">
              <v-card v-for="(section, key) in settings" :key="key" class="mb-6">
                <v-card-title>{{ section.title }}</v-card-title>
                <v-card-text>
                  <v-row v-for="item in section.items" :key="item.id" class="mb-3">
                    <v-col cols="4">{{ item.name }}</v-col>
                    <v-col cols="8">
                      <v-text-field
                        v-if="item.type === 'text' || item.type === 'email'"
                        v-model="item.value"
                        :type="item.type"
                        density="compact"
                        variant="outlined"
                      />
                      <v-textarea
                        v-else-if="item.type === 'textarea'"
                        v-model="item.value"
                        rows="3"
                        density="compact"
                        variant="outlined"
                      />
                      <v-switch
                        v-else-if="item.type === 'switch'"
                        v-model="item.value"
                        density="compact"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <button
                @click="saveSettings"
                class="w-full bg-[#0F93A2] text-white px-4 py-2 mt-4 rounded-lg hover:bg-[#0d8291] transition-colors duration-200"
              >
                儲存設定
              </button>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-main>
  </v-layout>
</template>

<style scoped>
.container-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>