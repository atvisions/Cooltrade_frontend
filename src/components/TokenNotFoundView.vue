<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-4">
    <div class="mb-6">
      <i class="ri-database-2-line text-5xl text-yellow-500"></i>
    </div>
    <h2 class="text-xl font-semibold text-white mb-2">{{ $t('tokenNotFound.title', { symbol: formattedSymbol }) }}</h2>
    <p class="text-gray-300 mb-6">{{ $t('tokenNotFound.description') }}</p>
    
    <button
      class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mb-4 w-full max-w-xs transition-colors duration-200 flex items-center justify-center"
      @click="handleRefresh"
      :disabled="showRefreshModal"
    >
      <span class="flex items-center justify-center">
        <i class="ri-refresh-line mr-2" :class="{ 'animate-spin': showRefreshModal }"></i>
        {{ $t('tokenNotFound.refreshButton') }}
      </span>
    </button>

    <!-- 刷新进度弹窗 -->
    <div v-if="showRefreshModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-gray-900 rounded-xl p-6 w-[320px] shadow-xl border border-gray-800">
        <h3 class="text-lg font-medium text-center mb-4">{{ $t('analysis.refreshing_data') }}</h3>

        <!-- 进度条 -->
        <div class="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all duration-300"
            :style="{ width: `${refreshProgress}%` }"
          ></div>
        </div>

        <!-- 进度百分比 -->
        <div class="text-center text-sm text-gray-400 mb-4">
          {{ Math.round(refreshProgress) }}%
        </div>

        <!-- 动态提示文本 -->
        <p class="text-sm text-gray-300 text-center min-h-[48px]">
          {{ refreshText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import { getLatestTechnicalAnalysis } from '@/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  symbol: string
  isRefreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

// 刷新状态
const showRefreshModal = ref(false)
const refreshProgress = ref(0)
const refreshText = ref(t('analysis.refreshing_data_ellipsis'))
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 计算属性：格式化显示的交易对符号
const formattedSymbol = computed(() => {
  // 如果已经包含USDT后缀，则直接返回
  if (props.symbol.toUpperCase().endsWith('USDT')) {
    return props.symbol
  }
  // 否则添加USDT后缀
  return `${props.symbol}/USDT`
})

// 模拟刷新进度
const simulateRefreshProgress = () => {
  // 清除之前的定时器
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  // 重置进度
  refreshProgress.value = 1 // 从1%开始，让用户立即看到进度
  showRefreshModal.value = true
  refreshText.value = t('analysis.calculating_indicators')

  // 记录开始时间
  const startTime = Date.now()

  // 使用非线性函数来模拟进度
  const getProgressForTime = (elapsedMs: number): number => {
    const elapsedSeconds = elapsedMs / 1000

    if (elapsedSeconds <= 10) {
      // 0-10秒: 1% 到 40%
      return 1 + 39 * Math.sqrt(elapsedSeconds / 10)
    } else if (elapsedSeconds <= 20) {
      // 10-20秒: 40% 到 70%
      return 40 + 30 * ((elapsedSeconds - 10) / 10)
    } else {
      // 20-30秒: 70% 到 95%
      const remaining = Math.min(1, (elapsedSeconds - 20) / 10)
      return 70 + 25 * (1 - Math.pow(1 - remaining, 3))
    }
  }

  // 每100ms更新一次，使动画更流畅
  refreshTimer = setInterval(() => {
    if (!showRefreshModal.value) {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
      return
    }

    const elapsedMs = Date.now() - startTime
    const newProgress = Math.min(95, getProgressForTime(elapsedMs))
    refreshProgress.value = newProgress

    // 根据进度更新提示文本
    if (newProgress < 30) {
      refreshText.value = t('analysis.calculating_indicators')
    } else if (newProgress < 60) {
      refreshText.value = t('analysis.analyzing_trends')
    } else if (newProgress < 85) {
      refreshText.value = t('analysis.generating_advice')
    } else {
      refreshText.value = t('analysis.finalizing_data')
    }

    if (newProgress >= 95) {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
    }
  }, 100)
}

const handleRefresh = async () => {
  try {
    if (showRefreshModal.value) {
      return
    }

    // 开始模拟进度
    simulateRefreshProgress()

    // 使用 getLatestTechnicalAnalysis 获取最新报告
    await getLatestTechnicalAnalysis(props.symbol)

    // 完成刷新 - 平滑过渡到100%
    refreshText.value = '数据刷新完成！'

    // 从当前进度平滑过渡到100%
    const currentProgress = refreshProgress.value
    const startTransition = Date.now()
    const transitionDuration = 500

    const transitionInterval = setInterval(() => {
      const elapsedMs = Date.now() - startTransition
      const transitionProgress = Math.min(1, elapsedMs / transitionDuration)
      const easedProgress = 1 - Math.pow(1 - transitionProgress, 2)
      const newProgress = currentProgress + (100 - currentProgress) * easedProgress

      refreshProgress.value = newProgress

      if (transitionProgress >= 1) {
        clearInterval(transitionInterval)
        refreshProgress.value = 100

        // 延迟关闭弹窗，让用户看到100%的进度
        setTimeout(() => {
          showRefreshModal.value = false
          emit('refresh')
        }, 500)
      }
    }, 16)

  } catch (error) {
    console.error('获取数据失败:', error)
    // 关闭进度弹窗
    showRefreshModal.value = false
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>
