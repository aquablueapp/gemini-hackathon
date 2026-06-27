import { motion } from 'framer-motion'
import { Chrome, Eye, EyeOff, Github, Lock, Mail } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface PremiumLoginCardProps {
  onSubmit: (email: string, password: string) => void
  onSocialLogin?: (provider: string) => void
  isLoading?: boolean
  error?: string | null
  className?: string
}

// Shake animation keyframes on submission validation failures
const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, -3, 3, 0],
    transition: { duration: 0.5 },
  },
  idle: {
    x: 0,
  },
}

/**
 * PremiumLoginCard component with glassmorphic layouts, visual feedback shaking, and social OAuth inputs.
 */
export const PremiumLoginCard: React.FC<PremiumLoginCardProps> = ({
  onSubmit,
  onSocialLogin,
  isLoading = false,
  error,
  className,
}) => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isShaking, setIsShaking] = React.useState(false)

  // Trigger shake animation when an external error message is passed down
  React.useEffect(() => {
    if (error) {
      setIsShaking(true)
    }
  }, [error])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side quick check to trigger visual shake feedback
    if (!email || !password || password.length < 6) {
      setIsShaking(true)
      return
    }

    onSubmit(email, password)
  }

  return (
    <motion.div
      variants={shakeVariants}
      animate={isShaking ? 'shake' : 'idle'}
      onAnimationComplete={() => setIsShaking(false)}
      className={cn(
        'w-full max-w-[420px] rounded-2xl border border-[#d9e1e8] bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-[#223145] dark:bg-[#131d28]/85',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5 text-center mb-6 select-none">
        <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Welcome Back
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Enter credentials to access your session
        </p>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="email-input" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            Email address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 h-4 w-4 text-stone-400 dark:text-stone-500" />
            <input
              id="email-input"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="developer@antigravity.ai"
              className="h-10 w-full rounded-lg border border-[#d9e1e8] bg-white/50 pl-10 pr-3 text-sm shadow-2xs outline-hidden focus:border-blue-400 dark:border-[#223145] dark:bg-stone-900/50 dark:text-stone-50 dark:focus:border-blue-500"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label htmlFor="password-input" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Password
            </label>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 h-4 w-4 text-stone-400 dark:text-stone-500" />
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isLoading}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 w-full rounded-lg border border-[#d9e1e8] bg-white/50 pl-10 pr-10 text-sm shadow-2xs outline-hidden focus:border-blue-400 dark:border-[#223145] dark:bg-stone-900/50 dark:text-stone-50 dark:focus:border-blue-500"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Display Error Warning */}
        {error && (
          <div className="rounded-lg bg-red-50 p-2.5 text-left text-xs font-medium text-red-700 ring-1 ring-inset ring-red-650/10 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Test Account Autofill Box */}
        <div className="rounded-lg border border-[#d9e1e8] bg-stone-50/50 p-3 text-left text-xs dark:border-[#223145] dark:bg-stone-900/30">
          <div className="font-bold text-zinc-700 dark:text-stone-300">Demo Credentials</div>
          <div className="mt-1 flex flex-col gap-0.5 text-stone-500 dark:text-stone-400">
            <div>
              Email:
              <code className="font-mono text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-1 rounded select-all">test@example.com</code>
            </div>
            <div>
              Password:
              <code className="font-mono text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-1 rounded select-all">test234</code>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('test@example.com')
              setPassword('test234')
            }}
            className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
          >
            Auto-fill Credentials
          </button>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#6ca7ff] to-[#4384e7] text-sm font-bold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Social Provider OAuth Area */}
      {onSocialLogin && (
        <div className="mt-6 space-y-4">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute w-full border-t border-stone-200 dark:border-stone-850" />
            <span className="relative bg-white px-2.5 text-[10px] font-bold tracking-widest text-stone-400 dark:bg-stone-950 dark:text-stone-500 uppercase">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSocialLogin('google')}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#d9e1e8] bg-white text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-stone-50 dark:border-[#223145] dark:bg-stone-900/40 dark:text-stone-300 dark:hover:bg-stone-900 cursor-pointer"
            >
              <Chrome className="h-4 w-4 shrink-0 text-zinc-650" />
              <span>Google</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSocialLogin('github')}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#d9e1e8] bg-white text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-stone-50 dark:border-[#223145] dark:bg-stone-900/40 dark:text-stone-300 dark:hover:bg-stone-900 cursor-pointer"
            >
              <Github className="h-4 w-4 shrink-0 text-zinc-650" />
              <span>GitHub</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

PremiumLoginCard.displayName = 'PremiumLoginCard'
