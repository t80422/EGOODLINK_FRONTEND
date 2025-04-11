<script setup>
import ScrollToTop from '~/components/common/ScrollToTop.vue'

definePageMeta({
  title: '退換貨政策',
  description: '本網站退換貨政策說明'
})

</script>

<template>
  <div>
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-4 sm:py-8 px-4">
        <ScrollToTop />
    </div>

    <div class="min-h-[75vh] bg-white">
      <!-- Breadcrumb -->
      <div class="bg-white p-4 mb-4 sm:mb-6 border-t border-gray-200">
        <div class="w-full max-w-[1760px] mx-auto mt-3 sm:mt-5 px-4 lg:px-0">
          <p class="text-xs sm:text-sm text-gray-600 flex items-center">
            <NuxtLink to="/" class="hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </NuxtLink>
            <span class="mx-1 sm:mx-2">/</span>
            <span>退換貨政策</span>
          </p>
        </div>
      </div>

      <!-- 退換貨政策內容 -->
      <div class="max-w-5xl mx-auto bg-white mb-6 sm:mb-8 px-4 lg:px-0">
        <div class="p-4 sm:p-8 lg:p-12">
          <!-- 標題 -->
          <h1 class="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
            退換貨政策
          </h1>

          <!-- 退貨說明 -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              退貨說明
            </h2>
            <ul class="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-600">
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">1.</span>
                <p class="leading-relaxed">根據中華民國《消費者保護法》第19條規定，消費者享有七天的商品鑑賞期，計算天數自誠超商轉門市取貨當日起算。</p>
              </li>
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">2.</span>
                <p class="leading-relaxed">商品請勿試用，為保障衛生安全，除非商品本身存在瑕疵，拆封後恕無法辦理退換貨。</p>
              </li>
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">3.</span>
                <p class="leading-relaxed">退換貨時，請保持商品及所有配件的完整，商品必須是全新未拆封的狀態。如果外包裝已經拆開，將無法辦理退貨或退款。</p>
              </li>
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">4.</span>
                <p class="leading-relaxed">若收到商品超過七天，恕不接受退換。</p>
              </li>
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">5.</span>
                <p class="leading-relaxed">若需要進行退換貨，請提供訂單編號、退貨原因以及有效的聯絡方式。若選擇店外付款方式，請提供回覆聯絡，並且收到退貨申請後，我們會有專人協助您進行商品調度及退貨退款相關事宜。</p>
              </li>
            </ul>
          </div>

          <!-- 退款方式 -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              退款方式
            </h2>
            <ul class="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-600">
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">1.</span>
                <p class="leading-relaxed">若付款方式為ATM轉帳或銀行轉帳，確認退貨後，我們將於兩個營業日內安排匯款。</p>
              </li>
              <li class="flex gap-1 sm:gap-2">
                <span class="font-medium">2.</span>
                <p class="leading-relaxed">如需退換貨，請聯絡您購買或領取商品的服務據點客服，專人將協助您處理退換貨相關事宜。</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>