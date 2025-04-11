<!-- pages/about/index.vue -->
<script setup>
import ScrollToTop from '~/components/common/ScrollToTop.vue'

definePageMeta({
  title: '關於我們'
})


// Nuxt的頁面元資料
useHead({
  title: '關於E股領',
  meta: [
    {
      name: 'description',
      content: '了解E股領的服務內容：免電投、免證圖、免交單的便捷股票交易平台'
    }
  ]
});

</script>

<template>
  <div>
      <!-- ScrollToTop 按鈕 -->
      <div class="container mx-auto py-4 sm:py-6 lg:py-8 px-4">
      <ScrollToTop />
    </div>

      <div class="min-h-[75vh] bg-white">
          <!-- todo Breadcrumb -->
          <div class="bg-white p-4 mb-6 border-t border-gray-200">
            <div class="w-full max-w-[1760px] mx-auto mt-3 sm:mt-5 px-4">
              <p class="text-sm text-gray-600 flex items-center flex-wrap">
                <NuxtLink to="/" class="hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </NuxtLink>
                <span class="mx-2">/</span>
                <span>關於我們</span>
                <span class="mx-2">/</span>
                <span>關於安心E股領</span>
              </p>
            </div>
          </div>

          <!-- todo 內容區塊 -->
          <div class="max-w-6xl mx-auto px-4 py-4 sm:py-6 lg:py-8">
            <!-- 主要服務介紹 -->
            <div class="mb-8 sm:mb-12">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">安心e股領服務介紹</h2>
              <p class="text-base sm:text-lg text-gray-700 leading-relaxed mb-4">
                安心e股領提供從證券開戶、贈品表單更新、零股購買指導、電子投票協助，到領貨和配貨等一站式服務，讓您輕鬆掌握每一項流程。
              </p>
            </div>

            <!-- 服務特點列表 -->
            <div class="mb-8 sm:mb-12">
              <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">我們的特色服務</h3>
              <div class="space-y-4">
                <div class="flex items-start space-x-3 px-2 sm:px-4">
                  <svg class="w-6 h-6 text-teal-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-gray-700"><span class="font-medium">證券開戶：</span>我們提供專業營業員上門服務開戶，或是您可以選擇透過線上連結進行開戶。</p>
                </div>
                <div class="flex items-start space-x-3 px-2 sm:px-4">
                  <svg class="w-6 h-6 text-teal-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-gray-700"><span class="font-medium">定時更新：</span>我們會定期更新贈品表單，確保您隨時掌握最新資訊。</p>
                </div>
                <div class="flex items-start space-x-3 px-2 sm:px-4">
                  <svg class="w-6 h-6 text-teal-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-gray-700"><span class="font-medium">一股即可：</span>許多人不知道，其實只需要購買一股就能領取股東贈品，我們會詳細解說這一過程。</p>
                </div>
                <div class="flex items-start space-x-3 px-2 sm:px-4">
                  <svg class="w-6 h-6 text-teal-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-gray-700"><span class="font-medium">免費電子投票：</span>所有委託我們代領的股友均可免費使用我們的電子投票系統，輕鬆參與股東會議。</p>
                </div>
                <div class="flex items-start space-x-3 px-2 sm:px-4">
                  <svg class="w-6 h-6 text-teal-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p class="text-gray-700"><span class="font-medium">配送服務：</span>若需要郵寄贈品，我們將按實際運費收取費用。</p>
                </div>
              </div>
            </div>

            <!-- 零股領贈品流程說明 -->
            <div class="mb-8 sm:mb-12">
              <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">零股領贈品流程</h3>
              <div class="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <ol class="list-decimal list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                  <li>安心e股領將提供相關表單，供有興趣的股友參考（您還可以選擇額外購買其他您感興趣的股票）。</li>
                  <li>我們建議您將證券戶和零股證券戶分開管理，以避免混淆。</li>
                  <li>開戶後，我們會提供專業的指導協助您完成購股過程。</li>
                  <li>完成購買後，您可通過我們的電子投票系統進行線上投票。</li>
                </ol>
              </div>
            </div>

            <!-- 重要提醒事項 -->
            <div class="bg-blue-50 p-4 sm:p-6 rounded-lg mb-20">
              <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">重要提醒</h3>
              <div class="space-y-3 text-sm sm:text-base text-gray-700">
                <p>🗓 贈品發放時間：</p>
                <ul class="list-disc list-inside ml-2 sm:ml-4">
                  <li class="mb-2">常會會議：通常會在4月至7月進行。發放時間5月至9月</li>
                  <li>臨時會議：通常會在9月到隔年2月進行。發放時間9月至隔年2月</li>
                </ul>
                <p class="mt-3 sm:mt-4">
                  零股贈品領取條件：
您只需要在第一年購買零股，除非公司進行減資或合併（若有此情形，我們會通知您），否則您可以持續領取贈品。
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
</template>