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
              :disabled="showRefreshModal"
              :class="{ 'opacity-50 cursor-not-allowed': showRefreshModal }"
            >
              <i class="ri-refresh-line ri-lg" :class="{ 'animate-spin': showRefreshModal }"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="absolute inset-0 top-12 bottom-16 overflow-y-auto">


      <!-- 整体加载状态 - 只在初始加载时显示 -->
      <div v-if="loading && !analysisData" class="max-w-[375px] mx-auto px-4 pb-16">
        <!-- 价格展示卡片骨架屏 -->
        <div class="mt-6 p-5 rounded-lg bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 shadow-lg animate-pulse">
          <div class="h-5 w-32 bg-gray-700/50 rounded mx-auto mb-2"></div>
          <div class="h-8 w-40 bg-gray-700/50 rounded mx-auto mb-4"></div>

          <div class="flex justify-center gap-3 mt-4 mb-2">
            <div class="h-8 w-24 bg-gray-800/70 rounded-full"></div>
            <div class="h-8 w-24 bg-gray-800/70 rounded-full"></div>
          </div>
        </div>

        <!-- 趋势分析骨架屏 -->
        <div class="mt-6 grid grid-cols-3 gap-3">
          <div class="p-3 rounded-lg bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 animate-pulse">
            <div class="h-6 w-16 bg-green-500/20 rounded mx-auto mb-1"></div>
            <div class="h-4 w-12 bg-green-500/20 rounded mx-auto"></div>
          </div>

          <div class="p-3 rounded-lg bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30 animate-pulse">
            <div class="h-6 w-16 bg-gray-600/20 rounded mx-auto mb-1"></div>
            <div class="h-4 w-12 bg-gray-600/20 rounded mx-auto"></div>
          </div>

          <div class="p-3 rounded-lg bg-[rgba(239,68,68,0.12)] border border-red-500/30 animate-pulse">
            <div class="h-6 w-16 bg-red-500/20 rounded mx-auto mb-1"></div>
            <div class="h-4 w-12 bg-red-500/20 rounded mx-auto"></div>
          </div>
        </div>

        <!-- 市场趋势分析骨架屏 -->
        <div class="mt-6">
          <div class="h-6 w-32 bg-gray-700/50 rounded mb-3"></div>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <div class="h-4 w-full bg-gray-700/50 rounded mb-2"></div>
            <div class="h-4 w-3/4 bg-gray-700/50 rounded"></div>
          </div>
        </div>

        <!-- 技术指标骨架屏 -->
        <div class="mt-6">
          <div class="h-6 w-32 bg-gray-700/50 rounded mb-3"></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="h-4 w-16 bg-gray-700/50 rounded mb-2"></div>
              <div class="h-6 w-full bg-gray-700/50 rounded"></div>
            </div>
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div class="h-4 w-16 bg-gray-700/50 rounded mb-2"></div>
              <div class="h-6 w-full bg-gray-700/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 代币未找到状态 -->
      <div v-else-if="isTokenNotFound" class="flex items-center justify-center h-full">
        <TokenNotFoundView
          :symbol="currentSymbol"
          @refresh="forceRefreshData"
          :is-refreshing="showRefreshModal"
        />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center h-full">
        <div class="text-center px-4">
          <i class="ri-error-warning-line text-4xl text-red-500 mb-2"></i>
          <p class="text-gray-300 mb-2">{{ error }}</p>
          <p class="text-gray-400 text-sm mb-4">请尝试重新加载或稍后再试</p>
          <div class="flex space-x-3 justify-center">
            <button
              class="px-4 py-2 bg-primary text-white rounded-lg"
              @click="refreshData"
            >
              重试
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg"
              @click="forceRefreshData"
            >
              强制刷新
            </button>
          </div>
        </div>
      </div>

      <!-- 正常内容 - 只要分析数据加载完成就显示 -->
      <div v-else-if="analysisData" class="max-w-[375px] mx-auto px-4 pb-16">
        <!-- 价格展示卡片 -->
        <div class="mt-6 p-5 rounded-lg bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 shadow-lg">
          <h2 class="text-center text-gray-400 mb-1">当前价格</h2>
          <div class="text-center text-3xl font-bold mb-2">
            {{ formatPrice(realtimePrice || analysisData.current_price) }}
            <span class="text-sm text-gray-400">USD</span>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-center gap-3 mt-4 mb-2">
            <button
              class="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-full transition flex items-center gap-1"
              @click="shareToTwitter"
            >
              <i class="ri-twitter-fill"></i>
              <span class="text-sm">分享到推特</span>
            </button>
            <button
              class="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-full transition flex items-center gap-1"
              @click="saveChartImage"
            >
              <i class="ri-image-line"></i>
              <span class="text-sm">保存图片</span>
            </button>
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

          <div class="p-3 rounded-lg bg-[rgba(239,68,68,0.12)] border border-red-500/30 text-center">
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
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  RSI (14)
                  <el-tooltip :content="indicatorExplanations.RSI" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.RSI.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.RSI.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.RSI.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.RSI.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- BIAS -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  BIAS
                  <el-tooltip :content="indicatorExplanations.BIAS" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.BIAS.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.BIAS.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.BIAS.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.BIAS.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- PSY -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  PSY
                  <el-tooltip :content="indicatorExplanations.PSY" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.PSY.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.PSY.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.PSY.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.PSY.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- VWAP -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  VWAP
                  <el-tooltip :content="indicatorExplanations.VWAP" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.VWAP.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.VWAP.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.VWAP.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.VWAP.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- Funding Rate -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Funding Rate
                  <el-tooltip :content="indicatorExplanations.FundingRate" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ (analysisData.indicators_analysis.FundingRate.value * 100).toFixed(4) }}%</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.FundingRate.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.FundingRate.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.FundingRate.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- Exchange Netflow -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Exchange Netflow
                  <el-tooltip :content="indicatorExplanations.ExchangeNetflow" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.ExchangeNetflow.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.ExchangeNetflow.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.ExchangeNetflow.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.ExchangeNetflow.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- NUPL -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  NUPL
                  <el-tooltip :content="indicatorExplanations.NUPL" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.NUPL.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.NUPL.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.NUPL.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.NUPL.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- Mayer Multiple -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Mayer Multiple
                  <el-tooltip :content="indicatorExplanations.MayerMultiple" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.MayerMultiple.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.MayerMultiple.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.MayerMultiple.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.MayerMultiple.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>
            </div>

            <!-- MACD (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400 flex items-center gap-1">
                  MACD
                  <el-tooltip :content="indicatorExplanations.MACD" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.MACD.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.MACD.support_trend)}`">
                  <i :class="getTrendIconClass(analysisData.indicators_analysis.MACD.support_trend)" class="text-base"></i>
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">Histogram</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.histogram.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">MACD Line</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.line.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">Signal Line</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.signal.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- Bollinger Bands (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400 flex items-center gap-1">
                  Bollinger Bands
                  <el-tooltip :content="indicatorExplanations.BollingerBands" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.BollingerBands.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.BollingerBands.support_trend)}`">
                  <i :class="getTrendIconClass(analysisData.indicators_analysis.BollingerBands.support_trend)" class="text-base"></i>
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-red-900/20 border border-red-800/30">
                  <div class="text-xs text-gray-400">Upper Band</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.upper.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-gray-700/30 border border-gray-600/30">
                  <div class="text-xs text-gray-400">Middle Band</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.middle.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-green-900/20 border border-green-800/30">
                  <div class="text-xs text-gray-400">Lower Band</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.lower.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- DMI (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400 flex items-center gap-1">
                  DMI
                  <el-tooltip :content="indicatorExplanations.DMI" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.DMI.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.DMI.support_trend)}`">
                  <i :class="getTrendIconClass(analysisData.indicators_analysis.DMI.support_trend)" class="text-base"></i>
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
import { onMounted, ref, nextTick, watch } from 'vue'
import html2canvas from 'html2canvas'
// @ts-ignore
// eslint-disable-next-line
declare module 'qrcode';
import QRCode from 'qrcode'
import { ElTooltip, ElMessage } from 'element-plus'

import { getTechnicalAnalysis } from '@/api'
import { parseSymbolFromUrl } from '@/utils/trading'
import type {
  FormattedTechnicalAnalysisData
} from '@/types/technical-analysis'
import { formatTechnicalAnalysisData } from '@/utils/data-formatter'
import TokenNotFoundView from '@/components/TokenNotFoundView.vue'

// 是否为开发环境的标志（用于内部功能）
const isDevelopment = false

const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.getURL === 'function';
}

const analysisData = ref<FormattedTechnicalAnalysisData | null>(null)
const loading = ref(false) // 整体加载状态
const analysisLoading = ref(false) // 分析数据加载状态
const error = ref<string | null>(null)
const currentSymbol = ref<string>('')
const retryCount = ref(0)
const isTokenNotFound = ref(false) // 用于标记代币是否未找到（404错误）
const realtimePrice = ref<number | null>(null)

const showRefreshModal = ref(false)
const refreshProgress = ref(0)
const refreshText = ref('正在刷新数据...')

let refreshTimer: ReturnType<typeof setInterval> | null = null

// 指标英文名与说明映射
const indicatorExplanations: Record<string, string> = {
  RSI: '相对强弱指数（RSI），用于衡量价格动量和超买超卖状态。',
  BIAS: '乖离率，衡量价格偏离均线的程度。',
  PSY: '心理线指标，反映市场参与者的心理变化。',
  VWAP: '成交量加权平均价，反映市场真实交易价值。',
  FundingRate: '资金费率，反映合约市场多空力量对比。',
  ExchangeNetflow: '交易所净流入，反映资金流向。',
  NUPL: '未实现净盈亏比率，反映市场整体盈亏状况。',
  MayerMultiple: '梅耶倍数，当前价格与200日均线的比值。',
  MACD: '移动平均线收敛散度，用于判断趋势强弱和转折点。',
  BollingerBands: '布林带，用于衡量价格波动性和支撑阻力位。',
  DMI: '动向指标，用于判断趋势方向和强度。'
}

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
    // 重置所有状态
    loading.value = true
    error.value = null
    analysisLoading.value = true

    // 确保在开始加载前清除任何现有数据
    if (!forceRefresh) {
      analysisData.value = null
    }

    let symbol: string | null = null;
    let url: string = '';

    if (isExtensionEnvironment()) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]

        if (!tab.url) {
          console.error('无法获取当前页面URL')
          error.value = '无法获取当前页面URL'
          loading.value = false
          return
        }

        url = tab.url

        symbol = parseSymbolFromUrl(url)
      } catch (e) {
        console.error('获取标签页信息失败:', e)
        error.value = '无法访问当前标签页，请确保已授予必要权限'
        loading.value = false
        return
      }
    } else {
      url = window.location.href
      symbol = parseSymbolFromUrl(url)
    }

    if (!symbol) {
      symbol = 'BTC' // 默认使用BTC
      // 避免不必要的错误提示，移除错误信息
      error.value = null
    }

    currentSymbol.value = symbol

    try {
      // 优先加载分析数据
      try {
        // 获取技术分析数据
        const response = await getTechnicalAnalysis(symbol, forceRefresh)

        // 处理特殊的"not_found"状态
        if (typeof response === 'object' && response !== null) {
          // 检查是否是API特殊响应格式 {"status": "not_found", "needs_refresh": true}
          if ('status' in response && (response as any).status === 'not_found') {
            isTokenNotFound.value = true
            loading.value = false
            analysisLoading.value = false
            return
          }

          // 确保数据格式化，填充可能缺失的字段
          const formattedData = formatTechnicalAnalysisData(response)

          // 更新分析数据
          analysisData.value = formattedData



          // 重置重试计数
          retryCount.value = 0
          // 重置错误和未找到状态
          error.value = null
          isTokenNotFound.value = false
        } else {
          console.error('API返回格式错误:', response)
          error.value = '服务器返回数据格式错误'
        }
      } catch (apiError: any) {
        console.error('API请求错误:', apiError)

        // 获取详细错误信息
        let errorMsg = '请求失败';
        if (apiError.message) {
          errorMsg = apiError.message;
        }

        // 网络错误处理
        if (apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network Error')) {
          errorMsg = '网络连接错误，请检查网络连接后重试';
        }
        // 超时错误
        else if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
          errorMsg = '请求超时，服务器响应时间过长';
        }
        // 服务器错误
        else if (apiError.response?.status >= 500) {
          console.log('服务器500错误，可能是代币未找到，显示TokenNotFoundView')
          isTokenNotFound.value = true
          error.value = null
          loading.value = false
          analysisLoading.value = false
          return
        }

        // 检查错误响应中是否包含not_found信息
        if (apiError.response?.data && typeof apiError.response.data === 'object') {
          const errorData = apiError.response.data;
          if (errorData.status === 'not_found') {
            console.log('错误响应中发现交易对未找到状态')
            isTokenNotFound.value = true
            error.value = null
            loading.value = false
            analysisLoading.value = false
            return;
          }
        }

        // 处理404错误(代币未找到)，这也可能意味着数据库中没有该代币
        if (apiError.response?.status === 404) {
          console.log('检测到404错误，认为是交易对未找到')
          isTokenNotFound.value = true
          error.value = null // 清除错误，显示特殊的未找到视图
          return
        } else {
          isTokenNotFound.value = false
          error.value = errorMsg;
          console.error('设置错误信息:', error.value)
        }
      }

    } catch (apiError: any) {
      console.error('API请求错误:', apiError)
      error.value = apiError.message || '加载分析数据失败'
    }

  } catch (e) {
    console.error('整体加载过程错误:', e)
    if (!error.value && !isTokenNotFound.value) {
      error.value = e instanceof Error ? e.message : '加载数据失败'
    }
  } finally {
    // 整体加载状态结束
    loading.value = false
    analysisLoading.value = false


  }
}

// 组件挂载时加载数据
onMounted(async () => {
  // 确保DOM已完全渲染
  await nextTick()

  // 延迟一点时间确保DOM已完全渲染
  setTimeout(async () => {
    try {
      await loadAnalysisData()
    } catch (e) {
      // 确保错误状态被正确设置
      error.value = e instanceof Error ? e.message : '加载数据失败'
      loading.value = false
    }
  }, 500)
})

// 监听交易对变化，更新数据
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


// 获取指标趋势样式
const getIndicatorClass = (trend?: string) => {
  if (!trend) return 'text-gray-400'
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') return 'text-green-400'
  if (trend === 'bearish' || trend === '看跌' || trend === '不支持当前趋势') return 'text-red-400'
  if (trend === 'neutral' || trend === '中性') return 'text-yellow-400'
  return 'text-gray-400'
}

// 获取指标趋势图标类名
const getTrendIconClass = (trend?: string) => {
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') {
    return 'ri-arrow-up-line';
  }
  if (trend === 'bearish' || trend === '看跌' || trend === '反对当前趋势') {
    return 'ri-arrow-down-line';
  }
  return 'ri-subtract-line';
}

// 趋势图标渲染函数已移至其他地方使用

// 保存图片时的趋势图标渲染（与页面一致，Remix Icon + 圆形底色，垂直居中，微调）
const getIndicatorIconForImage = (trend?: string) => {
  const baseStyle = "display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;";
  const iconStyle = "font-size:14px;line-height:1;height:14px;vertical-align:middle;display:block;margin-top:-14px;";
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') {
    return `<span style="${baseStyle}background:rgba(16,185,129,0.12);">
      <i class='ri-arrow-up-line' style='${iconStyle}color:#22c55e;'></i>
    </span>`;
  }
  if (trend === 'bearish' || trend === '看跌' || trend === '反对当前趋势') {
    return `<span style="${baseStyle}background:rgba(239,68,68,0.12);">
      <i class='ri-arrow-down-line' style='${iconStyle}color:#ef4444;'></i>
    </span>`;
  }
  // 中性
  return `<span style="${baseStyle}background:rgba(156,163,175,0.12);">
    <i class='ri-subtract-line' style='${iconStyle}color:#9ca3af;'></i>
  </span>`;
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
    // 检查模态框是否仍然显示
    if (!showRefreshModal.value) {
      // 如果模态框已关闭，清除定时器
      if (refreshTimer !== null) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
      return
    }

    const elapsedMs = Date.now() - startTime

    // 计算当前应该显示的进度
    const newProgress = Math.min(95, getProgressForTime(elapsedMs))

    // 安全地更新进度值
    if (refreshProgress && typeof refreshProgress.value !== 'undefined') {
      refreshProgress.value = newProgress
    }

    // 根据进度更新提示文本
    if (newProgress < 30) {
      refreshText.value = '正在获取市场数据并进行技术指标计算...'
    } else if (newProgress < 60) {
      refreshText.value = '正在进行趋势分析和概率评估...'
    } else if (newProgress < 85) {
      refreshText.value = '正在生成交易建议和风险评估...'
    } else {
      refreshText.value = '最终数据整合中，即将完成...'
    }

    // 达到95%后停止，等待实际请求完成
    if (newProgress >= 95) {
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
    // 如果已经在刷新中，则不执行
    if (showRefreshModal.value) {
      return
    }

    // 开始模拟进度
    simulateRefreshProgress()

    // 检查是否有当前交易对
    if (!currentSymbol.value) {
      error.value = '无法获取当前交易对信息'
      return
    }

    try {
      // 更新提示文本
      refreshText.value = '正在从币安获取最新市场数据...'

      try {
        // 重置所有状态，但保留现有数据直到新数据加载完成
        error.value = null
        isTokenNotFound.value = false
        analysisLoading.value = true

        // 优先加载分析数据 - 强制刷新
        const refreshResponse = await getTechnicalAnalysis(currentSymbol.value, true)
        // 强制刷新后再请求一次普通数据，确保获取最新数据
        await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
        const latestResponse = await getTechnicalAnalysis(currentSymbol.value, false)

        // 使用最新的数据（如果有）
        const dataToFormat = latestResponse || refreshResponse

        // 确保数据格式化，填充可能缺失的字段
        const formattedData = formatTechnicalAnalysisData(dataToFormat)

        // 更新分析数据
        analysisData.value = formattedData



        // 重置代币未找到状态
        isTokenNotFound.value = false

        // 标记分析数据加载完成
        analysisLoading.value = false

        // 确保视图更新
        await nextTick()

        // 完成刷新 - 平滑过渡到100%
        refreshText.value = '数据刷新完成！'

        // 从当前进度平滑过渡到100%
        const currentProgress = refreshProgress.value
        const startTransition = Date.now()
        const transitionDuration = 500 // 500毫秒的过渡时间

        const transitionInterval = setInterval(() => {
          const elapsedMs = Date.now() - startTransition
          const transitionProgress = Math.min(1, elapsedMs / transitionDuration)

          // 使用缓动函数使过渡更自然
          const easedProgress = 1 - Math.pow(1 - transitionProgress, 2)
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

      } catch (refreshError: any) {
        // 更新提示文本
        refreshText.value = '强制刷新失败，正在尝试获取缓存数据...'

        // 强制刷新失败处理

        // 检查是否是服务器错误（404或500）
        if (refreshError.response?.status === 404 || refreshError.response?.status >= 500) {

          isTokenNotFound.value = true;

          // 关闭进度弹窗
          setTimeout(() => {
            showRefreshModal.value = false;
          }, 1000);

          return;
        }

        // 处理响应中包含的详细错误信息
        // 错误信息已在UI中显示，不需要额外处理

        // 检查是否仍是未找到状态
        if (
          refreshError.response?.data?.status === 'not_found' ||
          (typeof refreshError.response?.data === 'object' &&
           refreshError.response?.data !== null &&
           'status' in refreshError.response.data &&
           refreshError.response.data.status === 'not_found')
        ) {

          isTokenNotFound.value = true;
        }
      }
    } catch (err: any) {
      console.error('数据刷新失败:', err)

      // 显示错误信息
      if (err.message?.includes('Network Error') || err.message?.includes('timeout')) {
        error.value = '网络连接错误，请检查您的网络连接并重试'
      } else {
        error.value = err.message || '刷新数据失败'
      }

      // 关闭进度弹窗 - 平滑过渡到100%
      refreshText.value = '加载失败，请稍后重试'

      // 从当前进度平滑过渡到100%
      const currentProgress = refreshProgress.value
      const startTransition = Date.now()
      const transitionDuration = 500 // 500毫秒的过渡时间

      const transitionInterval = setInterval(() => {
        const elapsedMs = Date.now() - startTransition
        const transitionProgress = Math.min(1, elapsedMs / transitionDuration)

        // 使用缓动函数使过渡更自然
        const easedProgress = 1 - Math.pow(1 - transitionProgress, 2)
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
  } catch (e) {
    console.error('强制刷新数据失败:', e)
    error.value = e instanceof Error ? e.message : '刷新数据失败'
  } finally {
    // 确保定时器被清除
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

// 普通刷新数据
const refreshData = async () => {
  error.value = null // 清除之前的错误
  isTokenNotFound.value = false // 重置代币未找到状态
  analysisLoading.value = true

  try {
    // 尝试使用普通请求获取数据
    const response = await getTechnicalAnalysis(currentSymbol.value, false)
    console.log('普通刷新数据返回:', response)

    // 检查响应状态，处理新的响应格式
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const apiResponse = response as any;
      if (apiResponse.status === 'not_found' && apiResponse.needs_refresh === true) {
        isTokenNotFound.value = true
        analysisLoading.value = false
        return
      }
    }

    // 确保数据格式化，填充可能缺失的字段
    const formattedData = formatTechnicalAnalysisData(response)

    // 更新数据
    analysisData.value = formattedData

    // 打印检查数据完整性
    console.log('普通刷新后，格式化数据是否包含市场趋势分析:', !!formattedData.trend_analysis)
    console.log('普通刷新后，格式化数据是否包含交易建议:', !!formattedData.trading_advice)
    console.log('普通刷新后，格式化数据是否包含风险评估:', !!formattedData.risk_assessment)

    // 标记分析数据加载完成
    analysisLoading.value = false

    // 确保视图更新
    await nextTick()

  } catch (err: any) {
    // 重置加载状态
    analysisLoading.value = false

    // 检查是否是404错误（代币未找到）
    if (err.response?.status === 404) {
      isTokenNotFound.value = true
      error.value = null // 清除一般错误，使用特殊的未找到视图
    } else {
      error.value = err.message || '刷新数据失败'
    }
  }
}

// 分享到推特
const shareToTwitter = () => {
  try {
    // 构建分享文本
    const symbol = currentSymbol.value || 'CRYPTO'
    const price = formatPrice(analysisData.value?.current_price || 0)

    // 获取概率值并确保它们是有效的百分比
    let upProb = analysisData.value?.trend_analysis?.probabilities?.up
    let downProb = analysisData.value?.trend_analysis?.probabilities?.down

    // 检查概率值是否有效，如果无效则使用默认值
    upProb = typeof upProb === 'number' && upProb >= 0 && upProb <= 1 ? upProb : 0.33
    downProb = typeof downProb === 'number' && downProb >= 0 && downProb <= 1 ? downProb : 0.33



    // 获取趋势分析摘要
    const trendSummary = analysisData.value?.trend_analysis?.summary || '无趋势分析'

    // 获取交易建议
    const tradingAction = analysisData.value?.trading_advice?.action || '无交易建议'
    const tradingReason = analysisData.value?.trading_advice?.reason || ''
    const entryPrice = formatPrice(analysisData.value?.trading_advice?.entry_price)
    const stopLoss = formatPrice(analysisData.value?.trading_advice?.stop_loss)
    const takeProfit = formatPrice(analysisData.value?.trading_advice?.take_profit)

    // 获取风险评估
    const riskLevel = analysisData.value?.risk_assessment?.level || '中'
    const riskScore = analysisData.value?.risk_assessment?.score || 50
    const riskDetails = analysisData.value?.risk_assessment?.details || []

    // 构建分享文本
    let shareText = `${symbol}市场分析报告 - 当前价格: ${price} USD

本报告来源 - K线军师

市场趋势分析:
${trendSummary.substring(0, 100)}${trendSummary.length > 100 ? '...' : ''}

交易建议:
操作: ${tradingAction}
入场价: ${entryPrice}
止损价: ${stopLoss}
目标价: ${takeProfit}
原因: ${tradingReason.substring(0, 80)}${tradingReason.length > 80 ? '...' : ''}

风险评估:
风险等级: ${riskLevel}
风险评分: ${riskScore}/100
${riskDetails.length > 0 ? '主要风险因素:\n' + riskDetails.slice(0, 2).map(detail => `- ${detail}`).join('\n') : ''}

#加密货币 #技术分析 #交易建议`

    // 检查字符长度，如果超过270个字符，则进行裁剪
    if (shareText.length > 270) {
      console.log('分享文本过长，进行裁剪。原长度:', shareText.length)

      // 简化版本，保留核心信息
      shareText = `${symbol}市场分析报告 - 当前价格: ${price} USD

市场趋势:
${trendSummary.substring(0, 50)}${trendSummary.length > 50 ? '...' : ''}

交易建议:
操作: ${tradingAction}
入场价: ${entryPrice}
止损价: ${stopLoss}
目标价: ${takeProfit}

风险评估:
风险等级: ${riskLevel}
风险评分: ${riskScore}/100

#加密货币 #技术分析 #交易建议`
    }

    // 构建Twitter分享URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

    // 在新窗口中打开Twitter分享页面
    window.open(twitterUrl, '_blank')
  } catch (error) {
    // 分享失败处理
  }
}

// 保存图表为图片
const saveChartImage = async () => {
  try {
    // 创建一个容器用于生成图片
    const container = document.createElement('div')
    container.style.width = '375px'
    container.style.padding = '20px'
    container.style.backgroundColor = '#0F172A'
    container.style.color = '#fff'
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.zIndex = '-1'

    // 标题和当前价格卡片
    const titleSection = document.createElement('div')
    titleSection.style.textAlign = 'center'
    titleSection.style.marginBottom = '20px'
    titleSection.style.padding = '20px 0 10px 0'
    titleSection.style.background = 'linear-gradient(to bottom, #1e293b99 60%, #0f172a99 100%)'
    titleSection.style.borderRadius = '16px'
    titleSection.style.boxShadow = '0 2px 8px 0 #0002'
    titleSection.innerHTML = `
      <h2 style="font-size: 22px; margin-bottom: 10px; font-weight: 600; letter-spacing: 1px;">${currentSymbol.value} Market Analysis</h2>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;">
        ${formatPrice(analysisData.value?.current_price)} <span style='font-size:16px;color:#9ca3af'>USD</span>
      </div>
    `
    container.appendChild(titleSection)

    // 市场趋势分析卡片
    if (analysisData.value?.trend_analysis?.summary) {
      const trendSection = document.createElement('div')
      trendSection.style.margin = '20px 0 0 0'
      trendSection.style.padding = '16px'
      trendSection.style.background = 'rgba(31,41,55,0.3)'
      trendSection.style.border = '1px solid #374151'
      trendSection.style.borderRadius = '12px'
      trendSection.style.boxShadow = '0 1px 4px 0 #0001'
      trendSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Market Trend Analysis</div>
        <div style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin-bottom: 12px;">${analysisData.value.trend_analysis.summary}</div>
        <div style="display: flex; justify-content: center; gap: 8px;">
          <div style="flex:1; text-align:center; background:rgba(16,185,129,0.12); border-radius:8px; padding:8px 0; border:1px solid #10b98133;">
            <div style="color:#4ade80; font-size:18px; font-weight:600;">${formatPercent(analysisData.value.trend_analysis.probabilities.up)}</div>
            <div style="color:#4ade80; font-size:12px;">Up</div>
          </div>
          <div style="flex:1; text-align:center; background:rgba(156,163,175,0.12); border-radius:8px; padding:8px 0; border:1px solid #9ca3af33;">
            <div style="color:#9ca3af; font-size:18px; font-weight:600;">${formatPercent(analysisData.value.trend_analysis.probabilities.sideways)}</div>
            <div style="color:#9ca3af; font-size:12px;">Sideways</div>
          </div>
          <div style="flex:1; text-align:center; background:rgba(239,68,68,0.12); border-radius:8px; padding:8px 0; border:1px solid #ef444433;">
            <div style="color:#ef4444; font-size:18px; font-weight:600;">${formatPercent(analysisData.value.trend_analysis.probabilities.down)}</div>
            <div style="color:#ef4444; font-size:12px;">Down</div>
          </div>
        </div>
      `
      container.appendChild(trendSection)
    }

    // 技术指标卡片
    if (analysisData.value?.indicators_analysis) {
      const indicatorsSection = document.createElement('div')
      indicatorsSection.style.margin = '20px 0 0 0'
      indicatorsSection.style.padding = '16px'
      indicatorsSection.style.background = 'rgba(31,41,55,0.3)'
      indicatorsSection.style.border = '1px solid #374151'
      indicatorsSection.style.borderRadius = '12px'
      indicatorsSection.style.boxShadow = '0 1px 4px 0 #0001'
      indicatorsSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">Technical Indicators</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${Object.entries(analysisData.value.indicators_analysis)
            .filter(([key]) => !['MACD', 'BollingerBands', 'DMI'].includes(key))
            .map(([key, indicator]) => `
              <div style="padding: 10px; background: rgba(17,24,39,0.5); border: 1px solid #334155; border-radius: 8px;">
                <div style="font-size: 12px; color: #9ca3af; margin-bottom: 5px;">${key}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px;">${typeof indicator.value === 'number' ? indicator.value.toFixed(2) : indicator.value}</span>
                  <span style="font-size: 12px;">${getIndicatorIconForImage(indicator.support_trend)}</span>
                </div>
              </div>
            `).join('')}
        </div>
      `
      container.appendChild(indicatorsSection)
    }

    // 交易建议卡片 - 确保始终创建并保留该部分
    if (analysisData.value?.trading_advice) {
      const advice = analysisData.value.trading_advice
      const adviceSection = document.createElement('div')
      adviceSection.style.margin = '20px 0 0 0'
      adviceSection.style.padding = '16px'
      adviceSection.style.background = 'rgba(31,41,55,0.3)'
      adviceSection.style.border = '1px solid #374151'
      adviceSection.style.borderRadius = '12px'
      adviceSection.style.boxShadow = '0 1px 4px 0 #0001'
      adviceSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">Trading Advice</div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
          <div><span style='color:#9ca3af'>Action:</span> <span style='font-weight:500;'>${advice.action}</span></div>
          <div><span style='color:#9ca3af'>Entry Price:</span> ${formatPrice(advice.entry_price)}</div>
          <div><span style='color:#9ca3af'>Stop Loss:</span> <span style='color:#ef4444'>${formatPrice(advice.stop_loss)}</span></div>
          <div><span style='color:#9ca3af'>Take Profit:</span> <span style='color:#4ade80'>${formatPrice(advice.take_profit)}</span></div>
          <div><span style='color:#9ca3af'>Reason:</span> ${advice.reason}</div>
        </div>
      `
      container.appendChild(adviceSection)
    }

    // 风险评估卡片 - 确保始终创建并保留该部分
    if (analysisData.value?.risk_assessment) {
      const risk = analysisData.value.risk_assessment
      const riskSection = document.createElement('div')
      riskSection.style.margin = '20px 0 0 0'
      riskSection.style.padding = '16px'
      riskSection.style.background = 'rgba(31,41,55,0.3)'
      riskSection.style.border = '1px solid #374151'
      riskSection.style.borderRadius = '12px'
      riskSection.style.boxShadow = '0 1px 4px 0 #0001'
      riskSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">Risk Assessment</div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
          <div><span style='color:#9ca3af'>Level:</span> <span style='font-weight:500;'>${risk.level}</span></div>
          <div><span style='color:#9ca3af'>Score:</span> ${risk.score}/100</div>
          ${risk.details && risk.details.length > 0 ? `<div><span style='color:#9ca3af'>Factors:</span><ul style='margin:0 0 0 18px;padding:0;color:#d1d5db;'>${risk.details.map((d:any) => `<li>${d}</li>`).join('')}</ul></div>` : ''}
        </div>
      `
      container.appendChild(riskSection)
    }

    // 二维码卡片（居中+描述+网址）
    const qrDiv = document.createElement('div')
    qrDiv.style.textAlign = 'center'
    qrDiv.style.margin = '32px 0 0 0'
    qrDiv.style.padding = '16px 0 0 0'
    qrDiv.style.display = 'flex'
    qrDiv.style.flexDirection = 'column'
    qrDiv.style.alignItems = 'center'

    qrDiv.innerHTML = `
      <div style="margin-bottom: 8px; font-size: 15px; color: #38bdf8; font-weight: 600;">K线军师</div>
      <div style="margin-bottom: 10px; font-size: 13px; color: #9ca3af; max-width: 320px;">
        智能加密行情分析与交易决策平台，助你高效洞察市场趋势，科学制定交易策略。
      </div>
    `
    const qrCanvas = document.createElement('canvas')
    qrDiv.appendChild(qrCanvas)
    const urlDiv = document.createElement('div')
    urlDiv.style.marginTop = '10px'
    urlDiv.style.fontSize = '14px'
    urlDiv.style.color = '#60a5fa'
    urlDiv.style.fontWeight = 'bold'
    urlDiv.innerText = 'https://www.kxianjunshi.com'
    qrDiv.appendChild(urlDiv)
    container.appendChild(qrDiv)

    // 1. 先插入到页面
    document.body.appendChild(container)

    // 2. 生成二维码
    await QRCode.toCanvas(qrCanvas, 'https://www.kxianjunshi.com', { width: 100, margin: 1 })

    // 3. 生成图片
    const canvas = await html2canvas(container, {
      backgroundColor: '#0F172A',
      scale: 2,
      logging: false,
      width: 375,
      height: container.offsetHeight,
      onclone: function(clonedDoc) {
        // 确保克隆文档中的所有内容都已完全渲染
        const clonedContainer = clonedDoc.body.querySelector('div')
        if (clonedContainer) {
          // 强制计算样式和布局
          window.getComputedStyle(clonedContainer).getPropertyValue('height')
        }
      }
    })

    // 4. 移除临时节点
    document.body.removeChild(container)

    // 5. 下载图片
    const link = document.createElement('a')
    link.download = `${currentSymbol.value}_market_analysis.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('保存图片失败:', error)
    // 显示错误提示
    ElMessage({
      message: '保存图片失败，请重试',
      type: 'error'
    })
  }
}

// 获取图标背景色
const getIndicatorBgColor = (trend?: string) => {
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') {
    return 'rgba(16,185,129,0.12)';
  }
  if (trend === 'bearish' || trend === '看跌' || trend === '反对当前趋势') {
    return 'rgba(239,68,68,0.12)';
  }
  return 'rgba(156,163,175,0.12)'; // 中性
}

</script>

<style scoped>
/* 淡入淡出过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>