// 管理認證狀態的主要 store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as jwt_decode from 'jwt-decode'

interface User {
  id: string | number
  name: string
  roleId: string  // roleId: 1=管理員, 2=一般會員
}

export const AUTH_COOKIE = 'auth-token'
export const USER_COOKIE = 'auth-user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)

  // Cookie 配置
  const cookieOptions = {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    secure: false,
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? 'egolink.test.tw' : undefined,
  }

  function setAuth(data) {
    if (process.client) {
      try {
        console.log('設置認證開始:', {
          hasToken: !!data.token,
          hasUser: !!data.user,
          domain: window.location.hostname
        })

        if (!data.token || !data.user?.id) {
          throw new Error('無效的認證資料')
        }

        const authCookie = useCookie(AUTH_COOKIE, cookieOptions)
        const userCookie = useCookie(USER_COOKIE, cookieOptions)

        // 設置 Cookie
        authCookie.value = data.token
        userCookie.value = JSON.stringify(data.user)

        // 更新狀態
        token.value = data.token
        user.value = data.user
        isLoggedIn.value = true

        // 驗證設置結果
        console.log('認證設置完成:', {
          cookieExists: document.cookie.includes(AUTH_COOKIE),
          tokenSet: !!token.value,
          userSet: !!user.value
        })
      } catch (error) {
        console.error('setAuth 失敗:', error)
        clearAuth()
        throw error
      }
    }
  }

  function init() {
    if (process.client) {
      try {
        const authCookie = useCookie(AUTH_COOKIE)
        const userCookie = useCookie(USER_COOKIE)

        if (!authCookie.value || !userCookie.value) {
          console.log('Cookie 不存在，跳過初始化')
          return
        }

        try {
          const userData = typeof userCookie.value === 'string' 
            ? JSON.parse(userCookie.value)
            : userCookie.value

          token.value = authCookie.value
          user.value = userData
          isLoggedIn.value = true

        } catch (parseError) {
          console.error('解析使用者資料失敗:', parseError)
          clearAuth()
        }
      } catch (error) {
        console.error('初始化失敗:', error)
        clearAuth()
      }
    }
  }

  function clearAuth() {
    if (process.client) {
      const authCookie = useCookie(AUTH_COOKIE)
      const userCookie = useCookie(USER_COOKIE)
      
      authCookie.value = null
      userCookie.value = null
    }
    token.value = null
    user.value = null
    isLoggedIn.value = false
  }

  return {
    token,
    user,
    isLoggedIn,
    userName: computed(() => user.value?.name || ''),
    isAdmin: computed(() => user.value?.roleId === '1'),
    setAuth,
    clearAuth,
    init
  }
})