<template>
  <div class="relative h-[600px] flex flex-col bg-[#0F172A]">
    <!-- 顶部导航栏 -->
    <header class="absolute top-0 left-0 right-0 z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex justify-between items-center px-4 py-3">
          <h1 class="text-lg font-semibold">{{ currentSymbol ? `${getBaseSymbol(currentSymbol)}市场分析报告` : '加载中...' }}</h1>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-gray-400">更新时间: {{ formatTime(analysisData?.last_update_time) }}</span>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition"
              @click="forceRefreshData"
              :disabled="loading || showRefreshModal"
            >
              <i class="ri-refresh-line ri-lg" :class="{ 'animate-spin': loading }"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="absolute inset-0 top-12 bottom-16 overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p class="text-gray-400">正在加载分析数据...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center h-full">
        <div class="text-center px-4">
          <i class="ri-error-warning-line text-4xl text-red-500 mb-2"></i>
          <p class="text-gray-300 mb-4">{{ error }}</p>
          <button
            class="px-4 py-2 bg-primary text-white rounded-lg"
            @click="refreshData"
          >
            重试
          </button>
        </div>
      </div>

      <!-- 正常内容 -->
      <div v-else class="max-w-[375px] mx-auto px-4 pb-16">
        <!-- 价格展示卡片 -->
        <div class="mt-6 p-5 rounded-lg bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 shadow-lg">
          <h2 class="text-center text-gray-400 mb-1">当前价格</h2>
          <div class="text-center text-3xl font-bold mb-2" v-if="analysisData">
            {{ formatPrice(realtimePrice || analysisData.current_price) }}
            <span class="text-sm text-gray-400">USD</span>
          </div>
          <div class="text-center text-3xl font-bold mb-2" v-else>
            -- USD
          </div>

          <div class="flex justify-center gap-3 mt-4 mb-2">
            <button class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-800/70 text-sm backdrop-blur-sm cursor-pointer">
              <i class="ri-save-line w-4 h-4 flex items-center justify-center"></i>
              <span>保存截图</span>
            </button>
            <button class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-800/70 text-sm backdrop-blur-sm cursor-pointer">
              <i class="ri-share-line w-4 h-4 flex items-center justify-center"></i>
              <span>分享到推特</span>
            </button>
          </div>

          <!-- 价格走势图 -->
          <div class="relative mt-4">
            <div v-if="chartLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-[#0A1A3A]/80">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <!-- 确保ref直接绑定到div上，并添加id属性以便于调试 -->
            <div id="price-chart-container" ref="priceChart" class="price-chart h-[180px] rounded-lg overflow-hidden bg-[#0F2A5A] shadow-lg border-2 border-blue-500/50 flex items-center justify-center">
              <div v-if="!chartLoading && (!priceHistory?.prices || priceHistory.prices.length === 0)" class="text-gray-400 text-sm">
                暂无价格数据
              </div>
            </div>
          </div>
        </div>

        <!-- 趋势分析卡片 -->
        <div class="mt-6 grid grid-cols-3 gap-3" v-if="analysisData?.trend_analysis?.probabilities">
          <div class="p-3 rounded-lg bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 text-center">
            <div class="text-green-400 text-xl font-bold mb-1">{{ formatPercent(analysisData.trend_analysis.probabilities.up) }}</div>
            <div class="text-xs text-green-300 flex items-center justify-center">
              <i class="ri-arrow-up-line w-4 h-4 flex items-center justify-center"></i>
              <span>上涨趋势</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30 text-center">
            <div class="text-gray-300 text-xl font-bold mb-1">{{ formatPercent(analysisData.trend_analysis.probabilities.sideways) }}</div>
            <div class="text-xs text-gray-400 flex items-center justify-center">
              <i class="ri-subtract-line w-4 h-4 flex items-center justify-center"></i>
              <span>横盘整理</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 text-center">
            <div class="text-red-400 text-xl font-bold mb-1">{{ formatPercent(analysisData.trend_analysis.probabilities.down) }}</div>
            <div class="text-xs text-red-300 flex items-center justify-center">
              <i class="ri-arrow-down-line w-4 h-4 flex items-center justify-center"></i>
              <span>下跌趋势</span>
            </div>
          </div>
        </div>

        <!-- 市场趋势分析 -->
        <div class="mt-6" v-if="analysisData?.trend_analysis?.summary">
          <h3 class="text-lg font-medium mb-3">市场趋势分析</h3>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <p class="text-gray-300 leading-relaxed">
              {{ analysisData.trend_analysis.summary }}
            </p>
          </div>
        </div>

        <!-- 技术指标分析 -->
        <div class="mt-6" v-if="analysisData?.indicators_analysis">
          <h3 class="text-lg font-medium mb-3">技术指标</h3>
          <div class="flex flex-col gap-3">
            <!-- 单参数指标 -->
            <div class="grid grid-cols-2 gap-3">
              <!-- RSI -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1">RSI (14)</div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.RSI.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.RSI.support_trend)" class="text-xs">
                    {{ getIndicatorText(analysisData.indicators_analysis.RSI.support_trend) }}
                  </span>
                </div>
              </div>

              <!-- BIAS -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">BIAS</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ analysisData.indicators_analysis.BIAS.value }}</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.BIAS.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.BIAS.support_trend) }}
                </span>
              </div>
            </div>

            <!-- PSY -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">PSY</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ analysisData.indicators_analysis.PSY.value }}</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.PSY.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.PSY.support_trend) }}
                </span>
              </div>
            </div>

            <!-- VWAP -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">VWAP</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ analysisData.indicators_analysis.VWAP.value.toFixed(2) }}</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.VWAP.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.VWAP.support_trend) }}
                </span>
              </div>
            </div>

            <!-- FundingRate -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">资金费率</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ (analysisData.indicators_analysis.FundingRate.value * 100).toFixed(4) }}%</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.FundingRate.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.FundingRate.support_trend) }}
                </span>
              </div>
            </div>

            <!-- ExchangeNetflow -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">交易所净流入</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ analysisData.indicators_analysis.ExchangeNetflow.value.toFixed(2) }}</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.ExchangeNetflow.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.ExchangeNetflow.support_trend) }}
                </span>
              </div>
            </div>

            <!-- NUPL -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">NUPL</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ analysisData.indicators_analysis.NUPL.value.toFixed(2) }}</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.NUPL.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.NUPL.support_trend) }}
                </span>
              </div>
            </div>

            <!-- MayerMultiple -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">梅耶倍数</div>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ analysisData.indicators_analysis.MayerMultiple.value.toFixed(2) }}</span>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.MayerMultiple.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.MayerMultiple.support_trend) }}
                </span>
              </div>
            </div>
            </div>

            <!-- MACD (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400">MACD</div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.MACD.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.MACD.support_trend) }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">柱状图</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.histogram.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">MACD线</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.line.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">信号线</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.signal.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- 布林带 (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400">布林带</div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.BollingerBands.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.BollingerBands.support_trend) }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-red-900/20 border border-red-800/30">
                  <div class="text-xs text-gray-400">上轨</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.upper.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-gray-700/30 border border-gray-600/30">
                  <div class="text-xs text-gray-400">中轨</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.middle.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-green-900/20 border border-green-800/30">
                  <div class="text-xs text-gray-400">下轨</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.lower.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- DMI (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400">DMI</div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.DMI.support_trend)" class="text-xs">
                  {{ getIndicatorText(analysisData.indicators_analysis.DMI.support_trend) }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-green-900/20 border border-green-800/30">
                  <div class="text-xs text-gray-400">+DI</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.DMI.value.plus_di.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-red-900/20 border border-red-800/30">
                  <div class="text-xs text-gray-400">-DI</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.DMI.value.minus_di.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">ADX</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.DMI.value.adx.toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 支撑阻力位 -->
        <div class="mt-6" v-if="analysisData?.trading_advice">
          <h3 class="text-lg font-medium mb-3">交易建议</h3>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">建议操作</div>
              <div class="text-sm" :class="analysisData.trading_advice.action === '买入' ? 'text-green-400' : analysisData.trading_advice.action === '卖出' ? 'text-red-400' : 'text-gray-400'">
                {{ analysisData.trading_advice.action }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">入场价格</div>
              <div class="text-sm">{{ formatPrice(analysisData.trading_advice.entry_price) }}</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">止损价格</div>
              <div class="text-sm text-red-400">{{ formatPrice(analysisData.trading_advice.stop_loss) }}</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">目标价格</div>
              <div class="text-sm text-green-400">{{ formatPrice(analysisData.trading_advice.take_profit) }}</div>
            </div>
            <div class="pt-2 border-t border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">原因分析</div>
              <div class="text-sm text-gray-300">{{ analysisData.trading_advice.reason }}</div>
            </div>
          </div>
        </div>

        <!-- 风险评估 -->
        <div class="mt-6" v-if="analysisData?.risk_assessment">
          <h3 class="text-lg font-medium mb-3">风险评估</h3>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm text-gray-400">风险等级</div>
              <div class="px-2 py-0.5 rounded"
                :class="{
                  'bg-red-900/30 text-red-400': analysisData.risk_assessment.level === '高',
                  'bg-yellow-900/30 text-yellow-400': analysisData.risk_assessment.level === '中',
                  'bg-green-900/30 text-green-400': analysisData.risk_assessment.level === '低'
                }">
                {{ analysisData.risk_assessment.level }}
              </div>
            </div>
            <div class="mb-3">
              <div class="text-sm text-gray-400 mb-1">风险评分</div>
              <div class="w-full bg-gray-700/50 rounded-full h-2">
                <div class="h-2 rounded-full"
                  :class="{
                    'bg-red-500': analysisData.risk_assessment.score > 70,
                    'bg-yellow-500': analysisData.risk_assessment.score > 30 && analysisData.risk_assessment.score <= 70,
                    'bg-green-500': analysisData.risk_assessment.score <= 30
                  }"
                  :style="{ width: `${analysisData.risk_assessment.score}%` }"></div>
              </div>
            </div>
            <div v-if="analysisData.risk_assessment.details && analysisData.risk_assessment.details.length > 0">
              <div class="text-sm text-gray-400 mb-1">风险因素</div>
              <ul class="text-sm text-gray-300 list-disc pl-5 space-y-1">
                <li v-for="(detail, index) in analysisData.risk_assessment.details" :key="index">
                  {{ detail }}
                </li>
              </ul>
            </div>
          </div>
        </div>


      </div>
    </main>

    <!-- 刷新进度弹窗 -->
    <div v-if="showRefreshModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-gray-900 rounded-xl p-6 w-[320px] shadow-xl border border-gray-800">
        <h3 class="text-lg font-medium text-center mb-4">正在刷新数据</h3>

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

    <!-- 底部导航栏 -->
    <nav class="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="grid grid-cols-2 h-16">
          <router-link to="/" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
            <i class="ri-line-chart-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">行情</span>
          </router-link>
          <router-link to="/profile" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-user-3-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">我的</span>
          </router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getTechnicalAnalysis, getPriceHistory, type TechnicalAnalysisData, type PriceHistoryData } from '@/api'
import { parseSymbolFromUrl } from '@/utils/trading'

// 检查是否在扩展环境中
const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.getURL === 'function';
}

const priceChart = ref<HTMLElement | null>(null)
const analysisData = ref<TechnicalAnalysisData | null>(null)
const priceHistory = ref<PriceHistoryData | null>(null)
const loading = ref(false)
const chartLoading = ref(false)
const error = ref<string | null>(null)
const currentSymbol = ref<string>('')
const retryCount = ref(0)
const realtimePrice = ref<number | null>(null)

const showRefreshModal = ref(false)
const refreshProgress = ref(0)
const refreshText = ref('正在刷新数据...')

let refreshTimer: ReturnType<typeof setInterval> | null = null
let myChart: echarts.ECharts | null = null
let ws: WebSocket | null = null

// 初始化WebSocket连接
const initWebSocket = () => {
  if (ws) {
    ws.close()
  }

  const wsUrl = `wss://stream.binance.com:9443/ws/${currentSymbol.value.toLowerCase()}usdt@ticker`
  ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    realtimePrice.value = parseFloat(data.c)
  }

  ws.onerror = (error) => {
    console.error('WebSocket错误:', error)
  }

  ws.onclose = () => {
    console.log('WebSocket连接关闭')
  }
}

// 在组件挂载时初始化WebSocket
onMounted(() => {
  if (currentSymbol.value) {
    initWebSocket()
  }
})

// 在组件卸载时关闭WebSocket
onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})

// 监听currentSymbol变化，重新初始化WebSocket
watch(currentSymbol, (newSymbol) => {
  if (newSymbol) {
    initWebSocket()
  }
})

// 格式化价格显示
const formatPrice = (price?: number | string | null) => {
  // 检查价格是否为undefined或null
  if (price === undefined || price === null) return '--'

  // 如果价格是字符串，尝试转换为数字
  if (typeof price === 'string') {
    // 尝试直接解析数字（包括科学计数法）
    price = parseFloat(price)

    // 如果转换失败，返回原始字符串
    if (isNaN(price)) return price || '--'
  }

  // 确保价格是数字类型
  const numPrice = Number(price)
  if (isNaN(numPrice)) return '--'

  // 处理非常小的数值（科学计数法）
  if (numPrice < 0.0001) {
    // 对于非常小的数值，使用科学计数法或更精确的表示
    if (numPrice < 0.00000001) {
      // 极小值使用科学计数法
      return numPrice.toExponential(8)
    } else {
      // 小值但不是极小值，显示更多小数位
      return numPrice.toFixed(8)
    }
  } else if (numPrice < 1) {
    // 小于1的价格显示6位小数
    return numPrice.toFixed(6)
  } else if (numPrice < 1000) {
    // 普通价格显示2位小数
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } else {
    // 大额价格显示2位小数
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
}

// 格式化时间显示
const formatTime = (timeString?: string): string => {
  if (!timeString) return '--'
  try {
    const date = new Date(timeString)
    if (isNaN(date.getTime())) {
      return '无效时间'
    }
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)

    if (diff < 60) {
      return `${diff}分钟前`
    } else if (diff < 24 * 60) {
      return `${Math.floor(diff / 60)}小时前`
    } else {
      return `${Math.floor(diff / (24 * 60))}天前`
    }
  } catch (e) {
    console.error('时间格式化错误:', e)
    return '时间错误'
  }
}

// 获取基础货币名称
const getBaseSymbol = (symbol: string) => {
  return symbol.replace('USDT', '')
}

// 加载分析数据
const loadAnalysisData = async (forceRefresh: boolean = false) => {
  try {
    loading.value = true
    error.value = null

    let symbol: string | null = null;
    let url: string = '';

    if (isExtensionEnvironment()) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]

        if (!tab.url) {
          error.value = '无法获取当前页面URL'
          return
        }

        url = tab.url
        symbol = parseSymbolFromUrl(url)
      } catch (e) {
        console.error('获取标签页信息失败:', e)
        error.value = '无法访问当前标签页，请确保已授予必要权限'
        return
      }
    } else {
      url = window.location.href
      symbol = parseSymbolFromUrl(url)
    }

    if (!symbol) {
      console.error('无法从URL解析交易对:', url)
      error.value = '当前页面不是支持的交易所交易页面，或无法识别交易对信息'
      return
    }

    currentSymbol.value = symbol
    console.log('正在获取交易对数据:', symbol)

    try {
      const [analysisResponse, priceResponse] = await Promise.all([
        getTechnicalAnalysis(symbol, forceRefresh),
        getPriceHistory(symbol)
      ])

      console.log('原始分析数据:', JSON.stringify(analysisResponse, null, 2))
      console.log('原始价格数据:', JSON.stringify(priceResponse, null, 2))

      // 数据验证
      if (!analysisResponse || !analysisResponse.current_price || !analysisResponse.trend_analysis) {
        console.error('分析数据格式错误:', analysisResponse)
        throw new Error('分析数据格式错误')
      }

      if (!priceResponse || !priceResponse.prices || !Array.isArray(priceResponse.prices)) {
        console.error('价格历史数据为空:', priceResponse)
        throw new Error('价格历史数据为空')
      }

      // 更新数据
      analysisData.value = analysisResponse
      priceHistory.value = priceResponse

      // 重置重试计数
      retryCount.value = 0
      console.log('数据获取成功，开始初始化图表')

      // 确保视图更新
      await nextTick()

      // 确保视图更新后再初始化图表
      await nextTick()

      // 检查图表容器是否存在
      console.log('图表容器检查:', {
        priceChartRef: priceChart.value,
        priceChartElement: document.getElementById('price-chart-container')
      })

      // 初始化图表
      if (priceChart.value) {
        chartLoading.value = true
        console.log('开始初始化图表，价格数据长度:', priceResponse.prices.length)

        // 确保DOM已完全渲染
        await nextTick()

        try {
          // 延迟一点时间确保DOM已完全渲染
          setTimeout(() => {
            try {
              console.log('DOM已渲染，开始初始化图表')
              initChart()
            } catch (innerError) {
              console.error('图表初始化内部错误:', innerError)
            } finally {
              chartLoading.value = false
            }
          }, 500)
        } catch (chartError) {
          console.error('初始化图表失败:', chartError)
          chartLoading.value = false
        }
      } else {
        console.error('图表容器不存在')
      }

      // 确认数据已更新
      console.log('视图数据已更新，当前价格:', formatPrice(analysisData.value?.current_price))

    } catch (apiError: any) {
      console.error('API调用失败:', apiError)
      error.value = apiError.message || '加载数据失败'
    }

  } catch (e) {
    console.error('加载分析数据失败:', e)
    if (!error.value) {
      error.value = e instanceof Error ? e.message : '加载数据失败'
    }
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initChart = () => {
  console.log('初始化图表 - 开始')

  // 再次检查图表容器
  if (!priceChart.value) {
    console.error('图表容器不存在，无法初始化图表')
    return
  }

  // 检查DOM元素尺寸
  const containerWidth = priceChart.value.clientWidth
  const containerHeight = priceChart.value.clientHeight
  console.log(`图表容器尺寸: ${containerWidth}x${containerHeight}`)

  if (containerWidth === 0 || containerHeight === 0) {
    console.error('图表容器尺寸为0，无法初始化图表')
    return
  }

  // 如果没有价格历史数据，不显示图表
  if (!priceHistory.value?.prices) {
    console.error('没有价格历史数据，无法初始化图表')
    return
  }

  try {
    // 销毁旧图表实例
    if (myChart) {
      console.log('销毁旧图表实例')
      myChart.dispose()
      myChart = null
    }

    // 创建新图表实例
    console.log('创建新图表实例...')
    myChart = echarts.init(priceChart.value)
    console.log('创建新图表实例成功')

    const prices = priceHistory.value.prices
    console.log('处理价格数据，数据点数量:', prices.length)

    // 打印完整的价格数据以便调试
    console.log('价格数据样本:', JSON.stringify(prices.slice(0, 5)))
    console.log('价格数据类型检查:', {
      timestamp: typeof prices[0].timestamp,
      price: typeof prices[0].price
    })

    // 确保价格数据格式正确
    if (!prices.every(item => typeof item.timestamp === 'number' && typeof item.price === 'number')) {
      console.error('价格数据格式不正确，尝试修复')
      // 尝试修复数据格式
      const fixedPrices = prices.map(item => ({
        timestamp: typeof item.timestamp === 'string' ? new Date(item.timestamp).getTime() : item.timestamp,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
      }))
      console.log('修复后的价格数据样本:', fixedPrices.slice(0, 3))

      // 使用修复后的数据
      // 使用时间戳作为X轴数据
      const data = fixedPrices.map(item => [item.timestamp, item.price])

      // 不再需要单独的times变量

      // 准备图表配置

      console.log('设置图表配置')
      // 创建一个简化的图表配置
      const option = {
        animation: false,
        grid: {
          left: 10,
          right: 10,
          bottom: 10,
          top: 10,
          containLabel: false
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              show: false
            },
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)',
              width: 1
            },
            crossStyle: {
              color: 'rgba(255, 255, 255, 0.3)',
              width: 1
            }
          },
          backgroundColor: 'rgba(15, 42, 90, 0.9)',
          borderColor: 'rgba(91, 158, 255, 0.5)',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          },
          formatter: function(params: any) {
            console.log('Tooltip params:', params);
            const data = params[0];

            // 检查data.name是否为有效的时间字符串
            let formattedDate = '';
            try {
              // 尝试直接使用时间字符串
              if (data.name && data.name.includes(':')) {
                formattedDate = data.name;
              } else {
                // 尝试将时间戳转换为日期
                const timestamp = data.axisValue || data.name;
                if (timestamp && !isNaN(Number(timestamp))) {
                  const date = new Date(Number(timestamp));
                  formattedDate = `${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:00`;
                } else {
                  formattedDate = '时间未知';
                }
              }
            } catch (e) {
              console.error('日期格式化错误:', e, data);
              formattedDate = '时间未知';
            }

            // 获取历史价格 - 从data.value或data.data[1]中获取
            let historyPrice;
            if (data.value !== undefined && data.value !== null) {
              historyPrice = data.value;
            } else if (data.data && data.data.length > 1) {
              historyPrice = data.data[1];
            } else {
              historyPrice = null;
            }

            // 格式化历史价格
            const formattedHistoryPrice = historyPrice !== null ? formatPrice(historyPrice) : '--';

            // 获取当前实时价格
            const currentPrice = analysisData.value?.current_price || '';
            const formattedCurrentPrice = currentPrice ? formatPrice(currentPrice) : '';

            // 返回格式化的tooltip内容
            let tooltipContent = `${formattedDate}<br/>${data.marker} 历史价格: <strong>${formattedHistoryPrice}</strong>`;

            // 如果有当前价格，添加到tooltip中
            if (formattedCurrentPrice) {
              tooltipContent += `<br/>当前实时价格: <strong style="color:#4CAF50">${formattedCurrentPrice}</strong>`;
            }

            return tooltipContent;
          }
        },
        xAxis: {
          show: false,
          type: 'time',  // 使用时间类型
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false }
        },
        yAxis: {
          show: false,
          type: 'value',
          scale: true
        },
        series: [
          {
            name: '价格',
            type: 'line',
            data: data, // 使用[时间戳, 价格]格式的数据
            encode: {
              x: 0, // 第一个元素是X轴数据（时间戳）
              y: 1  // 第二个元素是Y轴数据（价格）
            },
            smooth: true,
            symbol: 'circle',
            symbolSize: 0, // 默认不显示
            showSymbol: false, // 默认不显示点
            emphasis: {
              scale: true,
              symbolSize: 6, // 鼠标悬停时显示
            },
            itemStyle: {
              color: '#5B9EFF'
            },
            lineStyle: {
              color: '#5B9EFF',
              width: 3
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(91, 158, 255, 0.8)' },
                { offset: 1, color: 'rgba(91, 158, 255, 0.1)' }
              ])
            }
          }
        ],
        backgroundColor: '#0F2A5A'
      }

      console.log('应用图表配置')
      myChart.setOption(option)
    } else {
      // 使用原始数据
      // 使用时间戳作为X轴数据
      const data = prices.map(item => [item.timestamp, item.price])

      // 不再需要单独的times变量

      // 准备图表配置

      console.log('设置图表配置')
      // 创建一个简化的图表配置
      const option = {
        animation: false,
        grid: {
          left: 10,
          right: 10,
          bottom: 10,
          top: 10,
          containLabel: false
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              show: false
            },
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)',
              width: 1
            },
            crossStyle: {
              color: 'rgba(255, 255, 255, 0.3)',
              width: 1
            }
          },
          backgroundColor: 'rgba(15, 42, 90, 0.9)',
          borderColor: 'rgba(91, 158, 255, 0.5)',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          },
          formatter: function(params: any) {
            console.log('Tooltip params:', params);
            const data = params[0];

            // 检查data.name是否为有效的时间字符串
            let formattedDate = '';
            try {
              // 尝试直接使用时间字符串
              if (data.name && data.name.includes(':')) {
                formattedDate = data.name;
              } else {
                // 尝试将时间戳转换为日期
                const timestamp = data.axisValue || data.name;
                if (timestamp && !isNaN(Number(timestamp))) {
                  const date = new Date(Number(timestamp));
                  formattedDate = `${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:00`;
                } else {
                  formattedDate = '时间未知';
                }
              }
            } catch (e) {
              console.error('日期格式化错误:', e, data);
              formattedDate = '时间未知';
            }

            // 获取历史价格 - 从data.value或data.data[1]中获取
            let historyPrice;
            if (data.value !== undefined && data.value !== null) {
              historyPrice = data.value;
            } else if (data.data && data.data.length > 1) {
              historyPrice = data.data[1];
            } else {
              historyPrice = null;
            }

            // 格式化历史价格
            const formattedHistoryPrice = historyPrice !== null ? formatPrice(historyPrice) : '--';

            // 获取当前实时价格
            const currentPrice = analysisData.value?.current_price || '';
            const formattedCurrentPrice = currentPrice ? formatPrice(currentPrice) : '';

            // 返回格式化的tooltip内容
            let tooltipContent = `${formattedDate}<br/>${data.marker} 历史价格: <strong>${formattedHistoryPrice}</strong>`;

            // 如果有当前价格，添加到tooltip中
            if (formattedCurrentPrice) {
              tooltipContent += `<br/>当前实时价格: <strong style="color:#4CAF50">${formattedCurrentPrice}</strong>`;
            }

            return tooltipContent;
          }
        },
        xAxis: {
          show: false,
          type: 'time',  // 使用时间类型
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false }
        },
        yAxis: {
          show: false,
          type: 'value',
          scale: true
        },
        series: [
          {
            name: '价格',
            type: 'line',
            data: data, // 使用[时间戳, 价格]格式的数据
            encode: {
              x: 0, // 第一个元素是X轴数据（时间戳）
              y: 1  // 第二个元素是Y轴数据（价格）
            },
            smooth: true,
            symbol: 'circle',
            symbolSize: 0, // 默认不显示
            showSymbol: false, // 默认不显示点
            emphasis: {
              scale: true,
              symbolSize: 6, // 鼠标悬停时显示
            },
            itemStyle: {
              color: '#5B9EFF'
            },
            lineStyle: {
              color: '#5B9EFF',
              width: 3
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(91, 158, 255, 0.8)' },
                { offset: 1, color: 'rgba(91, 158, 255, 0.1)' }
              ])
            }
          }
        ],
        backgroundColor: '#0F2A5A'
      }

      console.log('应用图表配置')
      myChart.setOption(option)
    }

    // 确保图表正确适应容器大小
    setTimeout(() => {
      if (myChart) {
        myChart.resize()
        console.log('图表大小已调整')
      }
    }, 500)

    console.log('图表初始化完成')
  } catch (e) {
    console.error('初始化图表失败:', e)
    error.value = '初始化图表失败'
  }
}

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
  if (myChart) {
    console.log('窗口大小变化，调整图表大小')
    myChart.resize()
  }
}

window.addEventListener('resize', handleResize)

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (myChart) {
    myChart.dispose()
  }
})

// 组件挂载时加载数据
onMounted(async () => {
  console.log('组件挂载，准备加载数据')

  // 确保DOM已完全渲染
  await nextTick()

  // 延迟一点时间确保DOM已完全渲染
  setTimeout(async () => {
    try {
      console.log('开始加载分析数据')
      await loadAnalysisData()

      // 如果图表没有正确初始化，尝试再次初始化
      setTimeout(() => {
        if (priceChart.value && priceHistory.value?.prices && (!myChart || !myChart.getOption())) {
          console.log('尝试再次初始化图表')
          chartLoading.value = true
          try {
            initChart()
          } finally {
            chartLoading.value = false
          }
        } else if (priceChart.value && (!priceHistory.value?.prices || priceHistory.value.prices.length === 0)) {
          // 如果没有价格数据，尝试创建一个测试图表
          console.log('没有价格数据，尝试创建测试图表')
          chartLoading.value = true
          try {
            // 创建测试数据
            const testData = Array.from({ length: 24 }, (_, i) => ({
              timestamp: Date.now() - (23 - i) * 3600 * 1000,
              price: 1000 + Math.random() * 100
            }))

            // 临时设置价格数据
            const originalPriceHistory = priceHistory.value
            priceHistory.value = {
              symbol: 'TEST',
              interval: '1h',
              period: '24h',
              prices: testData,
              change_percent: 0,
              high: 0,
              low: 0
            }

            // 初始化图表
            initChart()

            // 恢复原始价格数据
            setTimeout(() => {
              priceHistory.value = originalPriceHistory
            }, 2000)
          } finally {
            chartLoading.value = false
          }
        }
      }, 1000)
    } catch (e) {
      console.error('加载数据失败:', e)
    }
  }, 500)
})

// 监听交易对变化，更新图表
watch(currentSymbol, async (newSymbol) => {
  if (newSymbol) {
    await loadAnalysisData()
  }
})

// 格式化百分比
const formatPercent = (value?: number | string | null) => {
  // 检查值是否为undefined或null
  if (value === undefined || value === null) return '--'

  // 如果值是字符串，尝试转换为数字
  if (typeof value === 'string') {
    // 移除非数字字符（保留小数点）
    const cleanedValue = value.replace(/[^\d.]/g, '')
    value = parseFloat(cleanedValue)

    // 如果转换失败，返回原始字符串
    if (isNaN(value)) return cleanedValue ? `${cleanedValue}%` : '--'
  }

  // 确保值是数字类型
  const numValue = Number(value)
  if (isNaN(numValue)) return '--'

  // 如果值已经是百分比形式（0-100范围），则直接返回
  if (numValue > 1) {
    return `${Math.round(numValue)}%`
  }

  // 如果值是小数形式（0-1范围），则转换为百分比
  return `${Math.round(numValue * 100)}%`
}

// 获取指标趋势文本
const getIndicatorText = (trend?: string) => {
  if (!trend) return '--'
  if (trend === 'bullish' || trend === '看涨') return '看涨'
  if (trend === 'bearish' || trend === '看跌') return '看跌'
  if (trend === 'neutral' || trend === '中性') return '中性'
  return trend
}

// 获取指标趋势样式
const getIndicatorClass = (trend?: string) => {
  if (!trend) return 'text-gray-400'
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') return 'text-green-400'
  if (trend === 'bearish' || trend === '看跌' || trend === '不支持当前趋势') return 'text-red-400'
  if (trend === 'neutral' || trend === '中性') return 'text-yellow-400'
  return 'text-gray-400'
}

// 模拟真实刷新进度
const simulateRefreshProgress = () => {
  // 清除之前的定时器
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  // 重置进度
  refreshProgress.value = 1 // 从1%开始，让用户立即看到进度
  showRefreshModal.value = true
  refreshText.value = '正在获取市场数据并进行技术指标计算...'

  // 记录开始时间
  const startTime = Date.now()

  // 使用非线性函数来模拟进度
  // 前10秒快速增长到40%
  // 中间10秒增长到70%
  // 最后10秒缓慢增长到95%
  const getProgressForTime = (elapsedMs: number): number => {
    // 直接使用毫秒计算，不需要转换为秒
    const elapsedSeconds = elapsedMs / 1000

    // 使用平方根函数使进度条在开始时更快，后面更慢
    if (elapsedSeconds <= 10) {
      // 0-10秒: 1% 到 40%
      return 1 + 39 * Math.sqrt(elapsedSeconds / 10)
    } else if (elapsedSeconds <= 20) {
      // 10-20秒: 40% 到 70%
      return 40 + 30 * ((elapsedSeconds - 10) / 10)
    } else {
      // 20-30秒: 70% 到 95%
      const remaining = Math.min(1, (elapsedSeconds - 20) / 10)
      // 使用缓动函数，让后期增长更慢
      return 70 + 25 * (1 - Math.pow(1 - remaining, 3))
    }
  }

  // 每100ms更新一次，使动画更流畅
  refreshTimer = setInterval(() => {
    const elapsedMs = Date.now() - startTime

    // 计算当前应该显示的进度
    refreshProgress.value = Math.min(95, getProgressForTime(elapsedMs))

    // 根据进度更新提示文本
    if (refreshProgress.value < 30) {
      refreshText.value = '正在获取市场数据并进行技术指标计算...'
    } else if (refreshProgress.value < 60) {
      refreshText.value = '正在进行趋势分析和概率评估...'
    } else if (refreshProgress.value < 85) {
      refreshText.value = '正在生成交易建议和风险评估...'
    } else {
      refreshText.value = '最终数据整合中，即将完成...'
    }

    // 达到95%后停止，等待实际请求完成
    if (refreshProgress.value >= 95) {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
    }
  }, 100) // 每100毫秒更新一次进度，使动画更流畅
}

// 强制刷新数据
const forceRefreshData = async () => {
  try {
    // 开始模拟进度
    simulateRefreshProgress()

    // 调用API强制刷新数据
    if (currentSymbol.value) {
      try {
        const data = await getTechnicalAnalysis(currentSymbol.value, true)

        // 详细记录API返回的数据结构
        console.log('强制刷新API返回的原始数据:', JSON.stringify(data))

        // 检查数据结构
        if (!data || !data.current_price || !data.trend_analysis) {
          console.error('强制刷新API返回的数据格式不正确')
          error.value = '强制刷新失败，请稍后重试'
          return
        }

        // 强制刷新成功后，等待1秒再请求普通接口获取最新数据
        console.log('强制刷新成功，等待1秒后获取最新数据...')
        refreshText.value = '刷新成功！正在获取最新分析数据...'

        // 等待1秒，确保后端数据已更新
        await new Promise(resolve => setTimeout(resolve, 1000))

        try {
          // 请求普通接口获取最新数据
          console.log('开始请求普通接口获取最新数据:', currentSymbol.value)
          const freshData = await getTechnicalAnalysis(currentSymbol.value, false)

          console.log('获取最新数据成功:', JSON.stringify(freshData))

          // 检查数据结构
          if (freshData && freshData.current_price && freshData.trend_analysis) {
            // 更新数据
            analysisData.value = freshData
            console.log('已更新为最新数据')

            // 检查关键字段
            console.log('检查关键字段:')
            console.log('- current_price:', freshData.current_price)
            console.log('- last_update_time:', freshData.last_update_time)
            console.log('- trend_analysis存在:', !!freshData.trend_analysis)
            console.log('- indicators_analysis存在:', !!freshData.indicators_analysis)

            // 确保趋势分析数据更新
            if (freshData?.trend_analysis?.probabilities) {
              console.log('更新后的趋势分析数据:', {
                up: freshData.trend_analysis.probabilities.up,
                sideways: freshData.trend_analysis.probabilities.sideways,
                down: freshData.trend_analysis.probabilities.down
              })
            } else {
              console.error('趋势分析数据不存在或格式不正确')
            }
          } else {
            // 如果获取最新数据失败，则使用强制刷新返回的数据
            console.warn('获取最新数据失败，使用强制刷新返回的数据')
            analysisData.value = data
          }
        } catch (freshError) {
          console.error('获取最新数据失败:', freshError)
          // 如果获取最新数据失败，则使用强制刷新返回的数据
          analysisData.value = data
        }

        // 确保视图更新
        await nextTick()
        console.log('视图已更新')

        // 更新价格历史数据并重新初始化图表
        try {
          const newPriceHistory = await getPriceHistory(currentSymbol.value)
          if (newPriceHistory && newPriceHistory.prices && Array.isArray(newPriceHistory.prices)) {
            priceHistory.value = newPriceHistory

            // 初始化图表
            if (priceChart.value) {
              chartLoading.value = true
              try {
                initChart()
              } finally {
                chartLoading.value = false
              }
            }
          }
        } catch (chartError) {
          console.error('更新图表失败:', chartError)
        }

        // 确认数据已更新
        console.log('视图数据已更新，当前价格:', formatPrice(analysisData.value?.current_price))
      } catch (apiError: any) {
        console.error('API调用失败:', apiError)

        // 处理各种错误情况
        if (apiError.message && (
          apiError.message.includes('Could not establish connection') ||
          apiError.message.includes('Network Error') ||
          apiError.message.includes('timeout')
        )) {
          error.value = '网络连接错误，请检查您的网络连接并重试'
        } else if (apiError.message && apiError.message.includes('502')) {
          // 处理502 Bad Gateway错误
          console.warn('服务器返回502错误，强制刷新可能需要更多资源，尝试普通请求...')

          // 更新提示文本
          refreshText.value = '强制刷新遇到问题，正在尝试普通请求...'

          // 等待3秒后尝试普通请求
          try {
            await new Promise(resolve => setTimeout(resolve, 3000))

            // 尝试普通请求
            console.log('尝试普通请求获取数据...')
            const regularData = await getTechnicalAnalysis(currentSymbol.value, false)

            if (regularData && regularData.current_price && regularData.trend_analysis) {
              // 更新数据
              analysisData.value = regularData
              console.log('普通请求成功获取数据')

              // 确保视图更新
              await nextTick()

              // 不显示错误
              error.value = null

              // 更新提示文本
              refreshText.value = '数据刷新完成！'

              return
            }
          } catch (retryError) {
            console.error('普通请求也失败:', retryError)
          }

          // 如果重试失败，显示错误信息
          error.value = '服务器暂时无法处理请求，可能正在维护或负载过高，请稍后再试'
        } else if (apiError.message && apiError.message.includes('500')) {
          // 处理500内部服务器错误
          error.value = '服务器内部错误，请稍后再试'
        } else if (apiError.message && apiError.message.includes('504')) {
          // 处理504 Gateway Timeout错误
          error.value = '服务器处理请求超时，请稍后再试'
        } else {
          error.value = apiError.message || '刷新数据失败'
        }

        // 即使出错也要关闭进度弹窗
        if (refreshTimer !== null) {
          clearInterval(refreshTimer)
          refreshTimer = null
        }
        refreshProgress.value = 100

        // 延迟关闭弹窗
        setTimeout(() => {
          showRefreshModal.value = false
        }, 500)

        return
      }
    } else {
      await loadAnalysisData(true)
    }
  } catch (e: any) {
    console.error('强制刷新数据失败:', e)
    error.value = e instanceof Error ? e.message : '刷新数据失败'
  } finally {
    // 完成刷新，平滑过渡到100%
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }

    // 更新提示文本
    refreshText.value = '数据刷新完成！'

    // 从当前进度平滑过渡到100%
    const currentProgress = refreshProgress.value
    const startTransition = Date.now()
    const transitionDuration = 800 // 800毫秒的过渡时间

    const transitionInterval = setInterval(() => {
      const elapsedMs = Date.now() - startTransition
      const transitionProgress = Math.min(1, elapsedMs / transitionDuration)

      // 使用缓动函数使过渡更自然
      const easedProgress = 1 - Math.pow(1 - transitionProgress, 3)
      const newProgress = currentProgress + (100 - currentProgress) * easedProgress

      refreshProgress.value = newProgress

      if (transitionProgress >= 1) {
        clearInterval(transitionInterval)
        refreshProgress.value = 100

        // 延迟关闭弹窗，让用户看到100%的进度
        setTimeout(() => {
          showRefreshModal.value = false
        }, 500)
      }
    }, 16) // 约60fps的更新频率
  }
}

// 普通刷新数据
const refreshData = async () => {
  chartLoading.value = true
  try {
    await loadAnalysisData()
  } finally {
    chartLoading.value = false
  }
}
</script>