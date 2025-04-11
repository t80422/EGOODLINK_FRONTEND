<script setup>
import ScrollToTop from '~/components/common/ScrollToTop.vue'

definePageMeta({
  title: '隱私權政策',
  description: '本網站隱私權政策說明'
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
            <span>隱私權政策</span>
          </p>
        </div>
      </div>

      <!-- 隱私權政策內容 -->
      <div class="max-w-5xl mx-auto bg-white mb-6 sm:mb-8 px-4 lg:px-0">
        <div class="p-4 sm:p-8 lg:p-12">
          <h1 class="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
            隱私權政策
          </h1>

          <div class="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">
            感謝您使用我們的網站，為了保障您的權益，請您詳細閱讀以下條款。
          </div>

          <div class="space-y-6 sm:space-y-8">
            <!-- 第一章至第七章的內容保持不變 -->
             <!-- 各章節 -->
             <div class="space-y-8 sm:space-y-12">
            <!-- 第一章 -->
            <section>
              <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                一、隱私權保護政策適用範圍
                </h2>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  本隱私權保護政策說明了網站在您使用服務過程中如何處理您提供的個人資訊。此政策僅適用於本網站，並不涵蓋任何透過網站連結至的其他網站，亦不涉及本網站以外的第三方人員。
                </p>
            </section>

            <!-- 第二章 -->
            <section class="space-y-3 sm:space-y-4">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  二、個人資料的收集、處理與使用
                </h2>
                <ul class="list-disc list-inside space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      當您訪問本網站或使用我們提供的服務功能時，我們將根據服務性質，要求您提供必要的個人資料，並在特定用途範圍內處理和利用您的資料。
                      例如，在使用服務郵箱或參與問卷調查等互動功能時，網站將保留您提供的姓名、電子郵件、聯絡方式及使用時間等信息。在您進行一般瀏覽時，伺服器會自動記錄您的IP地址、瀏覽時間、所用瀏覽器類型及點擊行為等資料。
                  </p>
                </ul>
            </section>

            <!-- 第三章 -->
            <section class="space-y-3 sm:space-y-4">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  三、資料保護措施
                </h2>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  網站採取各項安全防護措施，如防火牆與防病毒系統，來保護您的個人資料。我們確保資料僅由授權人員處理，並要求所有處理個人資料的員工簽訂保密協議，違反者將依法追究責任。
                </p>
            </section>

            <!-- 第四章 -->
            <section class="space-y-3 sm:space-y-4">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  四、網站外部連結
                </h2>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  本網站提供其他網站的連結，但這些網站不適用本隱私政策。您需自行查看這些網站的隱私政策。
                </p>
            </section>

            <!-- 第五章 -->
            <section class="space-y-3 sm:space-y-4">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  五、與第三方共享個人資料
                </h2>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 sm:mb-4">
                  我們承諾不會出售、交換、出租或透露您的個人資料給任何個人、團體或企業，除非在以下情況下：
                </p>
                <ul class="list-disc list-inside space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                    <li class="leading-relaxed">經您書面同意。</li>
                    <li class="leading-relaxed">法律規定要求。</li>
                    <li class="leading-relaxed">為保障您的生命、身體、自由或財產安全。</li>
                    <li class="leading-relaxed pl-4 sm:pl-6 -indent-4 sm:-indent-6">
                      基於公共利益，與政府或學術機構合作，且資料經過處理無法識別個人。
                    </li>
                    <li class="leading-relaxed pl-4 sm:pl-6 -indent-4 sm:-indent-6">
                      在您違反服務條款或行為可能對他人造成損害時，網站管理單位有必要披露資料以便處理。
                    </li>
                    <li class="leading-relaxed">其他符合您權益的情況。
                      我們也會在委託第三方處理資料時，確保其遵守相關規範。</li>
                    
                </ul>
            </section>

            <!-- 第六章 -->
            <section class="space-y-3 sm:space-y-4">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  六、Cookie的使用
                </h2>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  為提供最佳服務，我們會在您的設備中放置Cookie。若您不願接受，可透過瀏覽器設定拒絕Cookie，但可能會影響某些網站功能的正常運作。
                </p>
            </section>

            <!-- 第七章 -->
            <section class="space-y-3 sm:space-y-4">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  七、隱私政策的變更
                </h2>
                <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  本網站將根據需要對隱私權保護政策進行修訂，並會將更新後的條款公告於網站上。
                </p>
            </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>