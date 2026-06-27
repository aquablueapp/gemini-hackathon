import { saveCredential } from '../src/services/credentials'

async function run() {
  const token = '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'
  await saveCredential('github', token)
  console.log('✅ Real GitHub Token Saved successfully!')
}

run().catch(console.error)
