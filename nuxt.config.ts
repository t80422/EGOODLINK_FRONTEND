import vuetify from 'vite-plugin-vuetify'
// 定義 transformAssetUrls 配置
const transformAssetUrls = {
  base: null,
  includeAbsolute: false,
}

export default defineNuxtConfig({
  ssr: true,
  experimental: {
    payloadExtraction: false  // 優化大型應用的效能
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],
  piniaPersistedstate: {
    storage: 'localStorage', // 使用 localStorage 儲存
    debug: true,            // 開啟除錯模式，控制台會顯示儲存相關訊息
    paths: ['auth.token', 'auth.user'], // 指定要持久化的狀態路徑
    cookieOptions: {        // Cookie 相關設定（如果使用 cookie storage）
      maxAge: 60 * 60,     // 存活時間（秒）
      secure: process.env.NODE_ENV === 'production'
    }
  },
  pinia: {
    autoImports: [
      'defineStore',
      ['defineStore', 'definePiniaStore'],
    ]
  },
  nitro: {
    devProxy: {
      '/index.php': {
        target: 'http://egolink.test.tw',
        //target: 'https://egoodlink.tw',
        changeOrigin: true,
        // secure: true
      }
    }
  },
app: {
    head: {
    charset: 'utf-8',
    viewport: 'width=device-width, initial-scale=1',
    }
},
css: [
  '@/assets/css/main.scss',
  '@mdi/font/css/materialdesignicons.min.css'
],
build: {
  transpile: ['vuetify', '@mdi/font'],
},
vite: {
  vue: {
    template: {
      transformAssetUrls,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/css/common/variables" as *;'
      }
    }
  }
}
})