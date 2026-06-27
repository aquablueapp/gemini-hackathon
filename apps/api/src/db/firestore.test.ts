import type { FirestoreSession } from './schema/firestore'
import { beforeAll, describe, expect, it } from 'vitest'
import { firestore } from './firestore'

describe('firestore Emulator Connection and Operations', () => {
  let isEmulatorRunning = false

  beforeAll(async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081'
    try {
      // Test if emulator endpoint is reachable
      const res = await fetch(`http://${host}/`)
      if (res.status === 200 || res.status === 404) {
        isEmulatorRunning = true
      }
    }
    catch {
      isEmulatorRunning = false
      console.warn(`⚠️ Firestore Emulator is not running at http://${host}/. Skipping operations test.`)
    }
  })

  it('should support basic CRUD operations when emulator is active', async () => {
    if (!isEmulatorRunning) {
      // Skip test gracefully if emulator isn't active
      return
    }

    const docRef = firestore.collection('sessions').doc('test-session-123')

    const mockSession: FirestoreSession = {
      id: 'test-session-123',
      userId: 'default_user',
      createdAt: new Date(),
      updatedAt: new Date(),
      state: { key: 'value' },
    }

    // CREATE
    await docRef.set(mockSession)

    // READ
    const docSnap = await docRef.get()
    expect(docSnap.exists).toBe(true)
    const savedData = docSnap.data() as FirestoreSession
    expect(savedData.id).toBe('test-session-123')
    expect(savedData.userId).toBe('default_user')
    expect(savedData.state.key).toBe('value')

    // UPDATE
    await docRef.update({
      'state.key': 'updated-value',
      'updatedAt': new Date(),
    })
    const updatedSnap = await docRef.get()
    const updatedData = updatedSnap.data() as FirestoreSession
    expect(updatedData.state.key).toBe('updated-value')

    // DELETE
    await docRef.delete()
    const deletedSnap = await docRef.get()
    expect(deletedSnap.exists).toBe(false)
  })
})
