import { saveCredential } from '../src/services/credentials'

async function run() {
  const token = process.env.GEMINI_API_KEY
  if (!token) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  await saveCredential('google', token)
  console.log('✅ Google API Key Saved successfully!')
}

run().catch(console.error)
