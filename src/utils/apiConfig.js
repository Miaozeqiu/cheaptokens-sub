export function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  // 兜底：生产环境默认线上 API
  return 'https://api.cheaptokens.shop'
}

export function apiUrl(path) {
  return `${resolveApiBaseUrl()}${path}`
}
