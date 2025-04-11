<script setup>
defineProps({
  message: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="bg-red-100 border border-red-400 text-red-700 px-8 py-16 rounded-lg mt-4 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" 
      class="h-16 w-16 mx-auto mb-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
    <p class="text-xl font-medium">{{ message }}</p>
  </div>
</template>