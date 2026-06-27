import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
}

export interface OnboardingStepsProps {
  steps: OnboardingStep[]
  currentStepIndex: number
  onStepChange: (index: number) => void
  onComplete?: () => void
  className?: string
}

// Slide variants depending on navigation direction
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 160 : -160,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 160 : -160,
    opacity: 0,
  }),
}

/**
 * OnboardingSteps component that manages step progressions with premium horizontal sliding slide-ins.
 */
export const OnboardingSteps: React.FC<OnboardingStepsProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  onComplete,
  className,
}) => {
  const [direction, setDirection] = React.useState(0)

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setDirection(1)
      onStepChange(currentStepIndex + 1)
    }
    else if (onComplete) {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setDirection(-1)
      onStepChange(currentStepIndex - 1)
    }
  }

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[500px] rounded-2xl border border-stone-200 bg-white p-6 shadow-md dark:border-stone-800 dark:bg-stone-950 flex flex-col',
        className,
      )}
    >
      {/* Top progress indicators */}
      <div className="mb-6 flex items-center justify-between gap-1.5 select-none shrink-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isActive = index === currentStepIndex
          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border transition-all duration-300',
                  isCompleted
                    ? 'bg-purple-500 text-stone-50 border-purple-500 dark:bg-purple-600 dark:border-purple-600'
                    : isActive
                      ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-50 dark:text-stone-950 dark:border-stone-50 ring-2 ring-stone-200 dark:ring-stone-800'
                      : 'bg-white border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-800',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>

              {/* Progress bar line between steps */}
              {index < steps.length - 1 && (
                <div className="h-0.5 flex-1 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 dark:bg-purple-400 transition-all duration-300"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Stepped Slide Content Wrapper */}
      <div className="relative flex-1 overflow-hidden min-h-[200px] flex flex-col justify-start">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentStepIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="w-full flex flex-col text-left flex-1"
          >
            {/* Title & Desc */}
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
              {steps[currentStepIndex].title}
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-normal">
              {steps[currentStepIndex].description}
            </p>

            {/* Custom inner step content */}
            <div className="mt-4 flex-1">{steps[currentStepIndex].content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav Action Bar */}
      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 dark:border-stone-900 shrink-0">
        <button
          type="button"
          disabled={currentStepIndex === 0}
          onClick={handleBack}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-600 shadow-xs hover:bg-stone-50 hover:text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-850 dark:hover:text-stone-100 transition-colors cursor-pointer',
            currentStepIndex === 0 && 'opacity-50 cursor-not-allowed',
          )}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-stone-900 px-4 text-xs font-semibold text-stone-50 hover:bg-stone-850 dark:bg-stone-50 dark:text-stone-950 dark:hover:bg-stone-150 transition-colors shadow-sm cursor-pointer"
        >
          <span>{currentStepIndex === steps.length - 1 ? 'Finish' : 'Continue'}</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  )
}

OnboardingSteps.displayName = 'OnboardingSteps'
