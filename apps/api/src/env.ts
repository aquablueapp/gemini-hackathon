import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(7667),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // 系统维护模式开关
  MAINTENANCE_MODE: z.string().optional().default('false').transform(v => v === 'true'),

  API_URL: z
    .url()
    .optional()
    .transform((s): string | undefined => (s ? s.replace(/\/+$/, '') : s)),
  APP_URL: z
    .url()
    .optional()
    .transform((s): string | undefined => (s ? s.replace(/\/+$/, '') : s)),

  // Agent 认证配置 (供 Uploader 使用)
  BEARER_TOKEN: z.string().optional(),

  // JWKS 内存缓存 TTL（秒）
  JWKS_CACHE_TTL_SECONDS: z.coerce.number().min(60).max(86400).optional().default(3600),
})
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === 'production') {
      if (!input.APP_URL || input.APP_URL.startsWith('http://localhost')) {
        ctx.addIssue({
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['APP_URL'],
          message: 'Must be set when NODE_ENV is \'production\' and not localhost',
        })
      }
    }
  })

export type env = z.infer<typeof EnvSchema>

const { data: env, error } = EnvSchema.safeParse(process.env)

if (error) {
  console.error('❌ Invalid env:')
  console.error(error.format())
  process.exit(1)
}

export default env!

