import { describe, expect, it } from 'bun:test'
import {
  buildModelOptionsFromProviderResponse,
  getProviderModelOptionsForConfig,
} from './providerModels.js'

describe('buildModelOptionsFromProviderResponse', () => {
  it('parses OpenAI-style model lists into selectable options', () => {
    const options = buildModelOptionsFromProviderResponse({
      data: [
        { id: 'gpt-4.1', object: 'model', owned_by: 'openai' },
        { id: 'o4-mini', object: 'model', owned_by: 'openai' },
      ],
    })

    expect(options).toEqual([
      {
        value: 'gpt-4.1',
        label: 'gpt-4.1',
        description: 'OpenAI model',
      },
      {
        value: 'o4-mini',
        label: 'o4-mini',
        description: 'OpenAI model',
      },
    ])
  })

  it('supports provider payloads that use a models array', () => {
    const options = buildModelOptionsFromProviderResponse({
      models: [{ id: 'claude-sonnet-4-5' }],
    })

    expect(options).toEqual([
      {
        value: 'claude-sonnet-4-5',
        label: 'claude-sonnet-4-5',
        description: 'Provider model',
      },
    ])
  })

  it('prefers the active provider cache when selecting model options', () => {
    const options = getProviderModelOptionsForConfig(
      {
        activeProvider: 'openai',
        providerModelsCache: {
          openai: {
            payload: {
              data: [{ id: 'gpt-4.1' }],
            },
          },
        },
      },
      { data: [{ id: 'claude-sonnet-4-6' }] },
    )

    expect(options).toEqual([
      {
        value: 'gpt-4.1',
        label: 'gpt-4.1',
        description: 'Provider model',
      },
    ])
  })
})
