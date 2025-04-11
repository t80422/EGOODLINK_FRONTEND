<template>
  <div >
        <footer class="bg-[#0F93A2] text-white py-8 w-full bottom-0">
        <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <!-- Left Content -->
            <div class="flex items-center space-x-4">
            <!-- Logo -->
            <div class="w-[200px] h-[70px] flex items-center justify-center rounded-lg">
                <img 
                src="/FOOTER-LOGO.png" 
                alt="E股領前台"
                class="header-logo"
                />
            </div>
            </div>
    
            <!-- Middle Content -->
            <div class="text-center mt-4 md:mt-0">
                
                <div class="flex justify-between space-x-4 mb-2 mt-5">
                    <a href="#" class="text-sm hover:text-teal-300 border border-white rounded-xl px-3 py-1">E股投軟體下載</a>
                    <div class="flex space-x-4">
                        <NuxtLink to="/privacy-policy" class="text-sm hover:text-teal-300">隱私權政策</NuxtLink>
                        <NuxtLink to="/return-policy" class="text-sm hover:text-teal-300">退換貨政策</NuxtLink>
                    </div>
                </div>
            <p class="text-sm mb-2 mt-6">
                如有功能相關疑問或欲回報錯誤，歡迎寫信給客服
                <a href="mailto:egoodlink.service@gmail.com" class="underline hover:text-teal-300">egoodlink.service@gmail.com</a> 或
                電話進線客服 0906-657927
            </p>
            <p class="text-sm mt-6">Copyright © 2025 EgoodLink</p>
            </div>
    
            <!-- Right Content -->
            <div class="flex flex-col items-center md:items-end mt-4 md:mt-0">
            <!-- 移除原有內容 -->
            </div>
        </div>
    

        </footer>
    </div>
</template>

<script setup>

</script>

<style scoped>
footer {
  width: 100%;
}

/* 確保主內容不會被 footer 遮蓋 */
.relative {
    padding-bottom: 50px; /* 根據 footer 高度調整 */
}
</style>