import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type OnboardingStep, OnboardingSteps } from './onboarding-steps'

describe('onboardingSteps Component', () => {
  const steps: OnboardingStep[] = [
    {
      id: 'step-1',
      title: 'Step One Title',
      description: 'First step description',
      content: <div data-testid="step-1-content">Step 1 Content</div>,
    },
    {
      id: 'step-2',
      title: 'Step Two Title',
      description: 'Second step description',
      content: <div data-testid="step-2-content">Step 2 Content</div>,
    },
  ]

  it('renders active step content and navigation controls', () => {
    const handleStepChange = vi.fn()
    render(
      <OnboardingSteps
        steps={steps}
        currentStepIndex={0}
        onStepChange={handleStepChange}
      />,
    )

    expect(screen.getByText('Step One Title')).toBeInTheDocument()
    expect(screen.getByText('First step description')).toBeInTheDocument()
    expect(screen.getByTestId('step-1-content')).toBeInTheDocument()

    // Back button should be disabled at step 0
    const backBtn = screen.getByRole('button', { name: /back/i })
    expect(backBtn).toBeDisabled()
  })

  it('triggers step change on Continue click', async () => {
    const user = userEvent.setup()
    const handleStepChange = vi.fn()

    render(
      <OnboardingSteps
        steps={steps}
        currentStepIndex={0}
        onStepChange={handleStepChange}
      />,
    )

    const continueBtn = screen.getByRole('button', { name: /continue/i })
    await user.click(continueBtn)

    expect(handleStepChange).toHaveBeenCalledWith(1)
  })

  it('triggers onComplete callback when clicking Finish at the last step', async () => {
    const user = userEvent.setup()
    const handleStepChange = vi.fn()
    const handleComplete = vi.fn()

    render(
      <OnboardingSteps
        steps={steps}
        currentStepIndex={1}
        onStepChange={handleStepChange}
        onComplete={handleComplete}
      />,
    )

    // Finish button should be visible in step 1 (last step)
    const finishBtn = screen.getByRole('button', { name: /finish/i })
    await user.click(finishBtn)

    expect(handleComplete).toHaveBeenCalledOnce()
  })
})
