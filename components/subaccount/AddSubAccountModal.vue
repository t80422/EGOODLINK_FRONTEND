<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// 從父元件接收 modelValue (控制彈窗顯示) 和 userId (後台需要)
const props = defineProps({
  modelValue: Boolean, // for v-model
  userId: { // 後台新增時需要知道是哪個主帳號
    type: [String, Number],
    default: null
  }
})

// 定義觸發的事件 (通知父元件)
const emit = defineEmits(['update:modelValue', 'added'])

const authStore = useAuthStore()
const isSubmitted = ref(false)
const isLoading = ref(false) // 用於提交時的 loading 狀態

// --- 新增 form ref ---
const formRef = ref(null)

const formData = ref({
  idCardNum: '',
  name: '',
  memo: '',
  agreementChecked: false
})

// 控制彈窗顯示/隱藏的 computed property (用於 v-model)
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 重置表單
const resetForm = () => {
  formData.value = {
    idCardNum: '',
    name: '',
    memo: '',
    agreementChecked: false
  }
  isSubmitted.value = false
}

// 關閉彈窗的函數 (會觸發 update:modelValue)
const closeDialog = () => {
  showDialog.value = false
  // 可以在這裡延遲一點重置表單，避免關閉動畫時看到內容變化
  setTimeout(resetForm, 300)
}

// 提交表單的函數
const handleSubmit = async () => {
  isSubmitted.value = true // 觸發 :error-messages 顯示
  isLoading.value = true

  // --- 使用 v-form 的 validate 方法 ---
  const { valid } = await formRef.value.validate()
  if (!valid) {
    isLoading.value = false
    return // 驗證失敗，停止執行
  }

  try {
    // 準備 API payload
    const payload = {
      idCardNum: formData.value.idCardNum,
      name: formData.value.name,
      memo: formData.value.memo,
    }

    // 決定 API 端點 (前台 vs 後台)
    const apiUrl = props.userId
      ? `/index.php/api/client/subAccount/${props.userId}` // 後台 API
      : '/index.php/api/client/subAccount/' // 前台 API

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.status) {
      alert(data.message || '新增成功')
      closeDialog() // 關閉彈窗
      emit('added') // 通知父元件新增成功
    } else {
      alert(data.message || '新增失敗')
    }
  } catch (error) {
    console.error('新增子帳號失敗:', error)
    if (error.response?.status === 401) {
      authStore.clearAuth()
      alert('登入已過期，請重新登入')
    } else {
      alert('系統發生錯誤，請稍後再試')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-dialog v-model="showDialog" persistent max-width="560px" @keydown.esc="closeDialog">
    <v-card>
      <!-- 標題與關閉按鈕 -->
      <v-card-title class="d-flex justify-space-between align-center border-b px-4 py-3 sm:px-6 sm:py-4">
        <span class="text-lg sm:text-xl font-medium">新增子帳號</span>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" :disabled="isLoading"></v-btn>
      </v-card-title>

      <v-card-text class="p-4 sm:p-6">
        <!-- 表單內容 -->
        <v-form ref="formRef" @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 身分證字號 -->
          <v-text-field
            v-model="formData.idCardNum"
            label="身分證字號 *"
            variant="outlined"
            density="compact"
            required
            :rules="[v => !!v || '請輸入身分證字號']"
            :error-messages="!formData.idCardNum && isSubmitted ? '請輸入身分證字號' : ''"
            :disabled="isLoading"
            clearable
            validate-on="input" 
          ></v-text-field>

          <!-- 姓名 -->
          <v-text-field
            v-model="formData.name"
            label="姓名 *"
            variant="outlined"
            density="compact"
            required
            :rules="[v => !!v || '請輸入姓名']"
            placeholder="請輸入姓名以比對委託繳交項目"
            :error-messages="!formData.name && isSubmitted ? '請輸入姓名' : ''"
            :disabled="isLoading"
            clearable
            validate-on="input"
          ></v-text-field>

          <!-- 備註 -->
          <v-text-field
            v-model="formData.memo"
            label="備註 (選填)"
            variant="outlined"
            density="compact"
            placeholder="請輸入想標註事項"
            :disabled="isLoading"
            clearable
          ></v-text-field>

          <!-- 個資提供同意書區塊 -->
          <div class="border rounded-lg p-4 pt-3 sm:p-6 sm:pt-4 bg-gray-50">
            <h3 class="text-base sm:text-lg font-medium mb-3" style="color: rgb(var(--v-theme-secondary))">蒐集個人資料告知事項暨個人資料提供同意書</h3>
            <!-- 可滾動內容區域 -->
            <div class="h-[200px] sm:h-[250px] overflow-y-auto bg-white p-3 sm:p-4 rounded border border-gray-200 mb-3 text-sm text-gray-600 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <h4 class="font-medium text-gray-800">蒐集個人資料告知事項</h4>
              <p>股代網為遵守個人資料保護法規定，在您提供個人資料予本站前，依法告知下列事項：</p>
              <p>一、股代網(以下簡稱本站)因協助代領股東會紀念品等目的而獲取您下列個人資料類別：姓名、國民身分證統一編號、性別、證件圖檔、連絡方式(包括但不限於電話號碼、E-MAIL、居住或工作地址)等，或其他得以直接或間接識別您個人之資料。</p>
              <p>二、本站將依個人資料保護法及相關法令之規定下，依本站隱私權保護政策，蒐集、處理及利用您的個人資料。</p>
              <p>三、本站將於蒐集目的之存續期間合理利用您的個人資料。</p>
              <p>四、除蒐集之目的涉及國際業務或活動外，本站僅於中華民國領域內利用您的個人資料。</p>
              <p>五、本站將於原蒐集之特定目的、協助代領股東會紀念品、以及其他上市櫃/興櫃公司請求審查協助之目的範圍內，合理利用您的個人資料。</p>
              <p>六、您可依個人資料保護法第3條規定，就您的個人資料向本站行使之下列權利：</p>
              <div class="ml-4 space-y-1">
                <p>(一)查詢或請求閱覽。</p>
                <p>(二)請求製給複製本。</p>
                <p>(三)請求補充或更正。</p>
                <p>(四)請求停止蒐集、處理及利用。</p>
                <p>(五)請求刪除。</p>
              </div>
              <p>您因行使上述權利而導致對您的權益產生減損時，本站不負相關賠償責任。另依個人資料保護法第14條規定，本站得酌收行政作業費用。</p>
              <p>七、若您未提供正確之個人資料，本站將無法為您提供特定目的之相關業務。</p>
              <p>八、本站因業務需要而委託其他機關處理您的個人資料時，本站將會善盡監督之責。</p>
              <p>九、您瞭解此一同意書符合個人資料保護法及相關法規之要求，且同意本站留存此同意書，供日後取出查驗。</p>
              <h4 class="font-medium mt-4 text-gray-800">個人資料之同意提供</h4>
              <p>一、本人已充分知悉貴站上述告知事項。</p>
              <p>二、本人同意貴站蒐集、處理、利用本人之個人資料，以及其他上市櫃/興櫃公司請求代領協助目的之提供。</p>
            </div>
            <!-- 同意勾選 -->
            <div class="flex items-center -mt-2">
              <v-checkbox
                v-model="formData.agreementChecked"
                hide-details
                density="compact"
                :disabled="isLoading"
                :error="!formData.agreementChecked && isSubmitted"
                class="flex-shrink-0 mr-1"
              ></v-checkbox>
              <label class="text-xs sm:text-sm text-gray-700 cursor-pointer flex-grow" @click="formData.agreementChecked = !formData.agreementChecked; isSubmitted = false">
                我已了解並同意以上內容
              </label>
            </div>
             <p v-if="!formData.agreementChecked && isSubmitted" class="text-xs text-red-600 mt-1 ml-10" style="height: 1.2em;"> <!-- Give fixed height to prevent layout shift -->
                請勾選同意以繼續
            </p>
          </div>

          <!-- 按鈕區 -->
          <v-card-actions class="px-0 pt-5 pb-1">
            <v-spacer></v-spacer>
            <v-btn
              variant="outlined" 
              color="secondary" 
              @click="closeDialog"
              :disabled="isLoading"
              class="mr-2"
            >
              取消
            </v-btn>
            <v-btn
              color="primary"
              variant="flat" 
              type="submit"
              :disabled="!formData.agreementChecked || isLoading"
              :loading="isLoading"
              min-width="90"
            >
              確認新增
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>