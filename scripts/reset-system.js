/**
 * Script to reset all system data
 * Run with: node scripts/reset-system.js
 */

/* eslint-disable */
const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function resetSystem() {
  console.log('🔥 === SYSTEM RESET SCRIPT === 🔥')
  console.log('')
  console.log('⚠️  WARNING: This will DELETE ALL DATA!')
  console.log('')
  console.log('The following will be deleted:')
  console.log('  • All CVs')
  console.log('  • All Contracts and Bookings')
  console.log('  • All Activities and Notifications')
  console.log('  • All Banners and Settings')
  console.log('  • All Users (except admin and developer)')
  console.log('')
  
  rl.question('Type "DELETE ALL" to confirm: ', async (answer) => {
    if (answer !== 'DELETE ALL') {
      console.log('❌ Cancelled. No data was deleted.')
      rl.close()
      await prisma.$disconnect()
      return
    }

    console.log('')
    console.log('🚀 Starting data reset...')
    
    try {
      // Delete all data
      console.log('Deleting activities...')
      await prisma.activityLog.deleteMany({})
      
      console.log('Deleting sessions...')
      await prisma.session.deleteMany({})
      await prisma.userSession.deleteMany({})
      
      console.log('Deleting notifications...')
      await prisma.notification.deleteMany({})
      
      console.log('Deleting login activations...')
      await prisma.loginActivation.deleteMany({})
      
      console.log('Deleting CV versions...')
      await prisma.cVVersion.deleteMany({})
      
      console.log('Deleting contracts...')
      await prisma.contract.deleteMany({})
      
      console.log('Deleting bookings...')
      await prisma.booking.deleteMany({})
      
      console.log('Deleting CVs...')
      await prisma.cV.deleteMany({})
      
      console.log('Deleting banners...')
      await prisma.banner.deleteMany({})
      
      console.log('Deleting sales configs...')
      await prisma.salesConfig.deleteMany({})
      
      console.log('Deleting system settings...')
      await prisma.systemSettings.deleteMany({})
      
      console.log('Deleting users (except admin and developer)...')
      await prisma.user.deleteMany({
        where: {
          AND: [
            { email: { not: 'developer@system.local' } },
            { email: { not: 'admin@qsr.com' } },
            { role: { not: 'DEVELOPER' } }
          ]
        }
      })

      // Reset sequences
      console.log('Resetting ID sequences...')
      try {
        await prisma.$executeRaw`ALTER SEQUENCE "CV_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 3`
        await prisma.$executeRaw`ALTER SEQUENCE "ActivityLog_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "Notification_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "Contract_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "Session_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "Banner_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "LoginActivation_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "SystemSettings_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "UserSession_id_seq" RESTART WITH 1`
        await prisma.$executeRaw`ALTER SEQUENCE "CVVersion_id_seq" RESTART WITH 1`
      } catch (error) {
        console.log('Note: Some sequences might not exist yet')
        // Silently ignore sequence errors as they might not exist
      }

      console.log('')
      console.log('✅ === SYSTEM RESET COMPLETE === ✅')
      console.log('')
      console.log('The system is now ready for real data.')
      console.log('Remaining accounts:')
      
      const remainingUsers = await prisma.user.findMany({
        select: { email: true, role: true, name: true }
      })
      
      remainingUsers.forEach(user => {
        console.log(`  • ${user.name} (${user.email}) - ${user.role}`)
      })

    } catch (error) {
      console.error('❌ Error during reset:', error)
    } finally {
      rl.close()
      await prisma.$disconnect()
    }
  })
}

// Run the reset
resetSystem().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
