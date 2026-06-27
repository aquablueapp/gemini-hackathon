import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

// Import local services using relative paths to avoid tsconfig-paths resolution issue
import { getFirestore } from '../src/db/firestore'
import { saveCredential } from '../src/services/credentials'

// Load environment variables from .env
expand(config({
  path: path.resolve(process.cwd(), '.env'),
}))

const firestore = getFirestore()

// Demo scripts content to seed
const SLACK_DEMO_CODE = `import os
print("Initializing Slack Automation Script...")
print("Connecting to Slack Webhook...")
print("Fetching recent database sync events from Firestore...")
print("Found 3 critical alert events in the last 24 hours.")
print("Sending formatted alerts to channel #ops-alerts...")
print("AFFECTED_ITEMS: [\"Backup failure: database-replica-1\", \"High Latency Alert: API Service\", \"Quota Exceeded: GCS Bucket\"]")
print("Alert automator finished successfully.")
`

const GMAIL_DEMO_CODE = `import os
print("Initializing Gmail Inbox Cleaner...")
print("Scanning commercial newsletters in your Inbox...")
print("Found 24 promotional messages from marketing services.")
print("Moving 24 promotional messages to Trash...")
print("AFFECTED_ITEMS: [\"newsletter@promo.com\", \"offer@shopping.com\", \"ads@marketing.net\", \"info@update-deal.org\"]")
print("Gmail Cleaning Complete! Checked 150 emails, cleaned 24.")
`

async function clearCollection(name: string) {
  const querySnap = await firestore.collection(name).where('userId', '==', 'default_user').get()
  const promises = querySnap.docs.map(async doc => firestore.collection(name).doc(doc.id).delete())
  await Promise.all(promises)
  console.log(`🧹 Cleared ${querySnap.docs?.length || 0} documents from collection: ${name}`)
}

async function clearRunsCollection() {
  const querySnap = await firestore.collection('applet_runs').get()
  const promises = querySnap.docs.map(async doc => firestore.collection('applet_runs').doc(doc.id).delete())
  await Promise.all(promises)
  console.log(`🧹 Cleared ${querySnap.docs?.length || 0} documents from collection: applet_runs`)
}

async function uploadToGCS(gcsPath: string, content: string) {
  const bucketName = process.env.GCS_BUCKET_NAME
  if (!bucketName) {
    console.warn('⚠️ GCS_BUCKET_NAME not set. Skipping real GCS upload.')
    return
  }

  // Parse relative GCS path
  const prefix = `gs://${bucketName}/`
  if (!gcsPath.startsWith(prefix)) {
    console.warn(`⚠️ GCS path ${gcsPath} does not match bucket prefix ${prefix}. Skipping GCS upload.`)
    return
  }

  const relativePath = gcsPath.substring(prefix.length)

  try {
    const storage = new Storage()
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(relativePath)
    await file.save(content, {
      contentType: 'text/plain',
      metadata: {
        cacheControl: 'no-cache',
      },
    })
    console.log(`☁️ Uploaded script to GCS: ${gcsPath}`)
  }
  catch (err: any) {
    console.warn(`⚠️ Failed to upload to real GCS: ${err.message}. (Authentication or Bucket missing)`)
  }
}

function writeToLocalMock(userId: string, appId: string, content: string) {
  const MOCK_GCS_DIR = process.platform === 'win32'
    ? path.join(os.tmpdir(), 'aquablue-gcs-mock')
    : '/tmp/aquablue-gcs-mock'
  const localPath = path.join(MOCK_GCS_DIR, userId, `applet_${appId}`, 'main.py')
  fs.mkdirSync(path.dirname(localPath), { recursive: true })
  fs.writeFileSync(localPath, content, 'utf8')
  console.log(`📁 Saved script to local mock folder: ${localPath}`)
}

async function seed() {
  console.log('🚀 Starting Database Seed script...')

  const cleanMode = process.argv.includes('--clean') || process.argv.includes('-c')
  if (cleanMode) {
    console.log('🗑 Cleaning existing default_user data...')
    await clearCollection('sessions')
    await clearCollection('session_events')
    await clearCollection('applets')
    await clearCollection('user_credentials')
    await clearRunsCollection()
  }

  const bucketName = process.env.GCS_BUCKET_NAME || 'hackathon-applets-123456'

  // 1. Seed Applets
  const applets = [
    {
      id: 'applet_slack_alert',
      userId: 'default_user',
      name: 'Slack Notification Automator',
      description: 'Queries database replica sync status and streams warning notifications to Slack #ops-alerts.',
      icon: 'Bell',
      color: 'indigo',
      gcsPath: `gs://${bucketName}/default_user/applet_applet_slack_alert/main.py`,
      dependencies: ['requests'],
      createdAt: new Date(),
      updatedAt: new Date(),
      code: SLACK_DEMO_CODE,
    },
    {
      id: 'applet_gmail_clean',
      userId: 'default_user',
      name: 'Gmail Promotional Cleaner',
      description: 'Filters and flags low-priority commercial newsletters from your Gmail Inbox and trashes them.',
      icon: 'Trash2',
      color: 'rose',
      gcsPath: `gs://${bucketName}/default_user/applet_applet_gmail_clean/main.py`,
      dependencies: ['google-api-python-client', 'google-auth-oauthlib'],
      createdAt: new Date(),
      updatedAt: new Date(),
      code: GMAIL_DEMO_CODE,
    },
  ]

  for (const app of applets) {
    const { code, ...metadata } = app
    await firestore.collection('applets').doc(app.id).set(metadata)
    writeToLocalMock(app.userId, app.id, code)
    await uploadToGCS(app.gcsPath, code)
  }
  console.log(`✅ Seeded ${applets.length} applets.`)

  // 2. Seed User Credentials
  console.log('🗝 Seeding encrypted credentials...')
  await saveCredential('gmail', 'mock-gmail-api-oauth-credential-token')
  await saveCredential('slack', 'xoxb-mock-slack-bot-token-ops-alert')
  await saveCredential('github', 'ghp_mockPersonalAccessTokenForDemoing')
  console.log('✅ Encrypted credentials seeded.')

  // 3. Seed Session and chat history
  console.log('💬 Seeding chat session history...')
  const sessionId = 'session_gcp_clean'
  const sessionDoc = {
    id: sessionId,
    userId: 'default_user',
    state: {},
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(),
  }
  await firestore.collection('sessions').doc(sessionId).set(sessionDoc)

  const events = [
    {
      id: 'event_1',
      sessionId,
      userId: 'default_user', // for clean filter
      role: 'user',
      author: 'User',
      content: 'Could you build me an applet that scans my Gmail inbox and removes promo spams?',
      createdAt: new Date(Date.now() - 3000000),
    },
    {
      id: 'event_2',
      sessionId,
      userId: 'default_user',
      role: 'model',
      author: 'Model',
      content: 'Certainly! I will design a Gmail inbox cleaner Applet. Let\'s outline the steps:\n1. Authenticate with Gmail API\n2. Query threads matching category "promotions"\n3. Batch move these threads to trash.\n\nLet\'s run a dry-run test to verify Gmail connectivity and preview affected threads.',
      createdAt: new Date(Date.now() - 2800000),
    },
    {
      id: 'event_3',
      sessionId,
      userId: 'default_user',
      role: 'user',
      author: 'User',
      content: 'Sounds good. Go ahead and test it.',
      createdAt: new Date(Date.now() - 2500000),
    },
    {
      id: 'event_4',
      sessionId,
      userId: 'default_user',
      role: 'model',
      author: 'Model',
      content: 'Dry-run successful! Found 24 promotional newsletters. The applet is ready and compiled.\n\nHere is a summary of the dry-run results:\n```json+a2ui\n{\n  "type": "Card",\n  "props": {\n    "title": "Gmail Dry-Run Summary",\n    "badge": "Dry-run Passed",\n    "description": "The sandbox execution verified the email cleaning process without modifying your actual data."\n  },\n  "children": [\n    {\n      "type": "Table",\n      "props": {\n        "headers": ["Email Thread Subject", "Sender", "Category"],\n        "rows": [\n          ["Summer Discounts!", "deals@shopping.com", "Promotions"],\n          ["Weekly Digest", "info@newsletter.net", "Updates"],\n          ["Exclusive Offer inside", "ads@marketing.org", "Promotions"]\n        ]\n      }\n    },\n    {\n      "type": "Text",\n      "props": {\n        "content": "Confirming the execution will trigger the actual removal of these 24 messages."\n      }\n    },\n    {\n      "type": "Button",\n      "props": {\n        "label": "Proceed with actual Run",\n        "variant": "primary",\n        "action": "run_applet_gmail_clean"\n      }\n    }\n  ]\n}\n```',
      createdAt: new Date(Date.now() - 2000000),
    },
  ]

  for (const event of events) {
    await firestore.collection('session_events').doc(event.id).set(event)
  }
  console.log(`✅ Seeded ${events.length} chat events in session: ${sessionId}`)

  // 4. Seed Applet Runs
  console.log('📊 Seeding Applet Run history logs...')
  const runs = [
    {
      id: 'run_1',
      appId: 'applet_slack_alert',
      status: 'success',
      exitCode: 0,
      startedAt: new Date(Date.now() - 1800000),
      finishedAt: new Date(Date.now() - 1780000),
    },
    {
      id: 'run_2',
      appId: 'applet_gmail_clean',
      status: 'success',
      exitCode: 0,
      startedAt: new Date(Date.now() - 900000),
      finishedAt: new Date(Date.now() - 885000),
    },
  ]

  for (const run of runs) {
    await firestore.collection('applet_runs').doc(run.id).set(run)
  }
  console.log(`✅ Seeded ${runs.length} run history items.`)

  console.log('🎉 Database seeding completed successfully!')
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
