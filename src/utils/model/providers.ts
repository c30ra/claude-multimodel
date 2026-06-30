import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
import { getGlobalConfig } from '../config.js'
import { isEnvTruthy } from '../envUtils.js'

export type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry' | 'openai' | 'openrouter' | 'ollama'

export type RuntimeProviderConfig = {
  provider: APIProvider
  apiKey: string | null
  baseURL?: string
  headers?: Record<string, string>
}

function normalizeProviderName(provider: string | null | undefined): string | null {
  return provider?.trim().toLowerCase() || null
}

export function getRuntimeProviderConfig(): RuntimeProviderConfig | null {
  const activeProvider = normalizeProviderName(getGlobalConfig().activeProvider)
  if (!activeProvider) {
    return null
  }

  const providerApiKeys = getGlobalConfig().providerApiKeys ?? {}
  const apiKey = providerApiKeys[activeProvider] ?? null

  switch (activeProvider) {
    case 'openrouter':
      return {
        provider: 'openrouter',
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          'HTTP-Referer': 'https://claude-code.local',
          'X-Title': 'Claude Code',
        },
      }
    case 'ollama':
      return {
        provider: 'ollama',
        apiKey,
        baseURL: 'http://127.0.0.1:11434/v1',
      }
    case 'openai':
      return {
        provider: 'openai',
        apiKey,
        baseURL: 'https://api.openai.com/v1',
      }
    default:
      return null
  }
}

export function getAPIProvider(): APIProvider {
  const runtimeProvider = getRuntimeProviderConfig()
  if (runtimeProvider?.provider) {
    return runtimeProvider.provider
  }

  return isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)
    ? 'bedrock'
    : isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)
      ? 'vertex'
      : isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
        ? 'foundry'
        : isEnvTruthy(process.env.CLAUDE_CODE_USE_OPENAI)
          ? 'openai'
          : 'firstParty'
}

export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL.
 * Returns true if not set (default API) or points to api.anthropic.com
 * (or api-staging.anthropic.com for ant users).
 */
export function isFirstPartyAnthropicBaseUrl(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) {
    return true
  }
  try {
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.anthropic.com']
    if (process.env.USER_TYPE === 'ant') {
      allowedHosts.push('api-staging.anthropic.com')
    }
    return allowedHosts.includes(host)
  } catch {
    return false
  }
}
