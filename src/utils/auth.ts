// 从 localStorage 获取 token
export const getToken = (): string => {
  return localStorage.getItem('token') || '3c40be432b414963c4a07d375ae4091f1756304d'
}

// 设置 token 到 localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token)
}

// 移除 token
export const removeToken = (): void => {
  localStorage.removeItem('token')
} 