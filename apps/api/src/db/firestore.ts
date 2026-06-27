import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Firestore } from '@google-cloud/firestore'
import env from '@/env'

const MOCK_DB_FILE = process.platform === 'win32'
  ? path.join(os.tmpdir(), 'aquablue-mock-db.json')
  : '/tmp/aquablue-mock-db.json'

function loadMockDb(): Record<string, Map<string, any>> {
  if (fs.existsSync(MOCK_DB_FILE)) {
    try {
      const content = fs.readFileSync(MOCK_DB_FILE, 'utf8')
      const parsed = JSON.parse(content)
      const store: Record<string, Map<string, any>> = {}
      for (const [colName, colData] of Object.entries(parsed)) {
        store[colName] = new Map(Object.entries(colData as any))
      }
      return store
    }
    catch (e) {
      console.warn('⚠️ Warning: Failed to parse mock db file:', e)
    }
  }
  return {}
}

function saveMockDb(store: Record<string, Map<string, any>>) {
  try {
    const raw: Record<string, any> = {}
    for (const [colName, map] of Object.entries(store)) {
      raw[colName] = Object.fromEntries(map.entries())
    }
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(raw, null, 2), 'utf8')
  }
  catch (e) {
    console.error('❌ Error: Failed to save mock db file:', e)
  }
}

// In-memory Mock Firestore implementation for failover/demo environments when local emulator is not active.
class MockCollection {
  name: string
  static store: Record<string, Map<string, any>> = {}

  constructor(name: string) {
    this.name = name
    // Load dynamically on each constructor call to sync data across processes
    MockCollection.store = {
      ...MockCollection.store,
      ...loadMockDb(),
    }

    if (!MockCollection.store[name]) {
      MockCollection.store[name] = new Map()

      // Seed mock applets so that the workspace dashboard contains demo workflows out-of-the-box
      if (name === 'applets') {
        const defaultApplets = [
          {
            id: 'applet_demo_1',
            userId: 'default_user',
            name: 'Slack Notification Automator',
            description: 'Automatically query GitHub issues and post summaries to Slack daily.',
            icon: 'Sparkles',
            color: 'blue',
            gcsPath: 'gs://agent-bucket/default_user/applet_applet_demo_1/main.py',
            dependencies: ['requests', 'slack-sdk'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'applet_demo_2',
            userId: 'default_user',
            name: 'Database Backup Sync',
            description: 'Backup PostgreSQL database to AWS S3 storage with encryption.',
            icon: 'FileCode',
            color: 'green',
            gcsPath: 'gs://agent-bucket/default_user/applet_applet_demo_2/main.py',
            dependencies: ['boto3', 'psycopg2'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
        // Ensure GCS files exist for mock applets
        const fs = require('node:fs')
        const os = require('node:os')
        const path = require('node:path')
        const MOCK_GCS_DIR = process.platform === 'win32'
          ? path.join(os.tmpdir(), 'aquablue-gcs-mock')
          : '/tmp/aquablue-gcs-mock'

        defaultApplets.forEach((app) => {
          MockCollection.store[name].set(app.id, app)
          // Pre-seed mock python scripts
          const localPath = path.join(MOCK_GCS_DIR, app.userId, `applet_${app.id}`, 'main.py')
          fs.mkdirSync(path.dirname(localPath), { recursive: true })
          fs.writeFileSync(localPath, `print("Running ${app.name}...")\nprint("Done!")`, 'utf8')
        })
        saveMockDb(MockCollection.store)
      }
      else if (name === 'session_events') {
        const defaultEvents = [
          // session_gcp_clean
          {
            id: 'event_gcp_1',
            sessionId: 'session_gcp_clean',
            role: 'user',
            author: 'user',
            content: '请帮我写一个自动清理 GCP Cloud Run 闲置容器和旧镜像的 Python 脚本，并在沙盒中运行测试。',
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            id: 'event_gcp_2',
            sessionId: 'session_gcp_clean',
            role: 'model',
            author: 'model',
            content: `好的，我为你生成了一个清理闲置 GCP Cloud Run 容器和 Container Registry 旧镜像的脚本 \`cleanup_spam.py\`。

我已准备在沙盒中进行 Dry-Run 模拟运行。以下是该脚本的主要逻辑：
\`\`\`python
import os
import sys

def main():
    print("Connecting to GCP Cloud Resource Manager...")
    print("Scanning Cloud Run services...")
    # Simulate dry-run detection
    print("Found 3 idle services older than 30 days:")
    print(" - service-temp-v1 (idle since 2026-05-10)")
    print(" - test-api-dev (idle since 2026-05-12)")
    print(" - demo-web-pr-12 (idle since 2026-05-15)")
    print("Success")

if __name__ == "__main__":
    main()
\`\`\`
我已经准备好在沙盒中运行该脚本的干运行测试，请确认。`,
            createdAt: new Date(Date.now() - 3600000 * 2 + 5000),
          },
          {
            id: 'event_gcp_3',
            sessionId: 'session_gcp_clean',
            role: 'user',
            author: 'user',
            content: 'Confirm the action and compile this python script into a static Applet.',
            createdAt: new Date(Date.now() - 3600000 * 2 + 10000),
          },
          {
            id: 'event_gcp_4',
            sessionId: 'session_gcp_clean',
            role: 'model',
            author: 'model',
            content: '好的，我已成功将该脚本编译并打包为 Applet 容器服务：**Slack Notification Automator**，并生成了生产环境的入口。你可以在 Active Applets 列表中找到并运行它。',
            createdAt: new Date(Date.now() - 3600000 * 2 + 15000),
          },
          // session_firebase_deploy
          {
            id: 'event_fb_1',
            sessionId: 'session_firebase_deploy',
            role: 'user',
            author: 'user',
            content: '我需要部署一套新的 Firebase Firestore 安全规则，限制仅允许登录用户读写 \`/users/{userId}\` 下的文档，并且限制写操作的大小不超过 1KB。',
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            id: 'event_fb_2',
            sessionId: 'session_firebase_deploy',
            role: 'model',
            author: 'model',
            content: `好的，我们可以通过声明式的 Firebase Security Rules 来实现。我已经设计好了以下安全规则配置：
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId
                        && request.resource.data.size() < 1024;
    }
  }
}
\`\`\`
在正式部署到 production 前，我们应该先用 Firebase Emulator 对该规则进行本地单元测试验证。

我已在本地 sandbox 准备好测试套件，是否直接执行 \`firebase deploy --only firestore:rules\` 的 dry-run？`,
            createdAt: new Date(Date.now() - 3600000 + 5000),
          },
          {
            id: 'event_fb_3',
            sessionId: 'session_firebase_deploy',
            role: 'user',
            author: 'user',
            content: '直接在沙盒中跑一下测试规则看看。',
            createdAt: new Date(Date.now() - 3600000 + 10000),
          },
          {
            id: 'event_fb_4',
            sessionId: 'session_firebase_deploy',
            role: 'model',
            author: 'model',
            content: '在沙盒中运行 \`firebase emulators:exec "npm run test:rules"\` 测试成功！全部 5 个测试用例均已通过。规则限制对 \`/users/{userId}\` 的非所有者越权写入已被成功拦截。现在可以直接将其编译为生产环境的安全规则 Applet 自动触发器。',
            createdAt: new Date(Date.now() - 3600000 + 15000),
          },
        ]
        defaultEvents.forEach((event) => {
          MockCollection.store[name].set(event.id, event)
        })
        saveMockDb(MockCollection.store)
      }
    }
  }

  doc(id?: string) {
    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    return new MockDocumentRef(this.name, docId)
  }

  where(field: string, op: string, value: any) {
    return new MockQuery(this.name, (data: any) => {
      if (op === '==')
        return data[field] === value
      return true
    })
  }

  async get() {
    const docs = Array.from(MockCollection.store[this.name].values()).map(
      data => new MockDocumentSnapshot(data.id, true, data),
    )
    return new MockQuerySnapshot(docs)
  }

  async add(data: any) {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const docData = { ...data, id }
    MockCollection.store[this.name].set(id, docData)
    saveMockDb(MockCollection.store)
    return new MockDocumentRef(this.name, id)
  }
}

class MockDocumentRef {
  collectionName: string
  id: string

  constructor(collectionName: string, id: string) {
    this.collectionName = collectionName
    this.id = id
  }

  async get() {
    const data = MockCollection.store[this.collectionName].get(this.id)
    return new MockDocumentSnapshot(this.id, !!data, data)
  }

  async set(data: any) {
    const current = MockCollection.store[this.collectionName].get(this.id) || {}
    MockCollection.store[this.collectionName].set(this.id, { ...current, ...data, id: this.id })
    saveMockDb(MockCollection.store)
  }

  async update(data: any) {
    const current = MockCollection.store[this.collectionName].get(this.id) || {}
    MockCollection.store[this.collectionName].set(this.id, { ...current, ...data })
    saveMockDb(MockCollection.store)
  }

  async delete() {
    MockCollection.store[this.collectionName].delete(this.id)
    saveMockDb(MockCollection.store)
  }
}

class MockDocumentSnapshot {
  id: string
  exists: boolean
  private _data: any

  constructor(id: string, exists: boolean, data: any) {
    this.id = id
    this.exists = exists
    this._data = data
  }

  data() {
    return this._data
  }
}

class MockQuery {
  collectionName: string
  private predicate: (data: any) => boolean

  constructor(collectionName: string, predicate: (data: any) => boolean) {
    this.collectionName = collectionName
    this.predicate = predicate
  }

  where(field: string, op: string, value: any) {
    const oldPredicate = this.predicate
    return new MockQuery(this.collectionName, (data: any) => {
      if (!oldPredicate(data))
        return false
      if (op === '==')
        return data[field] === value
      return true
    })
  }

  async get() {
    const all = Array.from(MockCollection.store[this.collectionName].values())
    const filtered = all.filter(this.predicate)
    const docs = filtered.map(data => new MockDocumentSnapshot(data.id, true, data))
    return new MockQuerySnapshot(docs)
  }
}

class MockQuerySnapshot {
  docs: MockDocumentSnapshot[]

  constructor(docs: MockDocumentSnapshot[]) {
    this.docs = docs
  }
}

class MockFirestore {
  collection(name: string) {
    return new MockCollection(name)
  }
}

let _firestore: any = null
let _isMock = false

export function getFirestore(): Firestore {
  if (!_firestore) {
    const isTest = env.NODE_ENV === 'test'
    const isDev = env.NODE_ENV === 'development'

    if (!isTest && !isDev) {
      // Forcefully remove emulator env pollution in production to avoid SDK internal redirect to localhost
      delete process.env.FIRESTORE_EMULATOR_HOST
    }

    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081'

    // Detect if the port is open and we should connect to the actual emulator
    let useEmulator = false
    if (isTest || isDev || process.env.FIRESTORE_EMULATOR_HOST) {
      const [host, port] = emulatorHost.split(':')
      try {
        execSync(`nc -z -w 1 ${host || '127.0.0.1'} ${port || '8081'}`, { stdio: 'ignore' })
        useEmulator = true
      }
      catch {
        console.warn(`⚠️ Firestore Emulator is not running at ${emulatorHost}. Falling back to in-memory MockFirestore.`)
        useEmulator = false
      }
    }

    if (useEmulator) {
      _firestore = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'aquablue-test-project',
        host: emulatorHost,
        ssl: false,
      })
      _isMock = false
    }
    else if (isTest || isDev) {
      _firestore = new MockFirestore()
      _isMock = true
    }
    else {
      // In production, load GCP Application Default Credentials (ADC) automatically
      _firestore = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gemini-hackathon',
      })
      _isMock = false
    }
  }
  return _firestore
}

export const firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    return getFirestore()[prop as keyof Firestore]
  },
})

export default firestore
