import type {
  TechnicalAnalysisResponse,
  TechnicalAnalysisData,
  ForceRefreshResponse,
  ForceRefreshData,
  FormattedTechnicalAnalysisData,
  BaseApiResponse
} from '@/types/technical-analysis'

// 类型守卫：检查是否是基础API响应
function isBaseApiResponse(response: unknown): response is BaseApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof (response as BaseApiResponse).status === 'string'
  )
}

// 类型守卫：检查是否是强制刷新数据
function isForceRefreshData(data: unknown): data is ForceRefreshData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'trend_up_probability' in data &&
    'trend_sideways_probability' in data &&
    'trend_down_probability' in data
  )
}

// 类型守卫：检查是否是技术分析数据
function isTechnicalAnalysisData(data: unknown): data is TechnicalAnalysisData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'trend_analysis' in data &&
    'indicators_analysis' in data &&
    'trading_advice' in data &&
    'risk_assessment' in data
  )
}

/**
 * 格式化技术分析数据
 * @param response 可能是常规分析响应或强制刷新响应，或直接返回的数据
 * @param targetLanguage 目标语言，默认为当前语言
 * @returns 格式化后的数据
 */
export function formatTechnicalAnalysisData(
  response: TechnicalAnalysisData | TechnicalAnalysisResponse | ForceRefreshResponse | ForceRefreshData | unknown,
  targetLanguage?: string
): FormattedTechnicalAnalysisData {
  // 获取当前语言，如果没有指定则使用localStorage中的语言或默认英文
  const currentLanguage = targetLanguage || localStorage.getItem('language') || 'en-US';
  try {
    // 如果响应为空，抛出明确的错误
    if (!response) {
      throw new Error('技术分析数据为空')
    }

    // 处理API响应
    if (isBaseApiResponse(response) && 'data' in response) {
      if (response.status !== 'success') {
        throw new Error(`API响应错误: ${response.status}`)
      }

      if (!response.data) {
        throw new Error('API响应中data为空')
      }

      response = response.data
    }

    // 处理强制刷新数据
    if (isForceRefreshData(response)) {
      try {
        // 创建格式化后的数据对象，添加默认值和类型检查
        const formattedData: FormattedTechnicalAnalysisData = {
          current_price: typeof response.current_price === 'number' ? response.current_price : (typeof response.price === 'number' ? response.price : 0),
          snapshot_price: typeof response.snapshot_price === 'number' ? response.snapshot_price : (typeof response.price === 'number' ? response.price : 0),
          trend_analysis: {
            probabilities: {
              up: typeof response.trend_up_probability === 'number' ? response.trend_up_probability : 0,
              sideways: typeof response.trend_sideways_probability === 'number' ? response.trend_sideways_probability : 0,
              down: typeof response.trend_down_probability === 'number' ? response.trend_down_probability : 0
            },
            summary: typeof response.trend_summary === 'string' ? response.trend_summary : '无数据'
          },
          indicators_analysis: response.indicators_analysis || {},
          trading_advice: {
            action: typeof response.trading_action === 'string' ? response.trading_action : '无建议',
            reason: typeof response.trading_reason === 'string' ? response.trading_reason : '无数据',
            entry_price: typeof response.entry_price === 'number' ? response.entry_price : 0,
            stop_loss: typeof response.stop_loss === 'number' ? response.stop_loss : 0,
            take_profit: typeof response.take_profit === 'number' ? response.take_profit : 0
          },
          risk_assessment: {
            level: typeof response.risk_level === 'string' ? response.risk_level : '中',
            score: typeof response.risk_score === 'number' ? response.risk_score : 50,
            details: Array.isArray(response.risk_details) ? response.risk_details : []
          },
          last_update_time: typeof response.last_update_time === 'string' ? response.last_update_time : new Date().toISOString()
        }

        // 直接返回格式化后的数据
        return formattedData
      } catch (error) {
        throw new Error(`格式化强制刷新数据失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 处理技术分析数据
    if (isTechnicalAnalysisData(response)) {
      try {
        // 创建格式化后的数据对象，添加默认值和类型检查
        const formattedData: FormattedTechnicalAnalysisData = {
          current_price: typeof response.current_price === 'number' ? response.current_price : (typeof response.price === 'number' ? response.price : 0),
          snapshot_price: typeof response.snapshot_price === 'number' ? response.snapshot_price : (typeof response.price === 'number' ? response.price : 0),
          trend_analysis: {
            probabilities: {
              up: typeof response.trend_analysis?.probabilities?.up === 'number' ? response.trend_analysis.probabilities.up : 0,
              sideways: typeof response.trend_analysis?.probabilities?.sideways === 'number' ? response.trend_analysis.probabilities.sideways : 0,
              down: typeof response.trend_analysis?.probabilities?.down === 'number' ? response.trend_analysis.probabilities.down : 0
            },
            summary: typeof response.trend_analysis?.summary === 'string' ? response.trend_analysis.summary : '无数据'
          },
          indicators_analysis: response.indicators_analysis || {},
          trading_advice: {
            action: typeof response.trading_advice?.action === 'string' ? response.trading_advice.action : '无建议',
            reason: typeof response.trading_advice?.reason === 'string' ? response.trading_advice.reason : '无数据',
            entry_price: typeof response.trading_advice?.entry_price === 'number' ? response.trading_advice.entry_price : 0,
            stop_loss: typeof response.trading_advice?.stop_loss === 'number' ? response.trading_advice.stop_loss : 0,
            take_profit: typeof response.trading_advice?.take_profit === 'number' ? response.trading_advice.take_profit : 0
          },
          risk_assessment: {
            level: typeof response.risk_assessment?.level === 'string' ? response.risk_assessment.level : '中',
            score: typeof response.risk_assessment?.score === 'number' ? response.risk_assessment.score : 50,
            details: Array.isArray(response.risk_assessment?.details) ? response.risk_assessment.details : []
          },
          last_update_time: typeof response.last_update_time === 'string' ? response.last_update_time : new Date().toISOString()
        }

        // 直接返回格式化后的数据
        return formattedData
      } catch (error) {
        throw new Error(`格式化技术分析数据失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 如果无法识别数据格式
    throw new Error('无法识别的数据格式')
  } catch (error) {
    // 创建默认的数据结构
    const defaultData = {
      current_price: 0,
      snapshot_price: 0,
      trend_analysis: {
        probabilities: { up: 0.33, sideways: 0.34, down: 0.33 },
        summary: 'Data loading failed, please refresh and try again'
      },
      indicators_analysis: {
        RSI: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        MACD: { value: { line: 0, signal: 0, histogram: 0 }, analysis: 'Data loading failed', support_trend: 'neutral' },
        BollingerBands: { value: { upper: 0, middle: 0, lower: 0 }, analysis: 'Data loading failed', support_trend: 'neutral' },
        BIAS: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        PSY: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        DMI: { value: { plus_di: 0, minus_di: 0, adx: 0 }, analysis: 'Data loading failed', support_trend: 'neutral' },
        VWAP: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        FundingRate: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        ExchangeNetflow: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        NUPL: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' },
        MayerMultiple: { value: 0, analysis: 'Data loading failed', support_trend: 'neutral' }
      },
      trading_advice: {
        action: 'No advice',
        reason: 'Data loading failed',
        entry_price: 0,
        stop_loss: 0,
        take_profit: 0
      },
      risk_assessment: {
        level: 'medium',
        score: 50,
        details: ['Data loading failed, unable to assess risk']
      },
      last_update_time: new Date().toISOString()
    };

    // 直接返回默认数据
    return defaultData
  }
}
