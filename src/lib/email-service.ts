// Simple email service - for production, implement with actual SMTP service
// This version uses console logging for development

interface EmailResult {
  success: boolean
  error?: string
}

class EmailService {
  private static readonly ADMIN_EMAIL = 'engelsayedebaid@gmail.com'

  /**
   * Send activation code to admin email
   * For now, this logs to console - in production, implement with actual email service
   */
  async sendActivationCode(userEmail: string, userName: string, activationCode: string): Promise<EmailResult> {
    try {
      // Log the email content to console for development
      console.log('='.repeat(50))
      console.log('📧 EMAIL TO ADMIN:')
      console.log('To:', EmailService.ADMIN_EMAIL)
      console.log('Subject: كود تفعيل تسجيل الدخول - نظام إدارة مكاتب الاستقدام')
      console.log('-'.repeat(30))
      console.log('👤 User Name:', userName)
      console.log('📧 User Email:', userEmail)
      console.log('🔐 Activation Code:', activationCode)
      console.log('⏰ Time:', new Date().toLocaleString('ar-SA'))
      console.log('='.repeat(50))

      // TODO: In production, implement actual email sending here
      // Example with nodemailer:
      // const transporter = nodemailer.createTransporter({ ... })
      // await transporter.sendMail({ ... })

      return { success: true }
    } catch (error) {
      console.error('Email sending failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<EmailResult> {
    try {
      // For development, always return success
      return { success: true }
    } catch (error) {
      console.error('Email connection test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const emailService = new EmailService()