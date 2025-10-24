'use client'

import { useEffect } from 'react'

/**
 * Component to send periodic heartbeat to keep user session alive
 * Should be included in the main layout or dashboard
 */
export default function UserHeartbeat() {
  useEffect(() => {
    // Only run on client side and if user is logged in
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    const sessionId = localStorage.getItem('sessionId')

    if (!token || !sessionId) return

    // Send heartbeat every 2 minutes (120,000ms)
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        })
      } catch (error) {
        console.error('Heartbeat failed:', error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval to send heartbeat every 2 minutes
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}
