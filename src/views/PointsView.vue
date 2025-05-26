<template>
  <div class="relative h-[600px] flex flex-col bg-[#0F172A]">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold">{{ t('points.my_points') }}</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16 overflow-y-auto">
      <div class="max-w-[375px] mx-auto px-4 py-6">
        <!-- 积分统计卡片 -->
        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <!-- 总积分 -->
            <div class="flex flex-col items-center p-4 bg-gray-700 rounded-lg">
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center text-xl mb-2">
                <i class="ri-coin-line"></i>
              </div>
              <h2 class="text-2xl font-bold mb-1">{{ pointsInfo.points || 0 }}</h2>
              <p class="text-gray-400 text-xs">{{ t('points.total_points') }}</p>
            </div>
            <!-- 排名信息 -->
            <div class="flex flex-col items-center p-4 bg-gray-700 rounded-lg">
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-xl mb-2">
                <i class="ri-trophy-line"></i>
              </div>
              <h2 class="text-2xl font-bold mb-1">#{{ pointsRanking || '--' }}</h2>
              <p class="text-gray-400 text-xs">{{ t('points.ranking') }}</p>
            </div>
          </div>
        </div>

        <!-- 积分获取方式 -->
        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">{{ t('points.earn_points') }}</h3>
          <div class="space-y-4">
            <!-- 邀请好友 -->
            <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer" @click="copyInvitationCode">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-lg mr-3">
                  <i class="ri-user-add-line"></i>
                </div>
                <div>
                  <p class="font-medium">{{ t('points.invite_friends') }}</p>
                  <p class="text-gray-400 text-xs mt-1">+{{ pointsInfo.invitation_points_per_user || 10 }} {{ t('points.points') }}</p>
                </div>
              </div>
              <!-- 直接显示邀请码和复制图标 -->
              <div class="flex items-center space-x-2">
                <span class="font-mono text-sm text-gray-300">{{ pointsInfo.invitation_code || '...' }}</span>
                <i class="ri-file-copy-line text-gray-400 hover:text-white transition-colors"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 邀请记录卡片 -->
        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">{{ t('points.invitation_records') }}</h3>
            <span class="text-gray-400 text-sm">{{ t('points.total_invited', { count: pointsInfo.invitation_count || 0 }) }}</span>
          </div>
          <div class="space-y-3">
            <div v-for="record in pointsInfo.invitation_records" :key="record.invitee_email" class="bg-gray-700 rounded-lg p-4 flex items-center space-x-4">
              <!-- 头像 -->
              <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white uppercase">
                {{ record.invitee_email ? record.invitee_email.charAt(0) : '' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0 break-words pr-2">
                    <div class="font-medium">{{ record.invitee_email }}</div>
                  </div>
                  <div class="text-green-500 font-medium flex-shrink-0">+{{ record.points_awarded }}</div>
                </div>
                <div class="text-gray-400 text-xs mt-1">{{ t('points.registered_at') }}: {{ record.created_at }}</div>
              </div>
            </div>
          </div>
          <!-- 无邀请记录显示 -->
          <div v-if="!pointsInfo.invitation_records || pointsInfo.invitation_records.length === 0" class="text-center py-8">
            <i class="ri-user-add-line text-4xl text-gray-600 mb-2"></i>
            <p class="text-gray-400">{{ t('points.no_invitation_records') }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部导航栏 -->
    <nav class="sticky bottom-0 w-full z-20 bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="grid grid-cols-3 h-16">
          <router-link to="/" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-line-chart-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.market') }}</span>
          </router-link>
          <router-link to="/points" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
            <i class="ri-coin-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.points') }}</span>
          </router-link>
          <router-link to="/profile" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-settings-3-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.settings') }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 复制成功提示 -->
    <div v-if="showCopySuccess" class="fixed bottom-24 left-0 right-0 flex justify-center z-30">
      <div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
        {{ t('points.copy_success') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import axios from 'axios'
import api from '@/api'

const router = useRouter()
const { t } = useEnhancedI18n()

// 积分信息
const pointsInfo = ref({
  points: 0,
  invitation_code: '',
  invitation_points_per_user: 10,
  invitation_count: 0,
  invitation_records: [] as { invitee_email: string; invitee_username: string; points_awarded: number; created_at: string }[]
})

// 排名信息
const pointsRanking = ref(null)

// 历史记录类型 (不再使用)
const currentHistoryType = ref('all')

// 积分历史 (不再使用)
// const pointsHistory = ref([
//   {
//     id: 1,
//     type: 'earned',
//     points: 10,
//     description: t('points.invitation_reward_desc'),
//     created_at: '2024-01-20 14:30:00'
//   },
//   {
//     id: 2,
//     type: 'earned',
//     points: 1,
//     description: t('points.daily_trade_desc'),
//     created_at: '2024-01-20 10:15:00'
//   },
//   {
//     id: 3,
//     type: 'used',
//     points: 5,
//     description: t('points.used_for_discount'),
//     created_at: '2024-01-19 16:45:00'
//   }
// ])

// 过滤后的历史记录 (不再使用)
// const filteredHistory = computed(() => {
//   if (currentHistoryType.value === 'all') return pointsHistory.value
//   return pointsHistory.value.filter(record => record.type === currentHistoryType.value)
// })

// UI 状态
// const showInviteModal = ref(false) // 不再需要
const showCopySuccess = ref(false)

// 用于存储 cookie 相关的域名和名称，以便在不同的函数中使用
const cookieNameForCookie = 'temporary_invitation_uuid';

// 根据环境获取主网站域名
const getMainWebsiteDomain = () => {
  const isDevelopment = localStorage.getItem('env') === 'development';
  return isDevelopment ? 'http://192.168.3.16:8000' : 'https://www.cooltrade.xyz';
};

// 尝试从 cookie 读取 UUID 并认领
const attemptClaimFromCookie = async () => {
    // 检查是否在 Chrome 扩展环境中运行
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        return;
    }

    try {
        // 获取当前环境的主网站域名
        const mainWebsiteDomain = getMainWebsiteDomain();

        // 通过消息发送请求给 background script 读取 cookie
        chrome.runtime.sendMessage({
            type: 'getCookie',
            data: {
                url: mainWebsiteDomain,
                name: cookieNameForCookie
            }
        }, (response) => {
            if (response && response.cookie) {
                // 如果读取到 UUID，调用认领函数
                claimTemporaryInvitation(response.cookie.value);
                // 读取成功后删除 cookie，避免重复尝试认领
                chrome.runtime.sendMessage({
                    type: 'removeCookie',
                    data: {
                        url: mainWebsiteDomain,
                        name: cookieNameForCookie
                    }
                });
            } else {
            }
        });
    } catch (error) {
    }
};

// 认领临时邀请码
const claimTemporaryInvitation = async (uuid: string) => {
    try {
        if (!uuid) {
            return;
        }

        const token = localStorage.getItem('token') || '';
        if (!token) {
            return;
        }

        // 使用 api 实例发送请求，而不是直接使用 axios
        // 这样可以利用 api 实例中的代理机制和环境配置
        const response = await api.post('/auth/claim-temporary-invitation/', {
            temporary_invitation_uuid: uuid
        });

        if (response.status === 'success') {
            if (response.message === '成功认领邀请并获得奖励') {
                fetchPointsInfo();
            }
        } else {
        }
    } catch (error) {
        // 检查是否在 Chrome 扩展环境中运行
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            // 请求出错也考虑让 background script 删除 cookie，避免无效尝试
            const mainWebsiteDomain = getMainWebsiteDomain();
            chrome.runtime.sendMessage({
                type: 'removeCookie',
                data: {
                    url: mainWebsiteDomain,
                    name: cookieNameForCookie
                }
            });
        }
    }
}

// 获取积分信息
const fetchPointsInfo = async () => {
  try {

    // 检查认证令牌
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // 确保请求头中包含认证令牌
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token
    };



    try {
      // 使用 fetch 直接发送请求，避免使用 api 实例
      const url = `${window.location.protocol.includes('extension') ? 'https://www.cooltrade.xyz/api' : '/api'}/auth/invitation-info/`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        return;
      }

      const responseData = await response.json();

      // 检查响应格式
      if (responseData && typeof responseData === 'object') {
        if (responseData.status === 'success' && responseData.data) {
          pointsInfo.value = responseData.data;

          // 如果排名数据合并到 invitation-info 接口，在这里更新 pointsRanking
          if (responseData.data.ranking !== undefined) {
            pointsRanking.value = responseData.data.ranking;
          }
        } else {
        }
      } else {
      }
    } catch (error) {
    }

    // 获取排名信息 (如果排名接口是独立的)
    try {

      // 使用 axios 直接发送请求，避免使用 api 实例
      const url = `${window.location.protocol.includes('extension') ? 'https://www.cooltrade.xyz/api' : '/api'}/auth/invitation-info/ranking/`;

      const rankingResponse = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!rankingResponse.ok) {
        return;
      }

      const rankingData = await rankingResponse.json();

      // 检查响应格式
      if (rankingData && typeof rankingData === 'object') {
        if (rankingData.status === 'success' && rankingData.ranking !== undefined) {
          pointsRanking.value = rankingData.ranking;
        } else {
        }
      } else {
      }
    } catch (rankingError) {
    }

  } catch (error) {
  }
}

// 复制邀请码
const copyInvitationCode = () => {
  if (!pointsInfo.value.invitation_code) return

  // 获取主网站域名，而不是使用 window.location.origin（这可能是 chrome-extension://ID）
  const mainWebsiteDomain = getMainWebsiteDomain();

  const invitationText = t('points.share_invitation_text', {
    code: pointsInfo.value.invitation_code,
    points: pointsInfo.value.invitation_points_per_user
  }) + `\n${mainWebsiteDomain}/?code=${pointsInfo.value.invitation_code}`;


  navigator.clipboard.writeText(invitationText)
    .then(() => {
      showCopySuccess.value = true
      setTimeout(() => {
        showCopySuccess.value = false
      }, 2000)
    })
    .catch(err => {
    })
}

// 分享邀请码 (不再需要)
// const shareInvitationCode = async () => {
//   if (!pointsInfo.value.invitation_code) return
//
//   const shareText = t('points.share_invitation_text', {
//     code: pointsInfo.value.invitation_code,
//     points: pointsInfo.value.invitation_points_per_user
//   })
//
//   if (navigator.share) {
//     try {
//       await navigator.share({
//         title: t('points.share_invitation_title'),
//         text: shareText,
//         url: window.location.origin
//       })
//     } catch (error) {
//     }
//   } else {
//     navigator.clipboard.writeText(shareText)
//       .then(() => {
//         showCopySuccess.value = true
//         setTimeout(() => {
//           showCopySuccess.value = false
//         }, 2000)
//       })
//       .catch(err => {
//       })
//   }
// }

onMounted(() => {
  fetchPointsInfo();
  // 在页面挂载并获取基础积分信息后，尝试从 cookie 认领邀请码
  // 确保用户已经认证，fetchPointsInfo 已经检查了 token
  attemptClaimFromCookie();
})
</script>
