import type { ListRoute, SaveRoute } from './credentials.routes'
import type { FirestoreUserCredential } from '@/db/schema/firestore'
import type { AppRouteHandler } from '@/lib/types'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { firestore } from '@/db/firestore'
import { saveCredential } from '@/services/credentials'

export const saveUserCredential: AppRouteHandler<SaveRoute> = async (c) => {
  const { service, secret } = c.req.valid('json')

  try {
    await saveCredential(service, secret)
    return c.json({ success: true }, HttpStatusCodes.OK)
  }
  catch (err) {
    console.error(`Failed to save credential for service: ${service}`, err)
    return c.json(
      { success: false, error: 'Encryption or DB persistence failure' },
      HttpStatusCodes.INTERNAL_SERVER_ERROR as any,
    )
  }
}

export const listConfiguredCredentials: AppRouteHandler<ListRoute> = async (c) => {
  try {
    const querySnap = await firestore
      .collection('user_credentials')
      .where('userId', '==', 'default_user')
      .get()

    const services = querySnap.docs.map((doc) => {
      const data = doc.data() as FirestoreUserCredential
      return data.service
    })

    return c.json(services, HttpStatusCodes.OK)
  }
  catch (err) {
    console.error('Failed to list user credentials', err)
    return c.json(
      [],
      HttpStatusCodes.INTERNAL_SERVER_ERROR as any,
    )
  }
}
