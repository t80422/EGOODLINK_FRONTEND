// 處理 cookie 與 store 的同步
import { AUTH_COOKIE, USER_COOKIE } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const cookieOptions = {
    maxAge: 60 * 60, // 1小時
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }

  const authCookie = useCookie(AUTH_COOKIE, cookieOptions)
  const userCookie = useCookie(USER_COOKIE, cookieOptions)

  if (process.client) {
    const auth = useAuthStore()
    
    if (authCookie.value) {
      auth.token = authCookie.value
      // 修改這裡：檢查值的類型
      auth.user = typeof userCookie.value === 'string'
        ? JSON.parse(userCookie.value)
        : userCookie.value
      auth.isLoggedIn = true
    }

    watch(() => auth.token, (newToken) => {
      if (newToken) {
        authCookie.value = newToken
      } else {
        authCookie.value = null
      }
    })

    watch(() => auth.user, (newUser) => {
      if (newUser) {
        userCookie.value = JSON.stringify(newUser)
      } else {
        userCookie.value = null
      }
    })

    await auth.init()
  }
})