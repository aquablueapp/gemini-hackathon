import type { Locale } from './i18n/shared'
import { toast } from 'sonner'
import { defaultLocale } from './i18n/shared'

/**
 * API 错误响应结构（本地定义，避免对 api/client 的循环依赖）
 */
interface IErrorResponseData {
  error?: {
    issues?: Array<{ code: string }>
  }
}

interface IErrorWithResponse {
  response: {
    data: IErrorResponseData
  }
}

function isErrorWithResponse(error: unknown): error is IErrorWithResponse {
  return (
    error != null
    && typeof error === 'object'
    && 'response' in error
    && (error as Record<string, unknown>).response != null
    && typeof (error as Record<string, unknown>).response === 'object'
    && 'data' in ((error as Record<string, unknown>).response as Record<string, unknown>)
  )
}

/**
 * 从错误响应中提取错误码
 */
export function extractErrorCode(error: unknown): string | null {
  if (!isErrorWithResponse(error)) {
    return null
  }

  const { data } = error.response
  const issues = data?.error?.issues
  if (Array.isArray(issues) && issues.length > 0) {
    return issues[0].code
  }

  return null
}

/**
 * 获取错误消息的翻译
 */
interface IErrorDict {
  unauthorized: string
  forbidden: string
  notFound: string
  serverError: string
  maintenance: string
  default: string
}

const errorMessages: Record<Locale, IErrorDict> = {
  'zh-CN': {
    unauthorized: '未授权，请重新登录',
    forbidden: '权限不足',
    notFound: '资源未找到',
    serverError: '服务器错误',
    maintenance: '系统维护中',
    default: '出错了！',
  },
  'zh-TW': {
    unauthorized: '未授權，請重新登入',
    forbidden: '權限不足',
    notFound: '資源未找到',
    serverError: '伺服器錯誤',
    maintenance: '系統維護中',
    default: '出錯了！',
  },
  'en': {
    unauthorized: 'Unauthorized, please login again',
    forbidden: 'Forbidden',
    notFound: 'Resource not found',
    serverError: 'Internal server error',
    maintenance: 'System is under maintenance',
    default: 'Something went wrong!',
  },
  'ja': {
    unauthorized: '認証されていません。再度ログインしてください',
    forbidden: 'アクセスが拒否されました',
    notFound: 'リソースが見つかりません',
    serverError: 'サーバーエラー',
    maintenance: 'システムメンテナンス中です',
    default: 'エラーが発生しました！',
  },
  'ko': {
    unauthorized: '인증되지 않았습니다. 다시 로그인해 주세요',
    forbidden: '접근이 거부되었습니다',
    notFound: '리소스를 찾을 수 없습니다',
    serverError: '서버 오류가 발생했습니다',
    maintenance: '시스템 점검 중입니다',
    default: '문제가 발생했습니다!',
  },
}

export function getErrorMessage(locale: Locale, errorCode: string | null): string {
  const dict = errorMessages[locale] ?? errorMessages[defaultLocale]

  if (errorCode === 'unauthorized')
    return dict.unauthorized
  if (errorCode === 'forbidden')
    return dict.forbidden

  return dict.default
}

/**
 * 全局错误处理入口
 */
export function handleServerError(error: unknown, locale: Locale = defaultLocale) {
  const errorCode = extractErrorCode(error)
  const errMsg = getErrorMessage(locale, errorCode)
  toast.error(errMsg)
}
