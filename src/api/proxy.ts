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
      if (chrome.runtime.lastError) {
        console.error('代理请求失败:', chrome.runtime.lastError)
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response.success) {
        console.error('API请求失败:', response.error)
        reject(new Error(response.error || '请求失败'))
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
