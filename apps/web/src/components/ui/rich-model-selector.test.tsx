import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type AIModel, RichModelSelector } from './rich-model-selector'

describe('richModelSelector Component', () => {
  const models: AIModel[] = [
    { id: 'gemini-flash', name: 'Gemini 1.5 Flash', description: 'Speed optimized model' },
    { id: 'gemini-pro', name: 'Gemini 1.5 Pro', description: 'High-reasoning agent model', isThinking: true },
  ]

  it('renders with placeholder and currently selected option', () => {
    const handleSelect = vi.fn()
    const { rerender } = render(
      <RichModelSelector
        models={models}
        selectedModelId=""
        onSelect={handleSelect}
        placeholder="Choose Model"
      />,
    )

    // Verify placeholder text is shown
    expect(screen.getByText('Choose Model')).toBeInTheDocument()

    // Rerender with gemini-pro selected
    rerender(
      <RichModelSelector
        models={models}
        selectedModelId="gemini-pro"
        onSelect={handleSelect}
      />,
    )

    // Verify selected model label and badge are shown
    expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument()
    expect(screen.getByText('Thinking')).toBeInTheDocument()
  })

  it('opens dropdown menu and triggers selection callback on item click', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()

    render(
      <RichModelSelector
        models={models}
        selectedModelId="gemini-flash"
        onSelect={handleSelect}
      />,
    )

    // Trigger dropdown click
    const button = screen.getByRole('button')
    await user.click(button)

    // Verify options are visible in dropdown portal
    const optionFlash = screen.getByText('Speed optimized model')
    const optionPro = screen.getByText('High-reasoning agent model')

    expect(optionFlash).toBeInTheDocument()
    expect(optionPro).toBeInTheDocument()

    // Select the pro model
    await user.click(optionPro.closest('[role="menuitem"]')!)

    // Check if onSelect callback was triggered
    expect(handleSelect).toHaveBeenCalledWith('gemini-pro')
  })
})
