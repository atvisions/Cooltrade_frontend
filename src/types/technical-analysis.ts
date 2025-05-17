// 基础类型定义

// API响应基础类型
export interface BaseApiResponse {
  status: string;
}

// 带数据的API响应类型
export interface ApiResponse<T> extends BaseApiResponse {
  data: T;
}

// 业务数据类型



// 技术分析数据 - 指标分析
export interface IndicatorAnalysis {
  value: number | { [key: string]: number };
  analysis: string;
  support_trend: string;
}

// 技术分析数据 - 完整定义
export interface TechnicalAnalysisData {
  trend_analysis: {
    probabilities: {
      up: number;
      sideways: number;
      down: number;
    };
    summary: string;
  };
  indicators_analysis: {
    RSI: IndicatorAnalysis & { value: number };
    MACD: IndicatorAnalysis & {
      value: {
        line: number;
        signal: number;
        histogram: number;
      };
    };
    BollingerBands: IndicatorAnalysis & {
      value: {
        upper: number;
        middle: number;
        lower: number;
      };
    };
    BIAS: IndicatorAnalysis & { value: number };
    PSY: IndicatorAnalysis & { value: number };
    DMI: IndicatorAnalysis & {
      value: {
        plus_di: number;
        minus_di: number;
        adx: number;
      };
    };
    VWAP: IndicatorAnalysis & { value: number };
    FundingRate: IndicatorAnalysis & { value: number };
    ExchangeNetflow: IndicatorAnalysis & { value: number };
    NUPL: IndicatorAnalysis & { value: number };
    MayerMultiple: IndicatorAnalysis & { value: number };
  };
  trading_advice: {
    action: string;
    reason: string;
    entry_price: number;
    stop_loss: number;
    take_profit: number;
  };
  risk_assessment: {
    level: string;
    score: number;
    details: string[];
  };
  current_price: number;
  snapshot_price: number;
  price?: number;
  last_update_time: string;
}

// 技术分析响应
export interface TechnicalAnalysisResponse extends ApiResponse<TechnicalAnalysisData> {}

// 强制刷新数据
export interface ForceRefreshData {
  trend_up_probability: number;
  trend_sideways_probability: number;
  trend_down_probability: number;
  trend_summary: string;
  indicators_analysis: TechnicalAnalysisData['indicators_analysis'];
  trading_action: string;
  trading_reason: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_level: string;
  risk_score: number;
  risk_details: string[];
  current_price: number;
  snapshot_price: number;
  last_update_time: string;
}

// 强制刷新响应
export interface ForceRefreshResponse extends ApiResponse<ForceRefreshData> {}

// 前端统一格式
export interface FormattedTechnicalAnalysisData {
  current_price: number;
  snapshot_price: number;
  trend_analysis: {
    probabilities: {
      up: number;
      sideways: number;
      down: number;
    };
    summary: string;
  };
  indicators_analysis: TechnicalAnalysisData['indicators_analysis'];
  trading_advice: {
    action: string;
    reason: string;
    entry_price: number;
    stop_loss: number;
    take_profit: number;
  };
  risk_assessment: {
    level: string;
    score: number;
    details: string[];
  };
  last_update_time: string;
}