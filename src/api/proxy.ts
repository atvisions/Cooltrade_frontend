// API代理模块，用于解决CORS问题
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 检查是否在扩展环境中
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.sendMessage === 'function'
}

/**
 * 通过扩展的background.js代理API请求
 * @param config Axios请求配置
 * @returns Promise<AxiosResponse>
 */
export const proxyRequest = async (config: AxiosRequestConfig): Promise<any> => {
  if (!isExtensionEnvironment()) {
    throw new Error('不在扩展环境中，无法使用代理')
  }

  return new Promise((resolve, reject) => {
    const { url, method, headers, data } = config

    // 检查是否是强制刷新请求
    const isForceRefresh = url?.includes('force_refresh=true')

    // 设置超时处理
    let timeoutId: number | null = null
    const timeout = isForceRefresh ? 120000 : 30000 // 强制刷新使用更长的超时时间

    timeoutId = window.setTimeout(() => {
      reject(new Error(`请求超时 (${timeout/1000}秒)`))
    }, timeout)

    // 发送消息到background.js
    chrome.runtime.sendMessage({
      type: 'PROXY_API_REQUEST',
      data: {
        url,
        method: method?.toUpperCase() || 'GET',
        headers,
        body: data
      }
    }, (response) => {
      // 清除超时计时器
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response || !response.success) {
        const error = new Error(response?.error || '请求失败')
        if (response?.errorDetail) {
          // @ts-ignore
          error.detail = response.errorDetail
        }
        reject(error)
        return
      }

      // 构造类似Axios的响应对象
      const axiosResponse = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config
      }

      resolve(axiosResponse)
    })
  })
}

export default {
  proxyRequest,
  isExtensionEnvironment
}
