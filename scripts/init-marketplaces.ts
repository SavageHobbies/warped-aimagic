// Database initialization script for marketplace configurations
import { PrismaClient } from '@prisma/client'
import { MARKETPLACE_CONFIGS } from '../src/lib/marketplace-config'

const prisma = new PrismaClient()

async function initializeMarketplaces() {
  console.log('Initializing marketplace configurations...')

  try {
    // Initialize default marketplaces
    for (const [name, config] of Object.entries(MARKETPLACE_CONFIGS)) {
      await prisma.marketplace.upsert({
        where: { name },
        update: {
          displayName: config.displayName,
          isEnabled: config.isEnabled,
          fieldMapping: config.fieldMapping,
          templates: config.templates,
          settings: {}
        },
        create: {
          name,
          displayName: config.displayName,
          isEnabled: config.isEnabled,
          fieldMapping: config.fieldMapping,
          templates: config.templates,
          settings: {}
        }
      })
      console.log(`✓ Initialized ${config.displayName}`)
    }

    // Initialize BaseLinker configuration if API token is available
    const baselinkerToken = process.env.BASELINKER_API_TOKEN
    if (baselinkerToken) {
      await prisma.baseLinkerConfig.upsert({
        where: { id: 'default' },
        update: {
          apiToken: baselinkerToken,
          isActive: true
        },
        create: {
          id: 'default',
          apiToken: baselinkerToken,
          isActive: true,
          settings: {}
        }
      })
      console.log('✓ Initialized BaseLinker configuration')
    }

    console.log('✅ Marketplace initialization completed successfully')
  } catch (error) {
    console.error('❌ Error initializing marketplaces:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeMarketplaces()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { initializeMarketplaces }