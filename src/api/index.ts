/// <reference types="chrome"/>

import axios from 'axios'
import type {
  TechnicalAnalysisResponse,
  ForceRefreshResponse,
  FormattedTechnicalAnalysisData,
  BaseApiResponse
} from '@/types/technical-analysis'
import { formatTechnicalAnalysisData } from '@/utils/data-formatter'
import { proxyRequest, isExtensionEnvironment as isExtension } from './proxy'

// 检查是否在扩展环境中
const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.getURL === 'function';
}

// 检查是否是开发环境
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

// 获取基础 URL
const getBaseUrl = (): string => {
  // 如果是扩展环境，总是使用线上 API
  if (isExtensionEnvironment()) {
    return 'https://www.cooltrade.xyz/api'
  }
  // 如果是开发环境，使用相对路径，让 Vite 的代理服务器处理请求
  if (isDevelopment()) {
    return '/api'
  }
  // 生产环境
  return 'https://www.cooltrade.xyz/api'
}

// 创建axios实例
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json'
  }
})

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2秒
const FORCE_REFRESH_TIMEOUT = 60000 // 强制刷新超时时间60秒

// 请求限制配置
const MAX_REQUESTS_PER_MINUTE = 30
const MIN_REQUEST_INTERVAL = 2000 // 最小请求间隔2秒

// 请求队列
let requestQueue: { timestamp: number; count: number }[] = []
let lastRequestTime = 0

// Token验证
const validateToken = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('Token不存在')
    return false
  }

  // 检查token格式
  if (!token.startsWith('Token ')) {
    console.error('Token格式错误')
    return false
  }

  // 检查token长度
  const tokenValue = token.replace('Token ', '')
  if (tokenValue.length !== 40) {
    console.error('Token长度错误')
    return false
  }

  return true
}

// 检查是否是认证相关的请求
const isAuthRequest = (url: string | undefined): boolean => {
  if (!url) return false;
  return url.includes('/auth/login') ||
         url.includes('/auth/register') ||
         url.includes('/auth/send-code') ||
         url.includes('/auth/request-password-reset') ||
         url.includes('/auth/reset-password-with-code');
}

// 检查请求限制
const checkRateLimit = async (): Promise<void> => {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  // 清理旧的请求记录
  requestQueue = requestQueue.filter(item => item.timestamp > oneMinuteAgo)

  // 检查是否超过每分钟限制
  if (requestQueue.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestRequest = requestQueue[0]
    const waitTime = 60000 - (now - oldestRequest.timestamp)
    if (waitTime > 0) {
      console.log(`达到每分钟请求限制，等待${waitTime/1000}秒`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      await checkRateLimit()
      return
    }
  }

  // 检查最小请求间隔
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    console.log(`请求过于频繁，等待${waitTime/1000}秒`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  // 更新请求记录
  requestQueue.push({ timestamp: now, count: 1 })
  lastRequestTime = now
}

// 请求重试函数
const retryRequest = async (config: any, retryCount: number = 0): Promise<any> => {
  try {
    // 验证token
    if (!validateToken()) {
      throw new Error('Token验证失败')
    }

    // 检查请求限制
    await checkRateLimit()

    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token
    }

    // 添加缓存控制头
    config.headers['Cache-Control'] = 'no-cache'
    config.headers['Pragma'] = 'no-cache'

    // 如果是强制刷新请求，使用更长的超时时间
    if (config.params?.force_refresh) {
      config.timeout = FORCE_REFRESH_TIMEOUT
    }

    // 在扩展环境中使用代理请求
    let response;
    if (isExtension()) {
      console.log('使用代理发送请求:', config.url)
      response = await proxyRequest(config)
    } else {
      response = await axios(config)
    }

    return response
  } catch (error: any) {
    // 处理文件访问错误
    if (error.code === 'ERR_FILE_NOT_FOUND') {
      console.error('文件访问错误:', error)
      // 如果是扩展资源访问错误，尝试重新加载扩展
      if (isExtensionEnvironment() && error.config?.url?.includes(chrome.runtime.getURL(''))) {
        console.log('尝试重新加载扩展资源...')
        // 通知background script重新加载资源
        chrome.runtime.sendMessage({ type: 'RELOAD_RESOURCES' })
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000))
        return retryRequest(config, retryCount + 1)
      }
    }

    if (error.message === 'Token验证失败') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // 如果是强制刷新请求，增加重试次数
    const maxRetries = config.params?.force_refresh ? MAX_RETRIES * 2 : MAX_RETRIES

    if (retryCount < maxRetries && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ERR_FILE_NOT_FOUND' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status === 500
    )) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount)
      console.log(`请求失败，${delay/1000}秒后重试(${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryRequest(config, retryCount + 1)
    }

    throw error
  }
}

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    try {
      // 只对非认证请求验证token
      if (!isAuthRequest(config.url) && !validateToken()) {
        return Promise.reject(new Error('Token验证失败'))
      }

      // 检查请求限制
      await checkRateLimit()

      // 只对非认证请求添加token
      if (!isAuthRequest(config.url)) {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = token
        }
      }

      // 打印请求信息
      console.log('Request Config:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? 'Token ****' : undefined
        }
      })
      return config
    } catch (error) {
      return Promise.reject(error)
    }
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 添加响应数据结构检查
    console.log('API响应数据:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })

    // 检查数据结构
    if (!response.data || typeof response.data !== 'object') {
      console.error('API响应数据格式错误:', response.data)
      return Promise.reject(new Error('数据格式错误'))
    }

    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // 处理token验证失败
    if (error.message === 'Token验证失败') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // 处理网络错误
    if (error.code === 'ERR_NETWORK') {
      console.error('网络连接错误:', error)
      if (!originalRequest._retry) {
        originalRequest._retry = true
        try {
          const response = await retryRequest(originalRequest)
          return response
        } catch (retryError) {
          console.error('重试失败:', retryError)
          return Promise.reject(retryError)
        }
      }
    }

    // 处理其他错误
    if ((error.code === 'ERR_FILE_NOT_FOUND' || error.response?.status === 500) && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const response = await retryRequest(originalRequest)
        return response
      } catch (retryError) {
        console.error('重试失败:', retryError)
        return Promise.reject(retryError)
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }

    // 详细的错误日志
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: {
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? 'Token ****' : undefined
        }
      }
    })

    return Promise.reject(error)
  }
)

interface LoginResponse {
  status: string;
  message?: string;
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      username: string;
      is_active: boolean;
    };
  };
}

export const auth = {
  sendCode: async (data: { email: string }) => {
    try {
      // 使用 API 实例而不是直接使用 axios
      const response = await api.post('/auth/send-code/', {
        email: data.email.trim()
      });
      return response;
    } catch (error) {
      console.error('Send code error:', error);
      throw error;
    }
  },
  register: (data: { email: string; password: string; code: string; invitation_code: string }) => {
    // 使用基础 URL
    const url = `${getBaseUrl()}/auth/register/`;


    return axios.post(url, {
      email: data.email.trim(),
      password: data.password.trim(),
      code: data.code.trim(),
      invitation_code: data.invitation_code.trim()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.data)
  },
  login: async (data: { email: string; password: string }): Promise<LoginResponse> => {
    try {
      // 使用基础 URL
      const url = `${getBaseUrl()}/auth/login/`;
      console.log('Login URL:', url);
      console.log('Request Config:', {
        url: '/auth/login/',
        method: 'post',
        data: {
          email: data.email.trim(),
          password: data.password.trim()
        }
      });

      const response = await axios.post(url, {
        email: data.email.trim(),
        password: data.password.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  requestPasswordReset: (data: { email: string }) => {
    // 使用基础 URL
    const url = `${getBaseUrl()}/auth/request-password-reset/`;



    return axios.post(url, {
      email: data.email.trim()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.data)
  },
  resetPasswordWithCode: (data: { email: string; code: string; new_password: string; confirm_password: string }) => {
    // 使用基础 URL
    const url = `${getBaseUrl()}/auth/reset-password-with-code/`;



    return axios.post(url, {
      email: data.email.trim(),
      code: data.code.trim(),
      new_password: data.new_password.trim(),
      confirm_password: data.confirm_password.trim()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.data)
  },

  changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) => {
    // 使用基础 URL
    const url = `${getBaseUrl()}/auth/change-password/`;

    return axios.post(url, {
      current_password: data.current_password.trim(),
      new_password: data.new_password.trim(),
      confirm_password: data.confirm_password.trim()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || ''
      }
    }).then(response => response.data)
  }
}

// API响应通用接口
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

// 技术分析接口返回类型
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
    RSI: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    MACD: {
      value: {
        line: number;
        signal: number;
        histogram: number;
      };
      analysis: string;
      support_trend: string;
    };
    BollingerBands: {
      value: {
        upper: number;
        middle: number;
        lower: number;
      };
      analysis: string;
      support_trend: string;
    };
    BIAS: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    PSY: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    DMI: {
      value: {
        plus_di: number;
        minus_di: number;
        adx: number;
      };
      analysis: string;
      support_trend: string;
    };
    VWAP: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    FundingRate: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    ExchangeNetflow: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    NUPL: {
      value: number;
      analysis: string;
      support_trend: string;
    };
    MayerMultiple: {
      value: number;
      analysis: string;
      support_trend: string;
    };
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
  last_update_time: string;
}

// 类型守卫：检查是否是基础API响应
function isBaseApiResponse(response: unknown): response is BaseApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof (response as BaseApiResponse).status === 'string'
  )
}

// 获取当前用户语言
const getCurrentLanguage = (): string => {
  // 从 localStorage 获取用户信息
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      return user.language || 'zh-CN' // 如果用户设置了语言，使用用户设置的语言，否则默认使用中文
    } catch (e) {
      console.error('解析用户信息失败:', e)
    }
  }
  return 'zh-CN' // 默认使用中文
}

// 获取技术分析数据
export const getTechnicalAnalysis = async (
  symbol: string
): Promise<FormattedTechnicalAnalysisData> => {
  try {
    // 确保symbol是大写的
    const normalizedSymbol = symbol.toUpperCase();

    // 如果不包含USDT后缀，添加它
    const fullSymbol = normalizedSymbol.endsWith('USDT')
      ? normalizedSymbol
      : `${normalizedSymbol}USDT`;

    // 构建请求路径 - 获取已存在的报告
    const path = `/crypto/technical-indicators/${fullSymbol}/`

    // 准备查询参数
    const params: Record<string, any> = {}

    // 添加语言参数
    const currentLanguage = getCurrentLanguage()
    params.language = currentLanguage

    // 记录当前使用的语言
    console.log(`使用语言参数: ${currentLanguage} 获取 ${fullSymbol} 的分析报告`)

    // 使用基础 URL
    const url = `${getBaseUrl()}${path}`;

    // 发送请求
    const response = await axios.get(url, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || ''
      }
    })
    // 检查响应格式
    const data = response.data

    if (typeof data === 'object') {
      // 检查是否是特殊响应格式
      if ('status' in data) {
        if (data.status === 'not_found') {
          return data as unknown as FormattedTechnicalAnalysisData
        }

        if (data.status === 'success' && 'data' in data) {
          return formatTechnicalAnalysisData(data.data)
        }
      }
    }

    // 假设响应是直接的技术分析数据，则格式化并返回
    return formatTechnicalAnalysisData(data)
  } catch (error: any) {
    // 错误处理

    // 网络错误重新格式化为更友好的消息
    if (error.code === 'ERR_NETWORK') {
      throw new Error('网络连接错误，请检查您的网络连接')
    }

    throw error
  }
}

// 防止重复请求的标记
let pendingRequests: Record<string, boolean> = {};

// 获取最新技术分析报告
export const getLatestTechnicalAnalysis = async (
  symbol: string
): Promise<FormattedTechnicalAnalysisData> => {
  // 定义在函数顶部，以便在 try/catch 块中都可以访问
  let requestPath = '';
  let requestLanguage = '';

  try {
    // 确保symbol是大写的
    const normalizedSymbol = symbol.toUpperCase();

    // 如果不包含USDT后缀，添加它
    const fullSymbol = normalizedSymbol.endsWith('USDT')
      ? normalizedSymbol
      : `${normalizedSymbol}USDT`;

    // 构建请求路径 - 获取最新报告
    requestPath = `/crypto/get_report/${fullSymbol}/`

    // 准备查询参数
    const params: Record<string, any> = {}

    // 添加语言参数
    requestLanguage = getCurrentLanguage()
    params.language = requestLanguage

    // 添加时间戳参数，防止缓存
    params._t = Date.now()

    // 创建请求标识符
    const requestId = `${requestPath}?language=${requestLanguage}`;

    // 检查是否有相同的请求正在进行中
    if (pendingRequests[requestId]) {
      console.log(`请求 ${requestId} 已在进行中，跳过重复请求`);
      throw new Error('请求已在进行中，请稍后再试');
    }

    // 标记请求为进行中
    pendingRequests[requestId] = true;

    // 记录当前使用的语言
    console.log(`使用语言参数: ${requestLanguage} 获取 ${fullSymbol} 的最新分析报告`)

    // 使用基础 URL
    const url = `${getBaseUrl()}${requestPath}`;

    // 发送请求
    const response = await axios.get(url, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    // 检查响应格式
    const data = response.data

    if (typeof data === 'object') {
      // 检查是否是特殊响应格式
      if ('status' in data) {
        if (data.status === 'not_found') {
          return data as unknown as FormattedTechnicalAnalysisData
        }

        if (data.status === 'success' && 'data' in data) {
          return formatTechnicalAnalysisData(data.data)
        }
      }
    }

    // 假设响应是直接的技术分析数据，则格式化并返回
    const result = formatTechnicalAnalysisData(data);

    // 清除请求标记
    pendingRequests[`${requestPath}?language=${requestLanguage}`] = false;

    return result;
  } catch (error: any) {
    // 错误处理

    // 清除请求标记
    if (requestPath && requestLanguage) {
      pendingRequests[`${requestPath}?language=${requestLanguage}`] = false;
    }

    // 网络错误重新格式化为更友好的消息
    if (error.code === 'ERR_NETWORK') {
      throw new Error('网络连接错误，请检查您的网络连接')
    }

    throw error
  }
}

export default api