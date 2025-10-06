import { db } from './db'
import { NotificationService } from './notification-service'

/**
 * Generate a random 6-digit activation code
 */
function generateActivationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store activation code for user login attempt
 */
export async function createLoginActivationCode(userId: number, userName: string, userEmail: string) {
  try {
    // Generate unique activation code
    const activationCode = generateActivationCode()
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // For now, store in memory/session since we don't have the table yet
    // In production, this would be stored in the LoginActivation table
    const codeData = {
      userId,
      userName,
      userEmail,
      activationCode,
      expiresAt,
      isUsed: false
    }

    // Store temporarily in a Map (in production, use database)
    if (!global.loginCodes) {
      global.loginCodes = new Map()
    }
    global.loginCodes.set(activationCode, codeData)

    // Clean up expired codes
    for (const [code, data] of global.loginCodes.entries()) {
      if (data.expiresAt < new Date() || data.isUsed) {
        global.loginCodes.delete(code)
      }
    }

    // Send activation code notification to admins
    await NotificationService.notifyLoginActivation({
      userEmail,
      userName,
      activationCode,
      expiresAt
    })

    console.log('🔔 Activation notification sent to admin for:', userName)

    return {
      success: true,
      expiresAt
    }
  } catch (error) {
    console.error('Failed to create activation code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Verify activation code and mark as used
 */
export async function verifyActivationCode(activationCode: string, userId: number) {
  try {
    if (!global.loginCodes) {
      return { success: false, error: 'No activation codes found' }
    }

    const codeData = global.loginCodes.get(activationCode)
    
    if (!codeData) {
      return { success: false, error: 'Invalid activation code' }
    }

    if (codeData.userId !== userId) {
      return { success: false, error: 'Activation code does not match user' }
    }

    if (codeData.isUsed) {
      return { success: false, error: 'Activation code already used' }
    }

    if (codeData.expiresAt < new Date()) {
      global.loginCodes.delete(activationCode)
      return { success: false, error: 'Activation code expired' }
    }

    // Mark as used
    codeData.isUsed = true
    global.loginCodes.set(activationCode, codeData)

    return { success: true }
  } catch (error) {
    console.error('Failed to verify activation code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clean up expired and used activation codes
 */
export function cleanupExpiredCodes() {
  if (!global.loginCodes) return

  for (const [code, data] of global.loginCodes.entries()) {
    if (data.expiresAt < new Date() || data.isUsed) {
      global.loginCodes.delete(code)
    }
  }
}

// Global type declaration
declare global {
  var loginCodes: Map<string, {
    userId: number
    userName: string
    userEmail: string
    activationCode: string
    expiresAt: Date
    isUsed: boolean
  }> | undefined
}