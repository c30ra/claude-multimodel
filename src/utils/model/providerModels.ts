import { getGlobalConfig } from '../config.js'
import type { ModelOption } from './modelOptions.js'

type ProviderModelResponse = {
  data?: Array<{ id?: string; object?: string; owned_by?: string }>
  models?: Array<{ id?: string; name?: string; display_name?: string }>
}

type ProviderModelsConfig = {
  activeProvider?: string | null
  providerModelsCache?: Record<string, { payload?: ProviderModelResponse }>
}

function normalizeProviderName(provider: string | null | undefined): string | null {
  if (!provider) return null
  return provider.trim().toLowerCase()
}

export function buildModelOptionsFromProviderResponse(
  payload: ProviderModelResponse | undefined,
): ModelOption[] {
  if (!payload) return []

  const rawModels = payload.data ?? payload.models ?? []
  const description =
    payload.data?.some(model => model.owned_by === 'openai')
      ? 'OpenAI model'
      : 'Provider model'
  const options = rawModels
    .map(model => {
      const id = model.id ?? model.name ?? model.display_name
      if (!id) return null
      return {
        value: id,
        label: id,
        description,
      } satisfies ModelOption
    })
    .filter((opt): opt is ModelOption => opt !== null)

  return options
}

export function getProviderModelOptionsForConfig(
  config: ProviderModelsConfig | undefined,
  fallbackPayload?: ProviderModelResponse,
): ModelOption[] {
  const providerName = normalizeProviderName(config?.activeProvider)
  if (providerName) {
    const cached = config?.providerModelsCache?.[providerName]
    if (cached?.payload) {
      return buildModelOptionsFromProviderResponse(cached.payload)
    }
  }

  return buildModelOptionsFromProviderResponse(fallbackPayload)
}

export function getProviderModelOptions(
  fallbackPayload?: ProviderModelResponse,
): ModelOption[] {
  const config = getGlobalConfig()
  return getProviderModelOptionsForConfig(
    {
      activeProvider: config.activeProvider,
      providerModelsCache: config.providerModelsCache,
    },
    fallbackPayload,
  )
}
