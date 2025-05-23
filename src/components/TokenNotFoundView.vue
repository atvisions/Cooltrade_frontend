<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-4">
    <div class="mb-6">
      <i class="ri-database-2-line text-5xl text-yellow-500"></i>
    </div>
    <h2 class="text-xl font-semibold text-white mb-2">
      {{ getTranslation('tokenNotFound.title',
         currentLang.value === 'zh-CN' ? `${formattedSymbol} 数据未找到` :
         currentLang.value === 'en-US' ? `${formattedSymbol} Data Not Found` :
         currentLang.value === 'ja-JP' ? `${formattedSymbol} データが見つかりません` :
         currentLang.value === 'ko-KR' ? `${formattedSymbol} 데이터를 찾을 수 없습니다` :
         `${formattedSymbol} Data Not Found`,
         { symbol: formattedSymbol })
      }}
    </h2>
    <p class="text-gray-300 mb-6">
      {{ getTranslation('tokenNotFound.description',
         currentLang.value === 'zh-CN' ? '该代币尚未在我们的数据库中，点击下方按钮获取最新数据' :
         currentLang.value === 'en-US' ? 'This token is not yet in our database. Click the button below to get the latest data.' :
         currentLang.value === 'ja-JP' ? 'このトークンはまだデータベースにありません。下のボタンをクリックして最新データを取得してください。' :
         currentLang.value === 'ko-KR' ? '이 토큰은 아직 데이터베이스에 없습니다. 아래 버튼을 클릭하여 최신 데이터를 가져오세요.' :
         'This token is not yet in our database. Click the button below to get the latest data.')
      }}
    </p>

    <button
      class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mb-4 w-full max-w-xs transition-colors duration-200 flex items-center justify-center"
      @click="handleRefresh"
      :disabled="showRefreshModal"
    >
      <span class="flex items-center justify-center">
        <i class="ri-refresh-line mr-2" :class="{ 'animate-spin': showRefreshModal }"></i>
        {{ getTranslation('tokenNotFound.refreshButton',
           currentLang.value === 'zh-CN' ? '获取最新市场数据' :
           currentLang.value === 'en-US' ? 'Get Latest Market Data' :
           currentLang.value === 'ja-JP' ? '最新の市場データを取得' :
           currentLang.value === 'ko-KR' ? '최신 시장 데이터 가져오기' :
           'Get Latest Market Data')
        }}
      </span>
    </button>

    <!-- 刷新进度弹窗 -->
    <div v-if="showRefreshModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-gray-900 rounded-xl p-6 w-[320px] shadow-xl border border-gray-800">
        <h3 class="text-lg font-medium text-center mb-4">
          {{ getTranslation('analysis.refreshing_data',
             currentLang.value === 'zh-CN' ? '正在刷新数据' :
             currentLang.value === 'en-US' ? 'Refreshing Data' :
             currentLang.value === 'ja-JP' ? 'データを更新中' :
             currentLang.value === 'ko-KR' ? '데이터 새로고침 중' :
             'Refreshing Data')
          }}
        </h3>

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
import { ref, watch, computed, onUnmounted, onMounted } from 'vue'
import { getLatestTechnicalAnalysis } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import directI18n, { t as directT } from '@/i18n/direct-loader'
import { useI18n } from 'vue-i18n'

// 使用增强的翻译函数
const { t } = useEnhancedI18n()
// 使用原始的 vue-i18n 翻译函数
const { t: vueT, locale } = useI18n()

// 当前语言
const currentLang = ref(localStorage.getItem('language') || 'en-US')

// 调试函数
const debugTranslation = (key: string, params?: Record<string, any>) => {
  console.log(`[Debug] 翻译键: ${key}`)
  console.log(`[Debug] 当前语言: ${currentLang.value}`)
  console.log(`[Debug] 增强翻译函数结果: ${t(key, params)}`)
  console.log(`[Debug] 直接加载器结果: ${directT(key, params)}`)
  console.log(`[Debug] Vue-i18n 结果: ${vueT(key, params)}`)
}

// 获取翻译文本，如果翻译失败则使用默认值
const getTranslation = (key: string, defaultText: string, params?: Record<string, any>) => {
  const result = t(key, params)
  return result === key ? defaultText : result
}

// 监听语言变化
watch(() => locale.value, (newLocale) => {
  console.log(`[TokenNotFoundView] 语言已变更为: ${newLocale}`)
  currentLang.value = newLocale
  debugTranslation('tokenNotFound.title', { symbol: 'BTC' })
})

// 监听 localStorage 中的语言变化
const setupLanguageChangeListener = () => {
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US'
    console.log(`[TokenNotFoundView] 收到语言变更事件: ${newLang}`)
    currentLang.value = newLang
    debugTranslation('tokenNotFound.title', { symbol: 'BTC' })
  })

  window.addEventListener('force-refresh-i18n', () => {
    const newLang = localStorage.getItem('language') || 'en-US'
    console.log(`[TokenNotFoundView] 收到强制刷新事件: ${newLang}`)
    currentLang.value = newLang
    debugTranslation('tokenNotFound.title', { symbol: 'BTC' })
  })
}

// 在组件挂载时调试翻译并设置监听器
onMounted(() => {
  debugTranslation('tokenNotFound.title', { symbol: 'BTC' })
  debugTranslation('tokenNotFound.description')
  debugTranslation('tokenNotFound.refreshButton')

  // 设置语言变更监听器
  setupLanguageChangeListener()
})

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
  refreshText.value = getTranslation('analysis.calculating_indicators',
    currentLang.value === 'zh-CN' ? '正在获取市场数据并进行技术指标计算...' :
    currentLang.value === 'en-US' ? 'Calculating technical indicators...' :
    currentLang.value === 'ja-JP' ? '技術指標を計算中...' :
    currentLang.value === 'ko-KR' ? '기술 지표 계산 중...' :
    'Calculating technical indicators...')

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
      refreshText.value = getTranslation('analysis.calculating_indicators',
        currentLang.value === 'zh-CN' ? '正在获取市场数据并进行技术指标计算...' :
        currentLang.value === 'en-US' ? 'Calculating technical indicators...' :
        currentLang.value === 'ja-JP' ? '技術指標を計算中...' :
        currentLang.value === 'ko-KR' ? '기술 지표 계산 중...' :
        'Calculating technical indicators...')
    } else if (refreshProgress.value < 60) {
      refreshText.value = getTranslation('analysis.analyzing_trends',
        currentLang.value === 'zh-CN' ? '正在分析市场趋势...' :
        currentLang.value === 'en-US' ? 'Analyzing market trends...' :
        currentLang.value === 'ja-JP' ? '市場トレンドを分析中...' :
        currentLang.value === 'ko-KR' ? '시장 동향 분석 중...' :
        'Analyzing market trends...')
    } else if (refreshProgress.value < 80) {
      refreshText.value = getTranslation('analysis.generating_advice',
        currentLang.value === 'zh-CN' ? '正在生成交易建议...' :
        currentLang.value === 'en-US' ? 'Generating trading advice...' :
        currentLang.value === 'ja-JP' ? '取引アドバイスを生成中...' :
        currentLang.value === 'ko-KR' ? '거래 조언 생성 중...' :
        'Generating trading advice...')
    } else {
      refreshText.value = getTranslation('analysis.finalizing_data',
        currentLang.value === 'zh-CN' ? '正在完成数据处理...' :
        currentLang.value === 'en-US' ? 'Finalizing data...' :
        currentLang.value === 'ja-JP' ? 'データを最終処理中...' :
        currentLang.value === 'ko-KR' ? '데이터 마무리 중...' :
        'Finalizing data...')
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
    refreshText.value = currentLang.value === 'zh-CN' ? '数据刷新完成！' :
      currentLang.value === 'en-US' ? 'Data refresh complete!' :
      currentLang.value === 'ja-JP' ? 'データの更新が完了しました！' :
      currentLang.value === 'ko-KR' ? '데이터 새로고침 완료!' :
      'Data refresh complete!'

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