<script setup>
import Sidebar from '/components/backsite/common/Sidebar.vue'
import Header from '/components/backsite/common/Header.vue'

definePageMeta({
  layout: 'backsite',
  middleware: ['auth']
})
</script>

<template>
  <v-layout class="rounded rounded-md">
    <Sidebar />
    <Header />
    
    <v-main class="d-flex align-center justify-center" style="min-height: 300px;">
      <div class="text-center">
        <h1 class="text-h4 mb-4">E股領後台首頁</h1>
      </div>
    </v-main>
  </v-layout>
</template>