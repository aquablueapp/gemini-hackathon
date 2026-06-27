import type { Timestamp } from '@google-cloud/firestore'

export interface FirestoreSession {
  id: string
  userId: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  state: Record<string, unknown> // State of the ADK Session
}

export interface FirestoreSessionEvent {
  id: string
  sessionId: string
  role: 'user' | 'model' | 'system'
  content: string
  author: string
  createdAt: Timestamp | Date
}

export interface FirestoreApplet {
  id: string
  userId: string
  name: string
  description?: string
  icon: string // Lucide icon identifier (e.g. "mail-minus")
  color: string // Theme color name (e.g. "rose")
  gcsPath: string // e.g. "gs://agent-bucket/default_user/applet_123/main.py"
  dependencies: string[] // PEP 723 dependency names
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface FirestoreAppletRun {
  id: string
  appId: string
  status: 'running' | 'success' | 'failed'
  exitCode?: number
  startedAt: Timestamp | Date
  finishedAt?: Timestamp | Date
  errorSummary?: string
}

export interface FirestoreUserCredential {
  userId: string
  service: string // e.g. "gmail", "polymarket"
  encryptedValue: string // AES-256-GCM cipher
  iv: string
  tag: string
  updatedAt: Timestamp | Date
}
