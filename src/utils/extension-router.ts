/**
 * 扩展环境中的路由辅助函数
 * 在扩展中，普通的 router.push 可能不会正常工作
 * 这个文件提供了一些辅助函数，确保在扩展环境中也能正确导航
 */

import router from '@/router'

/**
 * 检测当前是否在扩展环境中
 */
export const isExtensionEnvironment = (): boolean => {
  return (
    window.location.protocol === 'chrome-extension:' ||
    window.location.protocol === 'moz-extension:' ||
    window.location.protocol === 'extension:'
  )
}

/**
 * 在扩展环境中安全地导航到指定路径
 * @param path 要导航到的路径
 * @param query 查询参数
 */
export const navigateTo = (path: string, query?: Record<string, string>): void => {
  if (isExtensionEnvironment()) {
    // 在扩展环境中，使用 window.location 导航
    let url = `#${path}`

    // 添加查询参数
    if (query) {
      const queryString = Object.entries(query)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')

      if (queryString) {
        url += `?${queryString}`
      }
    }

    window.location.href = url
  } else {
    // 在普通环境中，使用 Vue Router 导航
    router.push({ path, query })
  }
}

/**
 * 返回上一页
 */
export const goBack = (): void => {
  if (isExtensionEnvironment()) {
    window.history.back()
  } else {
    router.back()
  }
}

/**
 * 导航到登录页
 * @param redirectPath 登录后重定向的路径
 */
export const goToLogin = (redirectPath?: string): void => {
  const query = redirectPath ? { redirect: redirectPath } : undefined
  navigateTo('/login', query)
}

/**
 * 导航到注册页
 */
export const goToRegister = (): void => {
  navigateTo('/register')
}

/**
 * 导航到忘记密码页
 */
export const goToForgotPassword = (): void => {
  navigateTo('/forgot-password')
}

/**
 * 导航到首页
 */
export const goToHome = (): void => {
  navigateTo('/')
}

/**
 * 导航到个人资料页
 */
export const goToProfile = (): void => {
  navigateTo('/profile')
}

/**
 * 导航到积分页
 */
export const goToPoints = (): void => {
  navigateTo('/points')
}

/**
 * 导航到修改密码页
 */
export const goToChangePassword = (): void => {
  navigateTo('/change-password')
}

export default {
  isExtensionEnvironment,
  navigateTo,
  goBack,
  goToLogin,
  goToRegister,
  goToForgotPassword,
  goToHome,
  goToProfile,
  goToPoints,
  goToChangePassword
}
