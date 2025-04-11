<script setup>
import { useAuthStore } from "@/stores/auth";
import ScrollToTop from "~/components/common/ScrollToTop.vue";
definePageMeta({
  title: "會員資料",
});

const auth = useAuthStore();
// TODO 新增錯誤狀態
const errors = ref({
  name: "",
  phone: "",
});

// 驗證函數
const validate = () => {
  errors.value = {};
  let isValid = true;

  if (!formData.value.name?.trim()) {
    errors.value.name = "請輸入姓名";
    isValid = false;
  }

  if (!formData.value.phone?.trim()) {
    errors.value.phone = "請輸入電話";
    isValid = false;
  }

  return isValid;
};

//TODO 新增密碼錯誤狀態
const passwordErrors = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const isLocationSelectOpen = ref(false);

const handleLocationSelectClick = () => {
  isLocationSelectOpen.value = !isLocationSelectOpen.value;
};

// 新增密碼驗證規則
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

// 新增密碼驗證函數
const validatePassword = () => {
  passwordErrors.value = {};
  let isValid = true;

  // 驗證原密碼
  if (!passwordForm.value.oldPassword) {
    passwordErrors.value.oldPassword = "請輸入原密碼";
    isValid = false;
  }

  // 驗證新密碼
  if (!passwordForm.value.newPassword) {
    passwordErrors.value.newPassword = "請輸入新密碼";
    isValid = false;
  } else if (!passwordPattern.test(passwordForm.value.newPassword)) {
    passwordErrors.value.newPassword =
      "密碼必須包含大小寫字母和數字，且長度至少8碼";
    isValid = false;
  }

  // 驗證確認密碼
  if (!passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = "請輸入確認密碼";
    isValid = false;
  } else if (
    passwordForm.value.confirmPassword !== passwordForm.value.newPassword
  ) {
    passwordErrors.value.confirmPassword = "確認密碼與新密碼不符";
    isValid = false;
  }

  return isValid;
};

// 會員資料表單狀態
const formData = ref({
  account: auth.user?.email || "",
  password: "E123456789000",
  confirmPassword: "E123456789000",
  name: "",
  phone: "",
  postalCode: "",
  address: "",
  branch: null,
});

// 密碼修改表單狀態
// const showPasswordModal = ref(false)
const passwordForm = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 開關密碼修改視窗
// const togglePasswordModal = () => {
//   showPasswordModal.value = !showPasswordModal.value
//   if (!showPasswordModal.value) {
//     passwordForm.value = {
//       oldPassword: '',
//       newPassword: '',
//       confirmPassword: ''
//     }
//   }
// }

// 新增據點選項的狀態
const locationOptions = ref([]);

// 獲取據點選項
const fetchLocationOptions = async () => {
  try {
    const response = await fetch("/index.php/api/locationOptions");
    const result = await response.json();

    if (result.status && result.data?.options) {
      locationOptions.value = result.data.options;
    }
  } catch (error) {
    console.error("取得據點選項失敗:", error);
  }
};

onMounted(() => {
  fetchUserData();
  fetchLocationOptions();
});

// 取得會員資料
const fetchUserData = async () => {
  try {
    const response = await fetch("/index.php/api/client/users", {
      headers: {
        Authorization: `Bearer ${auth.token}`, //  token
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.status && result.data) {
      formData.value = {
        ...formData.value,
        name: result.data.name,
        phone: result.data.phone,
        postalCode: result.data.postalCode,
        address: result.data.address,
        branch: result.data.locationId,
      };
    }
  } catch (error) {
    console.error("取得會員資料失敗:", error);
  }
};

// 處理會員表單提交
const handleSubmit = async () => {
  if (!validate()) {
    return;
  }
  try {
    const requestData = {
      name: formData.value.name,
      phone: formData.value.phone,
      postalCode: formData.value.postalCode,
      address: formData.value.address,
      locationId: formData.value.branch || null,
    };

    const response = await fetch("/index.php/api/client/users/edit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (result.status) {
      alert("會員資料更新成功");
      // 重新載入最新資料
      await fetchUserData();
    } else {
      alert(result.message || "更新失敗");
    }
  } catch (error) {
    console.error("更新會員資料失敗:", error);
    alert("更新失敗，請稍後再試");
  }
};

// 密碼更新方法
const handlePasswordUpdate = async () => {
  if (!validatePassword()) {
    return;
  }
  try {
    // 先驗證新密碼和確認密碼是否相同
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      alert("新密碼與確認密碼不符");
      return;
    }

    // 準備 API 請求資料
    const requestData = {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    };

    // 發送 API 請求
    const response = await fetch(
      "/index.php/api/client/users/change-password",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await response.json();

    if (result.status) {
      alert("密碼修改成功");
      isActive.value = false;
    } else {
      alert(result.message || "密碼修改失敗");
    }
  } catch (error) {
    console.error("密碼更新失敗:", error);
    alert("密碼修改失敗，請稍後再試");
  }
};
</script>

<template>
  <div>
    <!-- ScrollToTop 按鈕 -->
    <div class="container mx-auto py-4 sm:py-6 lg:py-8 px-4">
      <ScrollToTop />
    </div>

    <div class="min-h-[78vh] bg-white">
      <!-- Breadcrumb -->
      <div class="bg-white p-4 mb-4 sm:mb-6 border-t border-gray-200">
        <div class="w-full max-w-[1760px] mx-auto mt-3 sm:mt-5 px-4">
          <p class="text-sm text-gray-600 flex items-center flex-wrap">
            <NuxtLink to="/" class="hover:text-primary transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 mr-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </NuxtLink>
            <span class="mx-2">/</span>
            <span>會員管理</span>
            <span class="mx-2">/</span>
            <span>會員資料</span>
          </p>
        </div>
      </div>

      <!-- 會員資料表單 -->
      <div class="flex justify-center items-center px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-lg">
          <h1 class="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
            會員資料
          </h1>

          <form class="space-y-4 sm:space-y-6" @submit.prevent="handleSubmit">
            <div>
              <label
                for="account"
                class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                >帳號</label
              >
              <input
                id="account"
                type="text"
                v-model="formData.account"
                class="w-full rounded-md border border-gray-200 bg-gray-100 text-gray-500 focus:border-gray-200 focus:ring-0 px-3 sm:px-4 py-2 sm:py-3 cursor-not-allowed text-sm sm:text-base"
                readonly
              />
            </div>

            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
              >
                姓名 <span class="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                v-model="formData.name"
                :class="[
                  'w-full rounded-md border px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base',
                  errors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500',
                ]"
                placeholder="請輸入姓名"
              />
              <p
                v-if="errors.name"
                class="mt-1 text-xs sm:text-sm text-red-500"
              >
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label
                for="phone"
                class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
              >
                電話 <span class="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                v-model="formData.phone"
                :class="[
                  'w-full rounded-md border px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base',
                  errors.phone
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500',
                ]"
                placeholder="請輸入電話"
              />
              <p
                v-if="errors.phone"
                class="mt-1 text-xs sm:text-sm text-red-500"
              >
                {{ errors.phone }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                >地址</label
              >
              <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  v-model="formData.postalCode"
                  type="text"
                  id="postal-code"
                  class="w-full sm:w-[120px] h-[40px] sm:h-[48px] rounded-[12px] p-2 border border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-sm sm:text-base"
                  placeholder="郵遞區號"
                />
                <input
                  v-model="formData.address"
                  type="text"
                  id="address"
                  class="w-full h-[40px] sm:h-[48px] rounded-[12px] p-2 border border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-sm sm:text-base"
                  placeholder="請輸入地址"
                />
              </div>
            </div>

            <!-- 營運據點 -->
            <div class="mb-4 sm:mb-6">
              <label
                class="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                >營運據點</label
              >
              <div class="relative">
                <select
                  v-model="formData.locationId"
                  @click="handleLocationSelectClick"
                  class="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm sm:text-base"
                >
                  <option value="" disabled selected>請選擇營運據點</option>
                  <option
                    v-for="option in locationOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <div
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                >
                  <svg
                    class="fill-current h-4 w-4 transition-transform duration-200"
                    :class="{ 'rotate-180': isLocationSelectOpen }"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    />
                  </svg>
                </div>
              </div>
              <div v-if="errors.locationId" class="mt-1 text-sm text-red-600">
                {{ errors.locationId }}
              </div>
            </div>

            <div class="flex justify-center mt-6 sm:mt-8">
              <button
                type="submit"
                class="w-full px-6 py-2 sm:py-3 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                更新資料
              </button>
            </div>
          </form>

          <!-- todo修改密碼 -->
          <div>
            <v-dialog max-width="500">
              <!-- 觸發按鈕 -->
              <template v-slot:activator="{ props }">
                <button
                  v-bind="props"
                  class="w-full py-2 px-4 mt-8 mb-20 rounded-md text-sm font-medium text-white bg-[#0F93A2] hover:bg-[#0d8291] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F93A2]"
                >
                  更改密碼
                </button>
              </template>

              <!-- Dialog 內容 -->
              <template v-slot:default="{ isActive }">
                <v-card>
                  <v-card-title class="text-lg sm:text-xl font-bold">
                    更改密碼
                    <v-btn
                      icon
                      @click="isActive.value = false"
                      class="float-right"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </v-card-title>

                  <v-card-text>
                    <form
                      @submit.prevent="handlePasswordUpdate"
                      class="space-y-4"
                    >
                      <!-- 原密碼 -->
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >原密碼</label
                        >
                        <input
                          type="password"
                          v-model="passwordForm.oldPassword"
                          placeholder="請輸入您的密碼(英數字包含大小寫8碼)"
                          :class="[
                            'w-full rounded-md border px-4 py-2',
                            passwordErrors.oldPassword
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500',
                          ]"
                        />
                        <p
                          v-if="passwordErrors.oldPassword"
                          class="mt-1 text-sm text-red-500"
                        >
                          {{ passwordErrors.oldPassword }}
                        </p>
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >新密碼</label
                        >
                        <input
                          type="password"
                          v-model="passwordForm.newPassword"
                          placeholder="請輸入您的密碼(英數字包含大小寫8碼)"
                          :class="[
                            'w-full rounded-md border px-4 py-2',
                            passwordErrors.newPassword
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500',
                          ]"
                        />
                        <p
                          v-if="passwordErrors.newPassword"
                          class="mt-1 text-sm text-red-500"
                        >
                          {{ passwordErrors.newPassword }}
                        </p>
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >確認密碼</label
                        >
                        <input
                          type="password"
                          v-model="passwordForm.confirmPassword"
                          placeholder="請輸入您的密碼(英數字包含大小寫8碼)"
                          :class="[
                            'w-full rounded-md border px-4 py-2',
                            passwordErrors.confirmPassword
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500',
                          ]"
                        />
                        <p
                          v-if="passwordErrors.confirmPassword"
                          class="mt-1 text-sm text-red-500"
                        >
                          {{ passwordErrors.confirmPassword }}
                        </p>
                      </div>
                      <div class="flex justify-end space-x-3 mt-4">
                        <button
                          type="button"
                          @click="isActive.value = false"
                          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          class="px-4 py-2 bg-teal-500 text-white rounded-md text-sm font-medium hover:bg-teal-600"
                        >
                          確認更改
                        </button>
                      </div>
                    </form>
                  </v-card-text>
                </v-card>
              </template>
            </v-dialog>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>