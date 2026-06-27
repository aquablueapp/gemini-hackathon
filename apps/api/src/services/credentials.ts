import type { FirestoreUserCredential } from '@/db/schema/firestore'
import crypto from 'node:crypto'
import { firestore } from '@/db/firestore'

// Generate a deterministic 32-byte key from our environment secret using SHA-256
const SECRET = process.env.BETTER_AUTH_SECRET || 'default-dev-credential-secret-key-placeholder'
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET).digest()
const ALGORITHM = 'aes-256-gcm'

export interface EncryptionResult {
  encryptedValue: string
  iv: string
  tag: string
}

/**
 * Encrypts a raw secret text using AES-256-GCM
 */
export function encrypt(text: string): EncryptionResult {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return {
    encryptedValue: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/**
 * Decrypts an AES-256-GCM encrypted secret value
 */
export function decrypt(encryptedValue: string, ivHex: string, tagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encryptedValue, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypts and saves a user credential for a specific service in Firestore
 */
export async function saveCredential(service: string, secret: string): Promise<void> {
  const { encryptedValue, iv, tag } = encrypt(secret)

  const credentialDoc: FirestoreUserCredential = {
    userId: 'default_user',
    service,
    encryptedValue,
    iv,
    tag,
    updatedAt: new Date(),
  }

  // Use a deterministic document ID for quick lookup and upsert
  const docId = `default_user:${service}`
  await firestore.collection('user_credentials').doc(docId).set(credentialDoc)
}

/**
 * Retrieves and decrypts a user credential for a specific service from Firestore
 */
export async function getCredential(service: string): Promise<string | null> {
  const docId = `default_user:${service}`
  const docSnap = await firestore.collection('user_credentials').doc(docId).get()

  if (!docSnap.exists) {
    return null
  }

  const data = docSnap.data() as FirestoreUserCredential
  try {
    return decrypt(data.encryptedValue, data.iv, data.tag)
  }
  catch (error) {
    console.error(`❌ Failed to decrypt credential for service: ${service}`, error)
    throw new Error(`Credential decryption failed for service: ${service}`)
  }
}
