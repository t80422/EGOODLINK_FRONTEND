export default defineNuxtRouteMiddleware(async (to) => {
  // 只要是後台路徑就進行驗證（除了登入頁）
  if (to.path === '/backsite' || to.path.startsWith('/backsite/')) {
    // 如果是登入頁面，直接允許訪問
    if (to.path === '/backsite/login') {
      return
    }

    const auth = useAuthStore()
    
    if (process.client) {
      await auth.init()
      
      // 驗證登入狀態與 token
      if (!auth.token || !auth.isLoggedIn) {
        console.log('未登入或 token 不存在')
        return navigateTo('/backsite/login', { replace: true })
      }

      try {
        // 驗證 token 是否過期
        if (isTokenExpired(auth.token)) {
          console.log('Token 已過期')
          auth.clearAuth()
          return navigateTo('/backsite/login', { replace: true })
        }

        // 驗證角色權限
        if (auth.user?.roleId === '3' || auth.user?.roleId === '4') {
          console.log('無權限訪問後台')
          auth.clearAuth()
          return navigateTo('/backsite/login', { replace: true })
        }

        // token 有效且有權限，允許訪問
        return
      } catch (error) {
        console.error('Token 驗證失敗:', error)
        auth.clearAuth()
        return navigateTo('/backsite/login', { replace: true })
      }
    }
  }
})

// Token 過期檢查函數
function isTokenExpired(token: string): boolean {
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]))
    return tokenData.exp * 1000 < Date.now()
  } catch {
    return true
  }
}