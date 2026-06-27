import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MOCK_GCS_DIR = process.platform === 'win32'
  ? path.join(os.tmpdir(), 'aquablue-gcs-mock')
  : '/tmp/aquablue-gcs-mock'

/**
 * Mocks uploading a python script to a Google Cloud Storage bucket by saving it to a local temp folder.
 * Returns the mocked GCS path.
 */
export async function uploadScript(userId: string, appId: string, content: string): Promise<string> {
  const gcsPath = `gs://agent-bucket/${userId}/applet_${appId}/main.py`

  const localPath = path.join(MOCK_GCS_DIR, userId, `applet_${appId}`, 'main.py')
  fs.mkdirSync(path.dirname(localPath), { recursive: true })
  fs.writeFileSync(localPath, content, 'utf8')

  return gcsPath
}

/**
 * Mocks downloading a python script from a GCS path.
 */
export async function downloadScript(gcsPath: string): Promise<string> {
  const match = gcsPath.match(/gs:\/\/agent-bucket\/([^/]+)\/applet_([^/]+)\/main\.py/)
  if (!match) {
    console.error(`downloadScript match failed for gcsPath: ${gcsPath}`)
    throw new Error(`Invalid GCS path format: ${gcsPath}`)
  }

  const [, userId, appId] = match
  const localPath = path.join(MOCK_GCS_DIR, userId, `applet_${appId}`, 'main.py')
  console.log(`downloadScript checking localPath: ${localPath}, exists: ${fs.existsSync(localPath)}`)

  if (!fs.existsSync(localPath)) {
    throw new Error(`Script not found in mock GCS for path: ${gcsPath}. Computed local path: ${localPath}`)
  }

  return fs.readFileSync(localPath, 'utf8')
}
