import * as React from 'react'
import { useCallback, useState } from 'react'
import { Box, Text } from '../../ink.js'
import { Dialog } from '../../components/design-system/Dialog.js'
import { Select } from '../../components/CustomSelect/select.js'
import TextInput from '../../components/TextInput.js'
import { useKeybinding } from '../../keybindings/useKeybinding.js'
import { saveProviderApiKey } from '../../utils/auth.js'
import { saveGlobalConfig } from '../../utils/config.js'

const PROVIDER_OPTIONS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'Custom provider', value: 'custom' },
] as const

type ProviderValue = (typeof PROVIDER_OPTIONS)[number]['value']

type Props = {
  onDone: (success: boolean, message?: string) => void
}

export function ProviderLogin({ onDone }: Props): React.ReactNode {
  const [provider, setProvider] = useState<ProviderValue>('openai')
  const [customProviderName, setCustomProviderName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [step, setStep] = useState<'provider' | 'custom-name' | 'key'>('provider')
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async () => {
    try {
      if (step === 'provider') {
        setStep(provider === 'custom' ? 'custom-name' : 'key')
        return
      }
      if (step === 'custom-name') {
        if (!customProviderName.trim()) {
          setError('Custom provider name cannot be empty')
          return
        }
        setStep('key')
        return
      }
      if (!apiKey.trim()) {
        setError('API key cannot be empty')
        return
      }
      const providerName = provider === 'custom' ? customProviderName.trim() || 'custom' : provider
      await saveProviderApiKey(providerName, apiKey.trim())
      saveGlobalConfig(current => ({
        ...current,
        activeProvider: providerName,
      }))
      onDone(true, `Saved ${providerName} API key`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    }
  }, [apiKey, customProviderName, onDone, provider, step])

  const handleCancel = () => {
    onDone(false, 'Login cancelled')
  }

  const handleProviderSelect = (value: ProviderValue) => {
    setProvider(value)
    setError(null)
    setStep(value === 'custom' ? 'custom-name' : 'key')
  }

  useKeybinding('confirm:yes', () => {
    void submit()
  }, {
    context: 'Confirmation',
    isActive: step === 'key' || step === 'custom-name',
  })

  return (
    <Dialog title="Provider Login" onCancel={handleCancel} color="permission" isCancelActive={false}>
      <Box flexDirection="column">
        {error ? <Text color="red">{error}</Text> : null}
        {step === 'provider' ? (
          <Box flexDirection="column">
            <Text>Select provider</Text>
            <Select
              options={PROVIDER_OPTIONS as any}
              onChange={value => handleProviderSelect(value as ProviderValue)}
              onCancel={handleCancel}
            />
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        ) : step === 'custom-name' ? (
          <Box flexDirection="column">
            <Text>Provider: custom</Text>
            <Text>Custom provider name</Text>
            <TextInput
              value={customProviderName}
              onChange={setCustomProviderName}
              onSubmit={() => void submit()}
              onExit={handleCancel}
              focus={true}
            />
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text>Provider: {provider === 'custom' ? customProviderName || 'custom' : provider}</Text>
            <Text>Enter API key</Text>
            <TextInput
              value={apiKey}
              onChange={setApiKey}
              onSubmit={() => void submit()}
              onExit={handleCancel}
              mask="*"
              focus={true}
            />
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
