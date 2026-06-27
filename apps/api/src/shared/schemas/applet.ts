import { z } from 'zod'

export const appletSchema = z.object({
  id: z.string().openapi({ example: 'applet_123' }),
  userId: z.string().openapi({ example: 'default_user' }),
  name: z.string().openapi({ example: 'Clean Spam Emails' }),
  description: z.string().optional().openapi({ example: 'Cleans old spams from Inbox' }),
  icon: z.string().openapi({ example: 'mail-minus' }),
  color: z.string().openapi({ example: 'rose' }),
  gcsPath: z.string().openapi({ example: 'gs://agent-bucket/default_user/applet_123/main.py' }),
  dependencies: z.array(z.string()).openapi({ example: ['google-api-python-client'] }),
  createdAt: z.string().openapi({ example: '2026-06-06T09:00:00.000Z' }),
  updatedAt: z.string().openapi({ example: '2026-06-06T09:00:00.000Z' }),
})

export const createAppletSchema = z.object({
  name: z.string().min(1).openapi({ example: 'Clean Spam Emails' }),
  description: z.string().optional().openapi({ example: 'Cleans old spams from Inbox' }),
  icon: z.string().min(1).openapi({ example: 'mail-minus' }),
  color: z.string().min(1).openapi({ example: 'rose' }),
  scriptContent: z.string().min(1).openapi({ example: 'print("Hello Sandbox")' }),
  dependencies: z.array(z.string()).default([]).openapi({ example: [] }),
})

export type Applet = z.infer<typeof appletSchema>
export type CreateApplet = z.infer<typeof createAppletSchema>
