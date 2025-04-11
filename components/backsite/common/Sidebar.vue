<script setup>
import { ref } from 'vue'

const rail = ref(false)
const drawer = ref(true)

const menuItems = [
  { title: '股東會資訊', icon: 'mdi-account-group', to: '/backsite/shareholders' },
  { title: '會員管理', icon: 'mdi-account-cog', to: '/backsite/members' },
  // { title: '訂單管理', icon: 'mdi-clipboard-list', to: '/backsite/orders' },
  { title: '進貨管理', icon: 'mdi-truck-delivery', to: '/backsite/purchase' },
  { title: '倉庫管理', icon: 'mdi-warehouse', to: '/backsite/warehouse' },
  { title: '出貨作業', icon: 'mdi-package-variant', to: '/backsite/shipping' },
  { title: '最新消息', icon: 'mdi-newspaper-variant', to: '/backsite/news' },
  { title: '營運據點', icon: 'mdi-map-marker-multiple', to: '/backsite/option' },
  { title: '常見問題', icon: 'mdi-frequently-asked-questions', to: '/backsite/qa' },
  { title: '權限管理', icon: 'mdi-shield-account', to: '/backsite/permissions' },
  // { title: '設定', icon: 'mdi-cog', to: '/backsite/settings' }
]
</script>

<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    color="grey-lighten-3"
    border="0"
    width="200" 
  >
    <v-list>
      <div class="d-flex align-center mb-2">
        <v-img
          src="/logo.png"
          :max-width="rail ? '35' : '100'"
          :class="rail ? 'me-2' : 'mx-2'"
          contain
        />
        <v-list-item
          :prepend-icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          title=""
          @click="rail = !rail"
          :class="rail ? 'px-2' : ''"
        >
        </v-list-item>

      </div>

      <v-divider></v-divider>

      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :value="item"
        :title="item.title"
        :prepend-icon="item.icon"
        :to="item.to"
        rounded="lg"
      >
      </v-list-item>
    </v-list>

    <template v-slot:bottom>
      <v-list>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Logout"
          rounded="lg"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.v-navigation-drawer :deep(.v-list-item--density-default) {
  min-height: 44px;
}

.v-img {
  transition: max-width 0.2s ease;
}
</style>