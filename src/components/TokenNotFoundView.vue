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
import { getTechnicalAnalysis } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import directI18n, { t as directT } from '@/i18n/direct-loader'
import { useI18n } from 'vue-i18n'

// 使用增强的翻译函数
const { t } = useEnhancedI18n()
// 使用原始的 vue-i18n 翻译函数
const { t: vueT, locale } = useI18n()

// 当前语言
const currentLang = ref(localStorage.getItem('language') || 'en-US')

// 获取翻译文本，如果翻译失败则使用默认值
const getTranslation = (key: string, defaultText: string, params?: Record<string, any>) => {
  const result = t(key, params)
  return result === key ? defaultText : result
}

// 监听语言变化
watch(() => locale.value, (newLocale) => {
  currentLang.value = newLocale
})

// 监听 localStorage 中的语言变化
const setupLanguageChangeListener = () => {
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US'
    console.log(`[TokenNotFoundView] 收到语言变更事件: ${newLang}`)
    currentLang.value = newLang
  })

  window.addEventListener('force-refresh-i18n', () => {
    const newLang = localStorage.getItem('language') || 'en-US'
    console.log(`[TokenNotFoundView] 收到强制刷新事件: ${newLang}`)
    currentLang.value = newLang
  })
}

// 在组件挂载时设置监听器
onMounted(() => {
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

  // 使用更短的预期时间，让进度条更快到达高进度值
  // 这样可以避免在高进度值停留太久
  const expectedTotalTime = hasTechnicalData ? 15 : 20

  // 使用线性进度计算，更加可预测
  const getProgressForTime = (elapsedMs: number): number => {
    const elapsedSeconds = elapsedMs / 1000

    // 使用分段线性函数，确保进度平滑且可预测
    if (elapsedSeconds <= 5) {
      // 前5秒：快速增长到30%
      return 1 + 29 * (elapsedSeconds / 5)
    } else if (elapsedSeconds <= 12) {
      // 5-12秒：稳定增长到80%
      return 30 + 50 * ((elapsedSeconds - 5) / 7)
    } else if (elapsedSeconds <= expectedTotalTime) {
      // 12秒到预期时间：缓慢增长到92%
      return 80 + 12 * ((elapsedSeconds - 12) / (expectedTotalTime - 12))
    } else {
      // 超过预期时间：缓慢增长，但不超过94%
      const overtime = elapsedSeconds - expectedTotalTime
      return Math.min(94, 92 + 2 * Math.min(1, overtime / 10))
    }
  }

  // 每200ms更新一次，减少更新频率避免闪动
  refreshTimer = setInterval(() => {
    if (!showRefreshModal.value) {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
      return
    }

    const elapsedMs = Date.now() - startTime
    const targetProgress = getProgressForTime(elapsedMs)

    // 使用更简单的平滑过渡，避免复杂的计算
    const currentProgress = refreshProgress.value
    const progressDiff = targetProgress - currentProgress

    // 如果差距很小，直接设置目标值，避免微小的闪动
    if (Math.abs(progressDiff) < 0.5) {
      refreshProgress.value = targetProgress
    } else {
      // 使用固定的过渡速度，确保平滑
      refreshProgress.value = currentProgress + progressDiff * 0.3
    }

    // 根据进度更新提示文本，使用更细分的阶段
    if (refreshProgress.value < 20) {
      refreshText.value = getTranslation('analysis.calculating_indicators',
        currentLang.value === 'zh-CN' ? '正在获取市场数据并进行技术指标计算...' :
        currentLang.value === 'en-US' ? 'Calculating technical indicators...' :
        currentLang.value === 'ja-JP' ? '技術指標を計算中...' :
        currentLang.value === 'ko-KR' ? '기술 지표 계산 중...' :
        'Calculating technical indicators...')
    } else if (refreshProgress.value < 40) {
      refreshText.value = getTranslation('analysis.analyzing_trends',
        currentLang.value === 'zh-CN' ? '正在分析市场趋势...' :
        currentLang.value === 'en-US' ? 'Analyzing market trends...' :
        currentLang.value === 'ja-JP' ? '市場トレンドを分析中...' :
        currentLang.value === 'ko-KR' ? '시장 동향 분석 중...' :
        'Analyzing market trends...')
    } else if (refreshProgress.value < 60) {
      refreshText.value = getTranslation('analysis.generating_advice',
        currentLang.value === 'zh-CN' ? '正在生成交易建议...' :
        currentLang.value === 'en-US' ? 'Generating trading advice...' :
        currentLang.value === 'ja-JP' ? '取引アドバイスを生成中...' :
        currentLang.value === 'ko-KR' ? '거래 조언 생성 중...' :
        'Generating trading advice...')
    } else if (refreshProgress.value < 80) {
      refreshText.value = getTranslation('analysis.risk_assessment',
        currentLang.value === 'zh-CN' ? '正在评估市场风险...' :
        currentLang.value === 'en-US' ? 'Assessing market risks...' :
        currentLang.value === 'ja-JP' ? '市場リスクを評価中...' :
        currentLang.value === 'ko-KR' ? '시장 위험 평가 중...' :
        'Assessing market risks...')
    } else if (refreshProgress.value < 95) {
      refreshText.value = getTranslation('analysis.finalizing_data',
        currentLang.value === 'zh-CN' ? '正在完成数据处理...' :
        currentLang.value === 'en-US' ? 'Finalizing data...' :
        currentLang.value === 'ja-JP' ? 'データを最終処理中...' :
        currentLang.value === 'ko-KR' ? '데이터 마무리 중...' :
        'Finalizing data...')
    } else {
      refreshText.value = getTranslation('analysis.preparing_report',
        currentLang.value === 'zh-CN' ? '正在准备分析报告...' :
        currentLang.value === 'en-US' ? 'Preparing analysis report...' :
        currentLang.value === 'ja-JP' ? '分析レポートを準備中...' :
        currentLang.value === 'ko-KR' ? '분석 보고서 준비 중...' :
        'Preparing analysis report...')
    }

    // 当进度达到92%时停止定时器，等待API完成
    // 这样可以避免在高进度值停留太久
    if (refreshProgress.value >= 92) {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
    }
  }, 200) // 使用200ms间隔，减少更新频率
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

    // 设置一个更长的等待时间，因为生成新报告需要时间
    const maxWaitTime = 60000 // 60秒

    // 使用正确的API端点：先尝试获取现有报告，如果没有则生成新的
    const apiPromise = getTechnicalAnalysis(props.symbol)

    // 使用 Promise.race 来实现超时机制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时，请稍后重试')), maxWaitTime)
    })

    // 等待API响应或超时
    let result
    try {
      result = await Promise.race([apiPromise, timeoutPromise])
      console.log('API响应结果:', result)

      // 如果响应表明代币未找到且需要刷新，我们需要调用生成报告的API
      if (result && typeof result === 'object' && result.status === 'not_found' && result.needs_refresh) {
        console.log('代币数据未找到，需要生成新报告，调用生成报告API...')

        // 更新进度文本
        refreshText.value = getTranslation('analysis.generating_new_report',
          currentLang.value === 'zh-CN' ? '正在生成新的分析报告，请耐心等待...' :
          currentLang.value === 'en-US' ? 'Generating new analysis report, please wait...' :
          currentLang.value === 'ja-JP' ? '新しい分析レポートを生成中です。お待ちください...' :
          currentLang.value === 'ko-KR' ? '새로운 분석 보고서를 생성 중입니다. 잠시 기다려 주세요...' :
          'Generating new analysis report, please wait...')

        // 调用生成报告的API
        const { getLatestTechnicalAnalysis } = await import('@/api')
        const generatePromise = getLatestTechnicalAnalysis(props.symbol)
        const generateTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('生成报告超时，请稍后重试')), 90000) // 90秒超时
        })

        // 等待报告生成完成
        await Promise.race([generatePromise, generateTimeoutPromise])
        console.log('新报告生成完成')
      }
    } catch (error) {
      // 如果是404错误，说明数据库中没有数据，需要生成新报告
      if (error && error.response && error.response.status === 404) {
        console.log('收到404错误，数据库中没有数据，开始生成新报告...')

        // 更新进度文本
        refreshText.value = getTranslation('analysis.generating_new_report',
          currentLang.value === 'zh-CN' ? '正在生成新的分析报告，请耐心等待...' :
          currentLang.value === 'en-US' ? 'Generating new analysis report, please wait...' :
          currentLang.value === 'ja-JP' ? '新しい分析レポートを生成中です。お待ちください...' :
          currentLang.value === 'ko-KR' ? '새로운 분석 보고서를 생성 중입니다. 잠시 기다려 주세요...' :
          'Generating new analysis report, please wait...')

        // 调用生成报告的API
        const { getLatestTechnicalAnalysis } = await import('@/api')
        const generatePromise = getLatestTechnicalAnalysis(props.symbol)
        const generateTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('生成报告超时，请稍后重试')), 90000) // 90秒超时
        })

        // 等待报告生成完成
        await Promise.race([generatePromise, generateTimeoutPromise])
        console.log('新报告生成完成')
      } else {
        // 其他错误，重新抛出
        throw error
      }
    }

    // 标记已获取技术数据
    localStorage.setItem(`technical_data_${props.symbol}`, 'true')

    // 完成刷新 - 平滑过渡到100%并显示完成消息
    refreshText.value = currentLang.value === 'zh-CN' ? '数据刷新完成！' :
      currentLang.value === 'en-US' ? 'Data refresh complete!' :
      currentLang.value === 'ja-JP' ? 'データの更新が完了しました！' :
      currentLang.value === 'ko-KR' ? '데이터 새로고침 완료!' :
      'Data refresh complete!'

    // 简化最终进度更新，避免复杂的动画逻辑
    // 确保定时器已停止
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }

    // 直接设置进度到100%并关闭弹窗
    refreshProgress.value = 100

    // 短暂延迟后关闭弹窗，让用户看到100%的状态
    setTimeout(() => {
      showRefreshModal.value = false
      emit('refresh')
    }, 800)

  } catch (error) {
    console.error('获取数据失败:', error)

    // 确保定时器已停止
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }

    // 根据错误类型显示不同的提示
    if (error instanceof Error && error.message.includes('请求超时')) {
      // 超时错误：显示特殊的超时提示
      refreshText.value = getTranslation('analysis.timeout_error',
        currentLang.value === 'zh-CN' ? '请求超时，服务器正在处理中，请稍后重试' :
        currentLang.value === 'en-US' ? 'Request timeout. Server is processing, please try again later.' :
        currentLang.value === 'ja-JP' ? 'リクエストタイムアウト。サーバーが処理中です。しばらくしてから再試行してください。' :
        currentLang.value === 'ko-KR' ? '요청 시간 초과. 서버가 처리 중입니다. 나중에 다시 시도해 주세요.' :
        'Request timeout. Server is processing, please try again later.')

      // 设置进度为100%但保持弹窗显示3秒
      refreshProgress.value = 100
      setTimeout(() => {
        showRefreshModal.value = false
      }, 3000)
    } else if (error && error.response && error.response.status === 404) {
      // 404错误：代币不存在，显示特殊提示
      refreshText.value = getTranslation('tokenNotFound.not_supported',
        currentLang.value === 'zh-CN' ? '该代币暂不支持，请尝试其他代币' :
        currentLang.value === 'en-US' ? 'This token is not supported yet, please try other tokens' :
        currentLang.value === 'ja-JP' ? 'このトークンはまだサポートされていません。他のトークンをお試しください' :
        currentLang.value === 'ko-KR' ? '이 토큰은 아직 지원되지 않습니다. 다른 토큰을 시도해 주세요' :
        'This token is not supported yet, please try other tokens')

      // 设置进度为100%但保持弹窗显示3秒
      refreshProgress.value = 100
      setTimeout(() => {
        showRefreshModal.value = false
      }, 3000)
    } else {
      // 其他错误：记录错误信息并立即关闭弹窗
      console.error('未处理的错误类型:', error)
      showRefreshModal.value = false
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