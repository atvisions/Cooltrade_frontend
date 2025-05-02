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
 * @returns 格式化后的数据
 */
export function formatTechnicalAnalysisData(
  response: TechnicalAnalysisData | TechnicalAnalysisResponse | ForceRefreshResponse | ForceRefreshData | unknown
): FormattedTechnicalAnalysisData {
  try {
    console.log('开始格式化技术分析数据，原始数据类型:', typeof response)

    // 如果响应为空，抛出明确的错误
    if (!response) {
      console.error('技术分析数据为空')
      throw new Error('技术分析数据为空')
    }

    // 打印响应的关键属性，帮助调试
    if (typeof response === 'object' && response !== null) {
      console.log('响应对象的键:', Object.keys(response))

      // 检查是否有status属性
      if ('status' in response) {
        console.log('响应状态:', (response as any).status)
      }

      // 检查是否有data属性
      if ('data' in response) {
        console.log('响应包含data属性，data类型:', typeof (response as any).data)
        if ((response as any).data) {
          console.log('data对象的键:', Object.keys((response as any).data))
        }
      }
    }

    // 处理API响应
    if (isBaseApiResponse(response) && 'data' in response) {
      console.log('检测到API响应格式')
      if (response.status !== 'success') {
        console.error('API响应状态不是success:', response.status)
        throw new Error(`API响应错误: ${response.status}`)
      }

      if (!response.data) {
        console.error('API响应中data为空')
        throw new Error('API响应中data为空')
      }

      response = response.data
      console.log('提取data后的对象类型:', typeof response)
    }

    // 处理强制刷新数据
    if (isForceRefreshData(response)) {
      console.log('检测到强制刷新数据格式')
      try {
        // 创建格式化后的数据对象，添加默认值和类型检查
        const formattedData: FormattedTechnicalAnalysisData = {
          current_price: typeof response.current_price === 'number' ? response.current_price : 0,
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

        console.log('强制刷新数据格式化成功')
        return formattedData
      } catch (error) {
        console.error('格式化强制刷新数据时出错:', error)
        throw new Error(`格式化强制刷新数据失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 处理技术分析数据
    if (isTechnicalAnalysisData(response)) {
      console.log('检测到技术分析数据格式')
      try {
        // 创建格式化后的数据对象，添加默认值和类型检查
        const formattedData: FormattedTechnicalAnalysisData = {
          current_price: typeof response.current_price === 'number' ? response.current_price : 0,
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

        console.log('技术分析数据格式化成功')
        return formattedData
      } catch (error) {
        console.error('格式化技术分析数据时出错:', error)
        throw new Error(`格式化技术分析数据失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 如果无法识别数据格式，尝试提供更详细的错误信息
    console.error('无法识别的数据格式，响应类型:', typeof response)
    if (typeof response === 'object' && response !== null) {
      console.error('响应对象的键:', Object.keys(response))
    } else if (typeof response === 'string') {
      try {
        // 尝试解析JSON字符串
        const parsedResponse = JSON.parse(response)
        console.error('解析后的响应对象:', parsedResponse)
      } catch (e) {
        console.error('响应不是有效的JSON字符串')
      }
    }

    throw new Error('无法识别的数据格式')
  } catch (error) {
    console.error('格式化技术分析数据时发生异常:', error)
    // 返回一个默认的数据结构，避免UI崩溃
    return {
      current_price: 0,
      trend_analysis: {
        probabilities: { up: 0.33, sideways: 0.34, down: 0.33 },
        summary: '数据加载失败，请刷新重试'
      },
      indicators_analysis: {},
      trading_advice: {
        action: '无建议',
        reason: '数据加载失败',
        entry_price: 0,
        stop_loss: 0,
        take_profit: 0
      },
      risk_assessment: {
        level: '中',
        score: 50,
        details: ['数据加载失败，无法评估风险']
      },
      last_update_time: new Date().toISOString()
    }
  }
}

