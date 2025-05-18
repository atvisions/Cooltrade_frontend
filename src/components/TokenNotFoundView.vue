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
const simulateRefreshProgress = (hasTechnicalData = false) => {
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

  // 根据是否有技术数据调整预期总时间
  // 没有技术数据时约26秒，有技术数据时约16秒
  const expectedTotalTime = hasTechnicalData ? 16 : 26

  // 使用非线性函数来模拟进度，根据预期总时间调整
  const getProgressForTime = (elapsedMs: number): number => {
    const elapsedSeconds = elapsedMs / 1000
    const totalTimeRatio = elapsedSeconds / expectedTotalTime

    // 使用平滑的S形曲线，确保进度从1%到95%
    if (totalTimeRatio <= 0.05) {
      // 开始阶段缓慢增长
      return 1 + 9 * (totalTimeRatio / 0.05)
    } else if (totalTimeRatio <= 0.9) {
      // 中间阶段线性增长
      return 10 + 75 * ((totalTimeRatio - 0.05) / 0.85)
    } else {
      // 结束阶段缓慢增长到95%
      const remaining = Math.min(1, (totalTimeRatio - 0.9) / 0.1)
      return 85 + 10 * (1 - Math.pow(1 - remaining, 2))
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

    // 平滑过渡到新进度，避免突然跳变
    const currentProgress = refreshProgress.value
    refreshProgress.value = currentProgress + (newProgress - currentProgress) * 0.2

    // 根据进度更新提示文本
    if (refreshProgress.value < 30) {
      refreshText.value = t('analysis.calculating_indicators')
    } else if (refreshProgress.value < 60) {
      refreshText.value = t('analysis.analyzing_trends')
    } else if (refreshProgress.value < 80) {
      refreshText.value = t('analysis.generating_advice')
    } else {
      refreshText.value = t('analysis.finalizing_data')
    }

    if (refreshProgress.value >= 95) {
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

    // 检查是否已有技术数据
    // 这里我们通过检查localStorage来判断是否已经有技术数据
    // 如果之前已经成功获取过数据，我们假设技术数据已经存在
    const hasTechnicalData = localStorage.getItem(`technical_data_${props.symbol}`) === 'true'

    // 开始模拟进度，传递是否有技术数据的参数
    simulateRefreshProgress(hasTechnicalData)

    // 使用 getLatestTechnicalAnalysis 获取最新报告
    await getLatestTechnicalAnalysis(props.symbol)

    // 标记已获取技术数据
    localStorage.setItem(`technical_data_${props.symbol}`, 'true')

    // 完成刷新 - 平滑过渡到100%并显示完成消息
    refreshText.value = '数据刷新完成！'

    // 确保进度条平滑到达100%
    const finalizeProgress = () => {
      // 获取当前进度
      const currentProgress = refreshProgress.value

      // 如果已经达到100%，关闭弹窗
      if (currentProgress >= 99.9) {
        refreshProgress.value = 100
        setTimeout(() => {
          showRefreshModal.value = false
          emit('refresh')
        }, 500)
        return
      }

      // 否则，平滑过渡到100%
      // 每次增加当前进度到100%之间差距的20%
      const newProgress = currentProgress + (100 - currentProgress) * 0.2
      refreshProgress.value = newProgress

      // 继续更新进度
      requestAnimationFrame(finalizeProgress)
    }

    // 开始最终进度更新
    finalizeProgress()

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