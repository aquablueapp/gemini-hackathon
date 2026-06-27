# API Gateway 代码规范

本文档描述了 API Gateway 项目的代码规范和最佳实践，基于当前实际代码实现。

## 目录

- [项目架构](#项目架构)
- [目录结构](#目录结构)
- [导入顺序规范](#导入顺序规范)
- [错误处理规范](#错误处理规范)
- [认证中间件规范](#认证中间件规范)
- [路由开发规范](#路由开发规范)
- [数据库开发规范](#数据库开发规范)
- [Schema 开发规范](#schema-开发规范)
- [命名规范](#命名规范)
- [类型安全](#类型安全)
- [环境变量规范](#环境变量规范)

## 项目架构

本项目基于以下技术栈：

- **框架**: Hono (轻量级 Web 框架)
- **运行时**: Bun (支持 Node.js 和 Cloudflare Workers)
- **API 文档**: OpenAPI 3.0 + Scalar
- **类型验证**: Zod
- **ORM**: Drizzle ORM
- **数据库**: Neon PostgreSQL
- **认证**: Better Auth (Session + JWT)
- **日志**: Pino
- **测试**: Vitest
- **辅助工具**: Stoker (减少样板代码)

### 核心特性

1. **类型安全**: 从数据库模型到 API 响应的全链路类型安全
2. **自动文档**: 基于 OpenAPI 规范的自动生成 API 文档
3. **统一错误处理**: 所有错误返回符合 `createErrorSchema` 结构，便于前端多语言处理
4. **模块化路由**: 按功能模块组织路由，便于维护和扩展

## 目录结构

```
src/
├── app.ts                 # 主应用入口，注册所有路由和 Better Auth
├── index.ts              # 服务器启动文件（Node.js）
├── worker.ts             # Cloudflare Workers 入口
├── env.ts                # 环境变量验证和导出
├── client.ts             # RPC 客户端类型导出
├── db/                   # 数据库相关
│   ├── index.ts          # 数据库连接和导出
│   ├── schema/           # 数据库表定义
│   │   ├── index.ts      # 导出所有 schema
│   │   ├── auth-schema.ts # Better Auth 表
│   │   └── *.ts          # 各个表的定义
│   ├── helpers/          # 数据库辅助函数
│   └── migrations/       # 数据库迁移文件
├── lib/                  # 工具库
│   ├── create-app.ts     # 创建 Hono 应用
│   ├── configure-open-api.ts  # OpenAPI 配置
│   ├── auth.ts           # Better Auth 配置
│   ├── errors.ts         # 统一错误处理（错误代码、错误类、错误响应）
│   ├── types.ts          # 类型定义
│   ├── constants.ts      # 常量定义
│   ├── role.ts           # 角色检查工具
│   ├── email.ts          # 邮件发送（Resend）
│   └── pagination.ts     # 分页工具
├── middlewares/          # 中间件
│   ├── auth.ts           # 认证中间件（JWT + Session 验证）
│   └── pino-logger.ts    # 日志中间件
├── routes/               # 路由模块
│   ├── index.route.ts    # 根路由
│   └── [module]/         # 功能模块路由
│       ├── [module].index.ts    # 路由注册
│       ├── [module].routes.ts   # 路由定义（OpenAPI）
│       └── [module].handlers.ts # 请求处理函数
└── shared/               # 共享代码
    ├── schemas/          # 共享的 Zod Schema
    └── validators/       # 共享的验证器
```

## 导入顺序规范

按照以下顺序组织导入，使用空行分隔：

1. **外部依赖**（第三方库）
2. **类型导入**（`import type`）
3. **内部工具库**（`@/lib/*`）
4. **数据库相关**（`@/db/*`）
5. **共享代码**（`@/shared/*`）
6. **中间件**（`@/middlewares/*`）
7. **相对路径导入**（`./` 或 `../`）

示例：

```typescript
import type { CreateRoute } from './regions.routes'
import type { AppRouteHandler } from '@/lib/types'
import { createRoute, z } from '@hono/zod-openapi'

import { eq } from 'drizzle-orm'

import * as HttpStatusCodes from 'stoker/http-status-codes'
import { db } from '@/db'
import { regions } from '@/db/schema/regions'

import { createErrorResponse, ERROR_CODES } from '@/lib/errors'
```

**规范**:

- 外部依赖和内部导入之间使用空行分隔
- 类型导入使用 `import type` 单独导入
- 相对路径导入放在最后

## 错误处理规范

### 1. 统一错误响应结构

所有错误返回必须符合 `createErrorSchema` 结构：

```typescript
{
  success: false,
  error: {
    issues: [{
      code: "auth.unauthorized",  // 错误代码（用于前端多语言映射）
      path: [],                   // 错误路径（用于指示错误发生的字段位置）
      message?: "Unauthorized"    // 错误消息（可选，用于默认消息或调试）
    }],
    name: "AuthError"            // 错误类型名称
  }
}
```

### 2. 错误代码系统

使用点分隔的层级命名，便于分类和多语言映射：

```typescript
// apps/api/src/lib/errors.ts
export const ERROR_CODES = {
  // 认证相关
  AUTH_UNAUTHORIZED: 'auth.unauthorized',
  AUTH_FORBIDDEN: 'auth.forbidden',
  AUTH_INVALID_TOKEN: 'auth.invalid_token',
  AUTH_SESSION_EXPIRED: 'auth.session_expired',
  AUTH_MISSING_SESSION_ID: 'auth.missing_session_id',

  // 资源相关
  RESOURCE_NOT_FOUND: 'resource.not_found',
  RESOURCE_ALREADY_EXISTS: 'resource.already_exists',

  // 验证相关
  VALIDATION_ERROR: 'validation.error',
  VALIDATION_INVALID_UPDATES: 'validation.invalid_updates',
  VALIDATION_REQUIRED: 'validation.required',

  // 系统相关
  INTERNAL_ERROR: 'internal.error',
} as const
```

**规范**:

- 错误代码使用点分隔的层级命名（如 `auth.unauthorized`）
- 错误代码常量使用 `UPPER_SNAKE_CASE`
- 新增错误代码时，必须添加到对应的分类中

### 3. 自定义错误类

使用自定义错误类替代字符串匹配，提高代码可维护性：

```typescript
// apps/api/src/lib/errors.ts
export class AuthError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message?: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// 使用示例
throw new AuthError(ERROR_CODES.AUTH_SESSION_EXPIRED, 'Session not found or expired')

// 在 catch 中判断
if (error instanceof AuthError) {
  return c.json(
    createErrorResponse(error.code, { message: error.message }),
    HttpStatusCodes.UNAUTHORIZED,
  )
}
```

**规范**:

- 抛出错误时使用自定义错误类，直接指定错误代码
- 在 catch 中使用 `instanceof` 判断错误类型，避免字符串匹配
- 自定义错误类应包含 `code` 属性，便于错误处理

### 4. 创建错误响应

使用 `createErrorResponse` 函数创建统一格式的错误响应：

```typescript
import { createErrorResponse, ERROR_CODES } from '@/lib/errors'

// 简单错误
return c.json(
  createErrorResponse(ERROR_CODES.RESOURCE_NOT_FOUND),
  HttpStatusCodes.NOT_FOUND,
)

// 带消息和路径的错误
return c.json(
  createErrorResponse(ERROR_CODES.RESOURCE_NOT_FOUND, {
    message: 'Region not found',
    path: ['id'],
  }),
  HttpStatusCodes.NOT_FOUND,
)
```

**规范**:

- 所有错误响应必须使用 `createErrorResponse` 创建
- 使用 `ERROR_CODES` 常量，不要硬编码错误代码字符串
- 资源未找到时，使用 `path` 指示错误的字段位置

### 5. 验证错误处理

对于多个验证错误，使用 `createValidationErrorResponse`：

```typescript
import { createValidationErrorResponse } from '@/lib/errors'

return c.json(
  createValidationErrorResponse([
    { code: 'validation.required', path: ['email'], message: 'Email is required' },
    { code: 'validation.invalid_format', path: ['password'], message: 'Password format invalid' }
  ]),
  HttpStatusCodes.UNPROCESSABLE_ENTITY,
)
```

## 认证中间件规范

### 1. 中间件定义

认证中间件使用 Hono 的 `jwk` 中间件验证 JWT，并验证 Session 是否存在：

```typescript
// apps/api/src/middlewares/auth.ts
import { createMiddleware } from 'hono/factory'
import { jwk } from 'hono/jwk'
import { AuthError, createErrorResponse, ERROR_CODES } from '@/lib/errors'

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json(
      createErrorResponse(ERROR_CODES.AUTH_UNAUTHORIZED),
      HttpStatusCodes.UNAUTHORIZED,
    )
  }

  try {
    await jwtVerifier(c, async () => {
      const payload = (c as any).get('jwtPayload') as {
        id: string
        email: string
        role?: string
        sessionId?: string
      }

      if (!payload) {
        throw new AuthError(ERROR_CODES.AUTH_INVALID_TOKEN, 'Invalid JWT payload')
      }

      // 验证 Session
      if (payload.sessionId) {
        const isValidSession = await validateSession(payload.sessionId, c.req.raw)
        if (!isValidSession) {
          throw new AuthError(ERROR_CODES.AUTH_SESSION_EXPIRED, 'Session not found or expired')
        }
      }
      else {
        throw new AuthError(ERROR_CODES.AUTH_MISSING_SESSION_ID, 'JWT missing sessionId')
      }

      // 设置用户信息到 context
      c.set(APP_BINDING_KEYS.USER_ROLE, userRole)
      c.set(APP_BINDING_KEYS.USER_ID, payload.id)
      c.set(APP_BINDING_KEYS.SESSION_ID, payload.sessionId)
    })

    return await next()
  }
  catch (error) {
    if (error instanceof AuthError) {
      return c.json(
        createErrorResponse(error.code, { message: error.message }),
        HttpStatusCodes.UNAUTHORIZED,
      )
    }
    // 其他错误处理
  }
})
```

**规范**:

- 使用 `AuthError` 抛出认证相关错误
- 在 catch 中使用 `instanceof AuthError` 判断错误类型
- 使用 `createErrorResponse` 创建错误响应
- 验证成功后，将用户信息设置到 context 中

### 2. 权限中间件

使用 `adminOnly` 中间件限制管理员权限：

```typescript
export const adminOnly = createMiddleware<AppBindings>(async (c, next) => {
  if (!isAdmin(c as any)) {
    return c.json(
      createErrorResponse(ERROR_CODES.AUTH_FORBIDDEN),
      HttpStatusCodes.FORBIDDEN,
    )
  }
  await next()
})
```

**规范**:

- 权限检查中间件应在 `authMiddleware` 之后使用
- 权限不足时返回 `AUTH_FORBIDDEN` 错误代码

## 路由开发规范

### 1. 路由模块结构

每个功能模块应包含以下文件：

- `[module].index.ts`: 路由注册文件
- `[module].routes.ts`: 路由定义文件（OpenAPI 规范）
- `[module].handlers.ts`: 请求处理函数

### 2. 路由注册 (`[module].index.ts`)

```typescript
import { createRouter } from '@/lib/create-app'

import * as handlers from './regions.handlers'
import * as routes from './regions.routes'

const router = createRouter()
  .openapi(routes.list, handlers.listRegions)
  .openapi(routes.create, handlers.createRegion)
  .openapi(routes.getOne, handlers.getRegion)
  .openapi(routes.patch, handlers.updateRegion)
  .openapi(routes.remove, handlers.deleteRegion)

export default router
```

**规范**:

- 使用 `createRouter()` 创建路由实例
- 使用 `openapi()` 方法注册路由
- 导出默认路由实例
- 路由定义和处理器分别从对应文件导入

### 3. 路由定义 (`[module].routes.ts`)

```typescript
import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema, IdParamsSchema } from 'stoker/openapi/schemas'

import { adminOnly, authMiddleware } from '@/middlewares/auth'
import { createRegionSchema, regionSchema } from '@/shared/schemas/region'
import { authorizationHeaderSchema } from '@/shared/validators'

const tags = ['Regions']

export const listRegionsRoute = createRoute({
  path: '/regions',
  method: 'get',
  tags,
  middleware: [authMiddleware, adminOnly],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(regionSchema),
      '获取地区列表成功',
    ),
  },
})

export const createRegionsRoute = createRoute({
  path: '/regions',
  method: 'post',
  request: {
    body: jsonContentRequired(createRegionSchema, '创建地区'),
    headers: z.object({
      authorization: authorizationHeaderSchema,
    }),
  },
  tags,
  middleware: [authMiddleware, adminOnly],
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(regionSchema, '创建地区成功'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createRegionSchema),
      '验证错误',
    ),
  },
})

// 导出简写名称
export const list = listRegionsRoute
export const create = createRegionsRoute

// 导出类型
export type ListRoute = typeof listRegionsRoute
export type CreateRoute = typeof createRegionsRoute
```

**规范**:

- 使用 `createRoute()` 定义路由
- 必须定义 `tags` 用于 API 文档分组
- 使用 `middleware` 属性配置中间件（按顺序应用）
- 必须定义所有可能的响应状态码
- 错误响应使用 `createErrorSchema` 定义
- 导出简写名称和类型供处理器使用
- 响应描述使用中文

### 4. 请求处理器 (`[module].handlers.ts`)

```typescript
import type { CreateRoute, GetOneRoute } from './regions.routes'
import type { AppRouteHandler } from '@/lib/types'

import { eq } from 'drizzle-orm'

import * as HttpStatusCodes from 'stoker/http-status-codes'
import { db } from '@/db'
import { regions } from '@/db/schema/regions'

import { createErrorResponse, ERROR_CODES } from '@/lib/errors'

export const listRegions: AppRouteHandler<ListRoute> = async (c) => {
  const allRegions = await db.query.regions.findMany()
  return c.json(allRegions, HttpStatusCodes.OK)
}

export const createRegion: AppRouteHandler<CreateRoute> = async (c) => {
  const newRegion = c.req.valid('json')
  if (!newRegion) {
    return c.json(
      createErrorResponse(ERROR_CODES.VALIDATION_INVALID_UPDATES, {
        message: 'No updates provided',
      }),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    )
  }
  const [insertedRegion] = await db
    .insert(regions)
    .values(newRegion)
    .onConflictDoUpdate({
      target: [regions.sourceId],
      set: { ...newRegion, updatedAt: new Date() },
    })
    .returning()
  return c.json(insertedRegion, HttpStatusCodes.CREATED)
}

export const getRegion: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const region = await db.query.regions.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id)
    },
  })
  if (!region) {
    return c.json(
      createErrorResponse(ERROR_CODES.RESOURCE_NOT_FOUND, {
        path: ['id'],
      }),
      HttpStatusCodes.NOT_FOUND,
    )
  }
  return c.json(region, HttpStatusCodes.OK)
}
```

**规范**:

- 使用 `AppRouteHandler<RouteType>` 类型注解处理器
- 使用 `c.req.valid()` 获取已验证的请求数据
- 使用 `stoker` 提供的 HTTP 状态码常量
- 所有错误响应使用 `createErrorResponse` 创建
- 资源未找到时，使用 `path` 指示错误的字段位置
- 数据库操作使用 Drizzle ORM 的查询构建器

### 5. 在主应用中注册路由

在 `src/app.ts` 中注册新路由：

```typescript
import mails from '@/routes/mail/mails.index'
import regions from '@/routes/regions/regions.index'

const routes = [
  index,
  regions,
  mails,
] as const

routes.forEach((route) => {
  app.route('/', route)
})
```

**规范**:

- 路由按功能模块组织
- 使用 `as const` 确保类型推断
- 使用 `forEach` 注册所有路由

## 数据库开发规范

### 1. Schema 定义

数据库表定义使用 Drizzle ORM：

```typescript
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'

import { timestamps } from '../helpers/columns.helpers'

export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  cn: text('cn'),
  parentId: integer('parent_id').references((): AnyPgColumn => regions.id),
  sourceId: text('source_id').unique(),
  ...timestamps,
})
```

**规范**:

- 表名使用复数形式（snake_case）
- 字段名使用 snake_case
- 主键使用 `serial` 类型
- 外键使用 `references()` 定义
- 使用 `timestamps` helper 添加 `created_at` 和 `updated_at`
- 必填字段使用 `.notNull()`
- 唯一字段使用 `.unique()`

### 2. 数据库查询

优先使用 Drizzle 的关系查询避免 N+1 问题：

```typescript
// 推荐：使用关系查询
const region = await db.query.regions.findFirst({
  where(fields, operators) {
    return operators.eq(fields.id, id)
  },
  with: {
    children: true,
  },
})

// 不推荐：手动 join
const region = await db
  .select()
  .from(regions)
  .leftJoin(children, eq(regions.id, children.parentId))
  .where(eq(regions.id, id))
```

## Schema 开发规范

### 1. 共享 Schema 位置

共享的 Zod Schema 放在 `src/shared/schemas/` 目录下。

### 2. Schema 生成

优先使用 `drizzle-zod` 从数据库模型生成基础 Schema：

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import { regions } from '@/db/schema/regions'

// 从数据库模型生成基础 schema
export const regionSchema = createSelectSchema(regions)

// 创建实体的 schema（排除自动生成的字段）
export const createRegionSchema = createInsertSchema(regions, {
  name: schema => schema.min(1),
  sourceId: schema => schema.regex(/^\w+$/),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// 更新实体的 schema（所有字段可选）
export const updateRegionSchema = createRegionSchema.partial()
```

**规范**:

- 使用 `createSelectSchema()` 生成查询 Schema
- 使用 `createInsertSchema()` 生成创建 Schema
- 创建 Schema 应排除自动生成的字段（id, timestamps）
- 更新 Schema 使用 `.partial()` 使所有字段可选
- 可以在生成后添加额外的验证规则

### 3. Schema 类型导出

为每个 Schema 导出对应的 TypeScript 类型：

```typescript
export type Region = z.infer<typeof regionSchema>
export type CreateRegion = z.infer<typeof createRegionSchema>
export type UpdateRegion = z.infer<typeof updateRegionSchema>
```

## 命名规范

### 1. 变量和函数

- **变量**: camelCase，如 `allRegions`, `newRegion`
- **函数**: camelCase，如 `listRegions`, `createRegion`
- **常量**: UPPER_SNAKE_CASE，如 `ERROR_CODES`, `USER_ROLES`
- **类型**: PascalCase，如 `AppRouteHandler`, `Region`

### 2. 文件和目录

- **文件**: kebab-case，如 `regions.index.ts`, `create-app.ts`
- **目录**: kebab-case，如 `regions/`, `shared/`

### 3. 数据库

- **表名**: 复数形式，snake_case，如 `regions`, `user_profiles`
- **字段名**: snake_case，如 `parent_id`, `created_at`

### 4. API 路径

- **路径**: 复数形式，kebab-case，如 `/regions`, `/user-profiles`
- **嵌套资源**: `/regions/{id}/children`

## 类型安全

### 1. 路由类型

使用 `AppRouteHandler<RouteType>` 确保处理器类型安全：

```typescript
import type { CreateRoute } from './regions.routes'
import type { AppRouteHandler } from '@/lib/types'

export const createRegion: AppRouteHandler<CreateRoute> = async (c) => {
  // c.req.valid() 返回类型安全的数据
  const newRegion = c.req.valid('json') // 类型: CreateRegion
  const { id } = c.req.valid('param') // 类型: { id: number }
}
```

### 2. Schema 类型推导

从 Zod Schema 推导类型：

```typescript
import { z } from 'zod'

const regionSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export type Region = z.infer<typeof regionSchema>
```

### 3. 应用类型导出

在 `src/app.ts` 中导出 `AppType` 供 RPC 客户端使用：

```typescript
export type AppType = typeof app
```

## 环境变量规范

### 1. 环境变量定义

在 `src/env.ts` 中定义和验证环境变量：

```typescript
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(9999),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  API_URL: z.url().optional(),
  RESEND_API_KEY: z.string().min(20).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
})
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === 'production') {
      // 生产环境必需字段验证
    }
  })

export default env!
```

**规范**:

- 使用 Zod Schema 验证环境变量
- 提供默认值（如适用）
- 使用 `superRefine` 进行跨字段验证
- 应用启动时验证，验证失败立即退出
- 导出类型化的环境变量对象

### 2. 环境变量使用

```typescript
import env from '@/env'

const port = env.PORT
```

**规范**:

- 统一从 `@/env` 导入环境变量
- 不要直接使用 `process.env`
- 享受类型安全的环境变量访问

## 测试开发规范

### 1. 测试工具和配置

项目使用 **Vitest** 作为测试框架：

```bash
# 运行测试
bun run test

# 监听模式运行测试
bun run test --watch
```

测试配置文件：`vitest.config.ts`

**规范**:

- 测试文件命名：`[module].test.ts`（与路由文件同目录）
- 测试环境变量：`NODE_ENV=test`
- 使用 `testClient` 创建测试客户端

### 2. 测试文件结构

每个路由模块应包含对应的测试文件：

```
src/routes/tasks/
├── tasks.index.ts      # 路由注册
├── tasks.routes.ts     # 路由定义
├── tasks.handlers.ts   # 请求处理
└── tasks.test.ts       # 测试文件
```

### 3. 测试客户端创建

使用 `createTestApp` 和 `testClient` 创建测试客户端：

```typescript
import { testClient } from 'hono/testing'
import { createTestApp } from '@/lib/create-app'
import router from './tasks.index'

const client = testClient(createTestApp(router))
```

**规范**:

- 使用 `createTestApp` 创建测试应用实例
- 使用 `testClient` 包装应用，获得类型安全的测试客户端
- 测试客户端支持完整的类型推断和自动补全

### 4. 测试环境检查

测试文件开头应检查环境变量：

```typescript
import env from '@/env'

if (env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be \'test\'')
}
```

**规范**:

- 确保测试只在测试环境中运行
- 防止误在生产环境执行测试

### 5. 数据库测试设置

#### 5.1 Neon PostgreSQL 测试配置

项目使用 **Neon PostgreSQL** 作为数据库，测试环境需要：

1. **创建测试环境配置文件**: 创建 `.env.test` 文件（参考 `.env.test.example`）
2. **配置测试数据库连接**: 确保 `DATABASE_URL` 指向测试数据库（**必须使用独立的测试数据库，不要使用生产数据库**）
3. **使用测试基础设施**: 使用 `@/test-helpers` 提供的工具函数

**配置步骤**:

```bash
# 1. 复制示例文件
cp .env.test.example .env.test

# 2. 编辑 .env.test，填入实际的测试数据库连接信息
# DATABASE_URL 必须是 Neon PostgreSQL 连接字符串
# 格式：postgresql://user:password@host/database?sslmode=require
```

**重要提示**:

- `.env.test` 文件不会被提交到 git（已在 `.gitignore` 中配置）
- 测试环境必须使用独立的数据库，避免污染生产数据
- `DATABASE_URL` 必须是有效的 PostgreSQL 连接字符串（以 `postgres://` 或 `postgresql://` 开头）

**测试基础设施**:

项目提供了统一的测试基础设施（`@/test-helpers`），包含：

- **数据库相关** (`db.ts`): 数据库连接、初始化、清理等
- **认证相关** (`auth.ts`): 用户创建、认证 token 获取、角色更新等

```typescript
import {
  cleanupAllTestUsers,
  cleanupTaskTestData,
  cleanupUserTestData,
  createTestUserViaAuth,
  initTestDatabase,
  updateTestUserRoleAndRefreshToken,
} from '@/test-helpers'
```

#### 5.2 数据库初始化

`initTestDatabase()` 函数会自动验证数据库连接，如果连接失败会提供详细的错误提示：

```typescript
import type { TestUser } from '@/test-helpers'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  cleanupTaskTestData,
  cleanupUserTestData,
  createTestUserViaAuth,
  initTestDatabase,
  updateTestUserRoleAndRefreshToken,
  USER_ROLES,
} from '@/test-helpers'

describe('tasks routes', () => {
  let testUser: TestUser | null = null
  let adminUser: TestUser | null = null
  const createdTaskIds: string[] = []

  beforeAll(async () => {
    // 1. 初始化测试数据库 schema
    // initTestDatabase() 会自动：
    // - 验证数据库连接
    // - 如果连接失败，提供详细的错误提示（包括检查清单）
    // - 确保数据库 schema 已初始化
    await initTestDatabase()

    // 2. 通过 Better Auth API 创建测试用户并获取认证 token
    // createTestUserViaAuth 会自动处理：
    // - 如果用户已存在且密码正确，直接登录获取 token
    // - 如果用户不存在或密码错误，先清理旧用户，再创建新用户
    const testUserEmail = `test-user-${Date.now()}@example.com`
    const adminUserEmail = `test-admin-${Date.now()}@example.com`

    testUser = await createTestUserViaAuth(testUserEmail)
    adminUser = await createTestUserViaAuth(adminUserEmail)

    // 3. 更新管理员用户的角色并重新获取 token
    // 注意：必须重新获取 token，因为 JWT token 中包含角色信息
    adminUser = await updateTestUserRoleAndRefreshToken(adminUser, USER_ROLES.ADMIN)
  })

  beforeEach(() => {
    // 每个测试前重置状态
    createdTaskIds.length = 0
  })

  afterEach(async () => {
    // 每个测试后清理创建的任务
    if (createdTaskIds.length > 0) {
      await cleanupTaskTestData(createdTaskIds)
      createdTaskIds.length = 0
    }
  })

  afterAll(async () => {
    // 所有测试完成后，清理测试用户及其所有相关数据
    if (testUser) {
      await cleanupUserTestData(testUser.userId)
    }
    if (adminUser) {
      await cleanupUserTestData(adminUser.userId)
    }
  })
})
```

**规范**:

- `beforeAll`: 初始化数据库 schema 并通过 Better Auth API 创建测试用户
- `beforeEach`: 重置测试状态（如清空任务 ID 列表）
- `afterEach`: 清理当前测试创建的数据
- `afterAll`: 清理所有测试用户及其所有相关数据
- 使用 `createTestUserViaAuth` 创建用户，确保密码正确加密
- 更新角色后必须使用 `updateTestUserRoleAndRefreshToken` 重新获取 token

**数据库连接错误处理**:

如果 `initTestDatabase()` 失败，会提供详细的错误提示，包括：

- 数据库服务是否启动
- `.env.test` 文件是否存在
- `DATABASE_URL` 环境变量是否设置
- 数据库连接字符串是否有效

**常见问题排查**:

1. **连接失败**: 检查 Neon 数据库服务是否正常运行，确保网络连接正常
2. **环境变量未设置**: 确保 `.env.test` 文件存在且包含 `DATABASE_URL`
3. **连接字符串格式错误**: 确保 `DATABASE_URL` 格式为 `postgresql://user:password@host/database?sslmode=require`
4. **并发测试问题**: 如果使用 `bun test:ui` 运行并发测试，确保 `vitest.config.ts` 中配置了单线程执行（`pool: 'threads'`, `poolOptions: { threads: { singleThread: true } }`）

#### 5.3 测试数据清理策略

**方案 1: 按测试清理（推荐）**

每个测试后清理自己创建的数据：

```typescript
const createdTaskIds: string[] = [];

it("创建任务成功", async () => {
  const response = await client.tasks.$post({...});
  if (response.status === HttpStatusCodes.CREATED) {
    const json = await response.json();
    createdTaskIds.push(json.id); // 记录任务 ID
  }
});

afterEach(async () => {
  // 清理当前测试创建的任务
  if (createdTaskIds.length > 0) {
    await cleanupTaskTestData(createdTaskIds);
    createdTaskIds.length = 0;
  }
});
```

**方案 2: 批量清理测试用户**

清理所有测试用户及其相关数据：

```typescript
import { cleanupAllTestUsers } from '@/test-helpers'

afterAll(async () => {
  // 清理所有以 TEST_USER_ID_PREFIX 开头的用户
  await cleanupAllTestUsers()
})
```

**方案 3: 清理所有测试数据**

清理所有表的数据（谨慎使用）：

```typescript
import { cleanupTestData } from '@/test-helpers'

afterAll(async () => {
  await cleanupTestData()
})
```

**规范**:

- 优先使用方案 1（按测试清理），更精确、更安全
- 测试用户通过 Better Auth API 创建，确保密码正确加密
- 确保测试数据不会污染其他测试或生产数据

#### 5.4 测试用户创建

**推荐方式：通过 Better Auth API 创建用户**

使用 `createTestUserViaAuth` 创建测试用户，这是推荐的方式，因为密码会被正确加密：

```typescript
import { createTestUserViaAuth } from '@/test-helpers'

beforeAll(async () => {
  const testUserEmail = `test-user-${Date.now()}@example.com`
  const testUser = await createTestUserViaAuth(testUserEmail)
  // testUser 包含: { userId, email, token, role }
})
```

**更新用户角色**

如果需要更新用户角色（如将普通用户升级为管理员），必须使用 `updateTestUserRoleAndRefreshToken`：

```typescript
import { updateTestUserRoleAndRefreshToken, USER_ROLES } from '@/test-helpers'

// 更新角色并重新获取 token（新 token 包含更新后的角色）
adminUser = await updateTestUserRoleAndRefreshToken(adminUser, USER_ROLES.ADMIN)
```

**重要提示**:

- 必须使用 `updateTestUserRoleAndRefreshToken` 而不是直接更新数据库
- 因为 `authMiddleware` 从 JWT token 的 `payload.role` 读取角色，而不是从数据库
- 更新角色后必须重新登录获取新的 token，新 token 才会包含更新后的角色

#### 5.5 测试数据隔离

确保测试数据与生产数据隔离：

1. **使用独立的测试数据库**: 在 `.env.test` 中配置 `DATABASE_URL` 指向测试数据库
2. **使用测试用户前缀**: 所有测试用户 ID 以 `TEST_USER_ID_PREFIX` 开头
3. **及时清理**: 每个测试后清理创建的数据

**规范**:

- 测试环境必须使用独立的数据库
- 不要在生产数据库上运行测试
- 使用环境变量区分测试和生产数据库连接

### 6. 认证测试

#### 6.1 创建认证头部

使用 `@/test-helpers` 提供的辅助函数创建认证头部：

```typescript
import {
  createAdminAuthHeader,
  createAuthHeader,
  createTestUserViaAuth,
} from '@/test-helpers'

// 在 beforeAll 中创建测试用户
let testUser: TestUser | null = null
let adminUser: TestUser | null = null

beforeAll(async () => {
  testUser = await createTestUserViaAuth(`test-user-${Date.now()}@example.com`)
  adminUser = await createTestUserViaAuth(`test-admin-${Date.now()}@example.com`)
})

// 在测试中使用
it('查询任务列表', async () => {
  const response = await client.tasks.$get({
    header: {
      authorization: createAuthHeader(testUser?.token ?? null),
    },
  })
})
```

**规范**:

- 使用 `createTestUserViaAuth` 创建测试用户并获取有效的 JWT token
- 使用 `createAuthHeader` 创建普通用户的认证头部
- 使用 `createAdminAuthHeader` 创建管理员的认证头部
- token 必须来自真实的 Better Auth API，不能使用占位符

#### 6.2 认证测试用例

```typescript
it('未授权访问返回 401', async () => {
  const response = await client.tasks.$get()

  expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED)
  if (response.status === HttpStatusCodes.UNAUTHORIZED) {
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error.issues[0].code).toBe(ERROR_CODES.AUTH_UNAUTHORIZED)
  }
})

it('普通用户访问管理员接口返回 403', async () => {
  const response = await client.admin.tasks.$get({
    header: {
      authorization: createAuthHeader(testUser?.token ?? null),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.FORBIDDEN)
})

it('管理员访问管理员接口成功', async () => {
  const response = await client.admin.tasks.$get({
    header: {
      authorization: createAdminAuthHeader(adminUser?.token ?? null),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.OK)
})
```

**规范**:

- 测试未授权访问（401）
- 测试权限不足（403）
- 验证错误响应符合 `createErrorSchema` 结构

### 7. 请求验证测试

#### 7.1 验证必填字段

```typescript
it('验证请求体 - 缺少必填字段', async () => {
  const response = await client.tasks.$post({
    json: {
      // 缺少必填字段
    } as any,
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY)
  if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error.issues).toBeInstanceOf(Array)
    expect(json.error.issues.length).toBeGreaterThan(0)
  }
})
```

#### 7.2 验证字段格式

```typescript
it('验证请求体 - type 字段无效', async () => {
  const response = await client.tasks.$post({
    json: {
      type: 'invalid_type',
      userLanguage: 'zh',
      targetLanguage: 'en',
      taskData: {},
    },
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY)
  if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
    const json = await response.json()
    const typeError = json.error.issues.find((issue: any) => issue.path.includes('type'))
    expect(typeError).toBeDefined()
  }
})
```

#### 7.3 验证参数格式

```typescript
it('验证 id 参数 - 无效的 UUID 格式', async () => {
  const response = await client.tasks[':id'].$get({
    param: {
      id: 'invalid-id',
    },
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY)
  if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
    const json = await response.json()
    const idError = json.error.issues.find((issue: any) => issue.path.includes('id'))
    expect(idError).toBeDefined()
  }
})
```

**规范**:

- 测试所有必填字段的验证
- 测试字段格式验证（枚举、类型等）
- 测试参数格式验证（UUID、数字等）
- 验证错误响应中的 `path` 字段正确指示错误位置

### 8. 资源操作测试

#### 8.1 创建资源

```typescript
it('创建任务成功', async () => {
  const taskData = {
    restaurantName: '测试餐厅',
    restaurantPhone: '+81-3-1234-5678',
    bookingDate: '2024-12-25',
    bookingTime: '18:00',
    partySize: 4,
  }

  const response = await client.tasks.$post({
    json: {
      type: 'restaurant_booking',
      userLanguage: 'zh',
      targetLanguage: 'ja',
      taskData,
    },
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.CREATED)
  if (response.status === HttpStatusCodes.CREATED) {
    const json = await response.json()
    expect(json.type).toBe('restaurant_booking')
    expect(json.status).toBe('pending')
    expect(json.taskData).toEqual(taskData)
    expectTypeOf(json.id).toBeString()
  }
})
```

#### 8.2 查询资源

```typescript
it('查询任务列表成功', async () => {
  const response = await client.tasks.$get({
    header: {
      authorization: createAuthHeader(testUser?.token ?? null),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.OK)
  if (response.status === HttpStatusCodes.OK) {
    const json = await response.json()
    // 分页响应格式：{ data, pagination: { total, pageSize, currentPage, totalPages } }
    expect(Array.isArray(json.data)).toBe(true)
    expect(typeof json.pagination.total).toBe('number')
    expect(typeof json.pagination.currentPage).toBe('number')
    expect(typeof json.pagination.pageSize).toBe('number')
    expect(typeof json.pagination.totalPages).toBe('number')
  }
})
```

**重要提示**:

- 分页响应使用嵌套结构：`{ data, pagination: { total, pageSize, currentPage, totalPages } }`
- 不要期望扁平结构（如 `{ data, total, page, pageSize }`）
- 使用 `json.pagination.total` 而不是 `json.total`
- 使用 `json.pagination.currentPage` 而不是 `json.page`

#### 8.3 资源不存在

```typescript
it('任务不存在返回 404', async () => {
  const nonExistentId = '00000000-0000-0000-0000-000000000000'
  const response = await client.tasks[':id'].$get({
    param: {
      id: nonExistentId,
    },
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.NOT_FOUND)
  if (response.status === HttpStatusCodes.NOT_FOUND) {
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error.issues[0].code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND)
  }
})
```

**规范**:

- 测试成功创建资源（201）
- 测试成功查询资源（200）
- 测试资源不存在（404）
- 使用 `expectTypeOf` 验证响应类型
- 验证响应数据结构符合预期

### 9. 分页和筛选测试

```typescript
it('使用分页参数查询', async () => {
  const response = await client.tasks.$get({
    query: {
      page: 1,
      pageSize: 10,
    },
    header: {
      authorization: createAuthHeader(testUser?.token ?? null),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.OK)
  if (response.status === HttpStatusCodes.OK) {
    const json = await response.json()
    // 分页响应格式：{ data, pagination: { total, pageSize, currentPage, totalPages } }
    expect(json.pagination.currentPage).toBe(1)
    expect(json.pagination.pageSize).toBe(10)
  }
})

it('使用筛选条件查询', async () => {
  const response = await client.tasks.$get({
    query: {
      type: 'restaurant_booking',
      status: 'pending',
    },
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.OK)
  if (response.status === HttpStatusCodes.OK) {
    const json = await response.json()
    expect(json.data.every((task: any) => task.type === 'restaurant_booking')).toBe(true)
  }
})
```

**规范**:

- 测试分页参数（page, pageSize）
- 测试筛选条件（type, status 等）
- 验证筛选结果符合预期

### 10. 错误响应验证

所有错误响应必须符合 `createErrorSchema` 结构：

```typescript
it('验证错误响应结构', async () => {
  const response = await client.tasks.$post({
    json: {} as any,
    header: {
      authorization: createAuthHeader(),
    },
  })

  expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY)
  if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
    const json = await response.json()
    // 验证错误响应结构
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
    expect(json.error.issues).toBeInstanceOf(Array)
    expect(json.error.issues[0].code).toBeDefined()
    expect(json.error.issues[0].path).toBeInstanceOf(Array)
    expect(json.error.name).toBeDefined()
  }
})
```

**规范**:

- 验证 `success: false`
- 验证 `error.issues` 数组结构
- 验证错误代码（`code`）符合 `ERROR_CODES`
- 验证错误路径（`path`）正确指示错误位置
- 验证错误类型名称（`name`）

### 11. 测试组织

使用 `describe` 和 `it` 组织测试：

```typescript
describe('tasks routes', () => {
  describe('POST /tasks - 创建任务', () => {
    it('验证请求体 - 缺少必填字段', async () => {
      // ...
    })

    it('创建任务成功', async () => {
      // ...
    })
  })

  describe('GET /tasks - 查询任务列表', () => {
    it('未授权访问返回 401', async () => {
      // ...
    })

    it('查询任务列表成功', async () => {
      // ...
    })
  })
})
```

**规范**:

- 使用 `describe` 按路由分组测试
- 使用 `it` 描述具体的测试场景
- 测试描述使用中文，清晰说明测试内容
- 按 HTTP 方法和路径组织测试用例

### 12. 测试辅助函数

创建可复用的测试辅助函数：

```typescript
// 创建测试用户
function createTestUser(userId: string, role: string = USER_ROLES.USER) {
  return {
    id: userId,
    email: `test-${userId}@example.com`,
    role,
  }
}

// 创建测试任务数据
function createTestTaskData(type: 'restaurant_booking' | 'hospital_appointment') {
  if (type === 'restaurant_booking') {
    return {
      restaurantName: '测试餐厅',
      restaurantPhone: '+81-3-1234-5678',
      bookingDate: '2024-12-25',
      bookingTime: '18:00',
      partySize: 4,
    }
  }
  return {
    hospitalName: '测试医院',
    hospitalPhone: '+81-3-1234-5678',
    preferredDate: '2024-12-25',
    preferredTime: '10:00',
  }
}
```

**规范**:

- 提取可复用的测试辅助函数
- 使用有意义的函数名和参数
- 辅助函数应返回类型安全的数据

### 13. 测试最佳实践

1. **测试隔离**: 每个测试应该独立，不依赖其他测试的执行顺序
2. **测试清理**: 使用 `beforeEach` 和 `afterEach` 清理测试数据
3. **类型安全**: 使用 `expectTypeOf` 验证类型，利用 TypeScript 类型系统
4. **错误覆盖**: 测试所有错误场景（401, 403, 404, 422 等）
5. **边界测试**: 测试边界条件（空数组、最大值、最小值等）
6. **真实数据**: 使用接近真实场景的测试数据

### 14. Mock 策略最佳实践

#### 14.1 原则：最小化 Mock，最大化真实性

**核心原则**：

- ✅ **只 Mock 外部服务**：如第三方 API、外部 SDK（LiveKit、邮件服务等）
- ❌ **不要 Mock 内部模块**：如 `@/env`、`@/middlewares/*`、业务逻辑模块
- ✅ **使用真实实现**：让真实的代码运行，确保测试覆盖真实行为

#### 14.2 环境变量处理

**❌ 错误做法**：Mock `@/env` 模块

```typescript
// 不推荐：Mock 环境变量模块
vi.mock('@/env', () => ({
  default: {
    NODE_ENV: 'test',
    AGENT_BEARER_TOKENS: 'test-token',
    // ...
  },
}))
```

**✅ 正确做法**：直接使用真实的 `env` 模块，从 `.env.test` 读取

```typescript
import env from '@/env'

// 验证测试环境配置
if (env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be \'test\'')
}

// 从环境变量中获取测试用的 token（从 .env.test 读取）
const TEST_AGENT_TOKEN_VALUE = env.AGENT_BEARER_TOKENS
  ?.split(',')
  .map(t => t.trim())
  .filter(Boolean)[0]

if (!TEST_AGENT_TOKEN_VALUE) {
  throw new Error('AGENT_BEARER_TOKENS in .env.test must contain at least one valid token')
}
```

**优势**：

- 测试使用真实的配置加载逻辑
- 环境变量统一在 `.env.test` 中管理
- 更接近生产环境的行为

#### 14.3 中间件和业务逻辑

**❌ 错误做法**：Mock 内部中间件

```typescript
// 不推荐：Mock 认证中间件
vi.mock('@/middlewares/agent-auth', () => {
  return {
    agentAuth: createMiddleware(async (c, next) => {
      // mock 实现
    }),
  }
})
```

**✅ 正确做法**：让真实的中间件运行，通过环境变量控制行为

```typescript
// 不需要 mock，真实的 agent-auth.ts 会从 env.AGENT_BEARER_TOKENS 读取 token
// 只需要在 .env.test 中配置正确的 token 即可
```

**优势**：

- 测试覆盖真实的认证逻辑
- 中间件的行为变更会自动反映在测试中
- 减少维护成本

#### 14.4 外部服务 Mock

**✅ 正确做法**：只 Mock 外部服务

```typescript
// Mock LiveKit SDK（外部服务，测试不应该真的调用）
const mockCreateRoomAndDispatchAgent = vi.fn().mockResolvedValue({
  roomName: 'task-test-task-id',
  roomSid: 'RM_test_room_sid',
  dispatchId: 'dispatch_test_id',
})

vi.mock('@/lib/livekit', () => {
  return {
    createRoomAndDispatchAgent: mockCreateRoomAndDispatchAgent,
  }
})
```

**何时 Mock 外部服务**：

- 第三方 API（如邮件服务、支付服务）
- 外部 SDK（如 LiveKit、云存储服务）
- 网络请求（如果使用 MSW，在网络层拦截）

#### 14.5 参考现有测试

**最佳实践**：参考已有的测试文件模式

在编写新测试时，参考项目中已有的测试文件（如 `tasks.test.ts`）：

- 查看它们如何处理环境变量
- 查看它们如何组织 Mock
- 保持代码风格和模式一致

**示例**：参考 `tasks.test.ts` 的模式

```typescript
// tasks.test.ts 的模式（推荐）
import env from '@/env'

// 验证测试环境配置
if (env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be \'test\'')
}

// 直接使用真实的 env，不 mock
// 只 mock 外部服务（如 LiveKit）
```

#### 14.6 Mock 检查清单

在编写测试时，检查以下问题：

- [ ] **是否真的需要 Mock？** 如果内部模块，优先使用真实实现
- [ ] **Mock 的是外部服务吗？** 只 Mock 第三方 API、外部 SDK
- [ ] **环境变量是否在 `.env.test` 中配置？** 不要 Mock `@/env`，直接使用
- [ ] **是否参考了现有测试？** 保持与项目其他测试的一致性
- [ ] **测试是否覆盖真实行为？** 确保测试验证的是真实代码路径

#### 14.7 常见错误和修复

**错误 1：过度 Mock**

```typescript
// ❌ 错误：Mock 了太多内部模块
vi.mock('@/env')
vi.mock('@/middlewares/agent-auth')
vi.mock('@/lib/errors')
```

```typescript
// ✅ 正确：只 Mock 外部服务
vi.mock('@/lib/livekit') // 外部 SDK
```

**错误 2：Mock 环境变量模块**

```typescript
// ❌ 错误：Mock @/env
vi.mock('@/env', () => ({
  default: { AGENT_BEARER_TOKENS: 'test-token' },
}))
```

```typescript
// ✅ 正确：在 .env.test 中配置，直接使用真实 env
// .env.test: AGENT_BEARER_TOKENS=test-token
import env from '@/env'

const token = env.AGENT_BEARER_TOKENS
```

**错误 3：Mock 内部中间件**

```typescript
// ❌ 错误：Mock 认证中间件
vi.mock('@/middlewares/agent-auth', () => ({
  agentAuth: mockMiddleware,
}))
```

```typescript
// ✅ 正确：让真实中间件运行，通过环境变量控制
// 在 .env.test 中配置正确的 token，真实的 agent-auth 会读取
```

## 其他最佳实践

### 1. 包管理

项目使用 **Bun** 作为包管理器和运行时：

```bash
# 安装依赖
bun install

# 添加依赖
bun add <package-name>

# 添加开发依赖
bun add -d <package-name>

# 移除依赖
bun remove <package-name>
```

**规范**:

- 统一使用 `bun` 命令，不要使用 `npm`、`pnpm` 或 `yarn`
- 依赖安装后会自动更新 `bun.lock` 文件
- 提交代码时确保包含 `bun.lock` 文件

### 2. 代码格式化

项目使用 ESLint 进行代码检查：

- **缩进**: 2 个空格
- **分号**: 根据配置（通常不使用）
- **引号**: 使用双引号
- **行尾**: LF

运行格式化：

```bash
bun run lint
bun run lint:fix
```

### 3. 开发命令

```bash
# 本地开发（Node.js 环境，支持热重载）
bun run dev

# Cloudflare Workers 开发
bun run dev:cloudflare

# 类型检查
bun run typecheck

# 运行测试
bun run test

# 构建项目
bun run build

# 启动生产服务器
bun run start
```

### 2. API 文档

- 所有路由必须定义完整的 OpenAPI 规范
- 使用有意义的 tags 分组相关路由
- 响应描述使用中文
- 访问 `/reference` 查看交互式 API 文档

### 3. 代码复用

- 使用 `stoker` 减少样板代码
- 共享的 Schema 放在 `shared/schemas/`
- 通用的辅助函数放在 `lib/`
- 数据库辅助函数放在 `db/helpers/`

### 4. 性能优化

- 使用 Drizzle 的关系查询避免 N+1 问题
- 合理使用数据库索引
- Better Auth 的 Cookie Cache 已自动优化 Session 查询

## 参考资源

- [Hono 文档](https://hono.dev/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Zod 文档](https://zod.dev/)
- [Better Auth 文档](https://www.better-auth.com/)
- [OpenAPI 规范](https://swagger.io/specification/)
- [Stoker 文档](https://www.npmjs.com/package/stoker)
