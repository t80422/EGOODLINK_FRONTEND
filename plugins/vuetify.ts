import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    // 設定預設主題
    defaults: {
      VBtn: {
        variant: 'outlined',
      },
    },
  })
  app.vueApp.use(vuetify)
})