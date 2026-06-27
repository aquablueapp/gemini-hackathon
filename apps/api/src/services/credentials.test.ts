import { beforeAll, describe, expect, it } from 'vitest'
import { decrypt, encrypt, getCredential, saveCredential } from './credentials'

describe('credentials Encryption Utility', () => {
  it('should securely encrypt and decrypt secret values', () => {
    const rawSecret = 'super-secret-oauth-refresh-token-12345'

    // Encrypt
    const result = encrypt(rawSecret)
    expect(result.encryptedValue).not.toBe(rawSecret)
    expect(result.iv).toBeDefined()
    expect(result.tag).toBeDefined()

    // Decrypt
    const decrypted = decrypt(result.encryptedValue, result.iv, result.tag)
    expect(decrypted).toBe(rawSecret)
  })

  it('should throw error when decrypting with corrupted parameters', () => {
    const rawSecret = 'secret'
    const result = encrypt(rawSecret)

    // Corrupt the tag
    expect(() => {
      decrypt(result.encryptedValue, result.iv, 'corruptedtag')
    }).toThrow()
  })
})

describe('credentials Firestore Storage', () => {
  let isEmulatorRunning = false

  beforeAll(async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081'
    try {
      const res = await fetch(`http://${host}/`)
      if (res.status === 200 || res.status === 404) {
        isEmulatorRunning = true
      }
    }
    catch {
      isEmulatorRunning = false
    }
  })

  it('should save and retrieve encrypted credentials from Firestore', async () => {
    if (!isEmulatorRunning) {
      return
    }

    const serviceName = 'gmail_test_service'
    const secretToken = 'gmail-oauth-secret'

    // Save
    await saveCredential(serviceName, secretToken)

    // Retrieve
    const decryptedSecret = await getCredential(serviceName)
    expect(decryptedSecret).toBe(secretToken)
  })
})
