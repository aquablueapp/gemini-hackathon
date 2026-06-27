import { describe, expect, it } from 'vitest'

import { AuthError, createErrorResponse, ERROR_CODES } from './errors'

describe('error utilities', () => {
  // --- createErrorResponse ---
  describe('createErrorResponse', () => {
    it('should create a standard error response with code only', () => {
      const result = createErrorResponse(ERROR_CODES.AUTH_UNAUTHORIZED)

      expect(result).toEqual({
        success: false,
        error: {
          issues: [
            {
              code: 'auth_unauthorized',
              path: [],
            },
          ],
          name: 'Error',
        },
      })
    })

    it('should include message when provided', () => {
      const result = createErrorResponse(ERROR_CODES.RESOURCE_NOT_FOUND, {
        message: 'Shop not found',
      })

      expect(result.error.issues[0].message).toBe('Shop not found')
    })

    it('should include path when provided', () => {
      const result = createErrorResponse(ERROR_CODES.VALIDATION_ERROR, {
        path: ['email'],
      })

      expect(result.error.issues[0].path).toEqual(['email'])
    })

    it('should use custom error name when provided', () => {
      const result = createErrorResponse(ERROR_CODES.INTERNAL_ERROR, {
        name: 'InternalError',
      })

      expect(result.error.name).toBe('InternalError')
    })

    it('should default name to \'Error\'', () => {
      const result = createErrorResponse(ERROR_CODES.AUTH_FORBIDDEN)
      expect(result.error.name).toBe('Error')
    })

    it('should accept string error codes', () => {
      const result = createErrorResponse('custom_error_code')
      expect(result.error.issues[0].code).toBe('custom_error_code')
    })
  })

  // --- AuthError ---
  describe('authError', () => {
    it('should create an AuthError with code and message', () => {
      const error = new AuthError(ERROR_CODES.AUTH_INVALID_TOKEN, 'Token has expired')

      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('AuthError')
      expect(error.code).toBe('auth_invalid_token')
      expect(error.message).toBe('Token has expired')
    })

    it('should create an AuthError with code only', () => {
      const error = new AuthError(ERROR_CODES.AUTH_SESSION_EXPIRED)

      expect(error.code).toBe('auth_session_expired')
      expect(error.message).toBe('')
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new AuthError(ERROR_CODES.AUTH_FORBIDDEN, 'Access denied')
      }).toThrow(AuthError)
    })
  })

  // --- ERROR_CODES ---
  describe('eRROR_CODES', () => {
    it('should have all expected error code categories', () => {
      // Auth
      expect(ERROR_CODES.AUTH_UNAUTHORIZED).toBeDefined()
      expect(ERROR_CODES.AUTH_FORBIDDEN).toBeDefined()
      expect(ERROR_CODES.AUTH_INVALID_TOKEN).toBeDefined()
      expect(ERROR_CODES.AUTH_SESSION_EXPIRED).toBeDefined()

      // Resource
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBeDefined()
      expect(ERROR_CODES.RESOURCE_ALREADY_EXISTS).toBeDefined()

      // Validation
      expect(ERROR_CODES.VALIDATION_ERROR).toBeDefined()

      // System
      expect(ERROR_CODES.INTERNAL_ERROR).toBeDefined()
    })
  })
})
