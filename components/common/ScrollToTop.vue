<script setup>
import { ref, inject, computed } from 'vue'

const isMobileMenuOpen = inject('isMobileMenuOpen', ref(false))

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const buttonVisibility = computed(() => !isMobileMenuOpen.value)
</script>

<template>
  <Transition name="slide-fade">
    <button
      v-if="buttonVisibility"
      class="fixed bottom-[40px] right-[20px] bg-teal-600/80 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-teal-700/90 transition-all duration-200 ease-in-out z-40"
      @click="scrollToTop"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        stroke-width="2"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* 確保在手機選單開啟時完全隱藏 */
:deep(.mobile-menu-open) .slide-fade-leave-active {
  transition: all 0.2s ease-out;
}
</style>