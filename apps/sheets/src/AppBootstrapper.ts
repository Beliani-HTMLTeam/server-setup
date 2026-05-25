import { app } from './index'
import { Sheet } from './utils/Sheet'
import { Hermes } from './utils/Logger'
import cache from './services/Cache'
import { cacheRefresher } from './services/CacheRefresher'

export class AppBootstrapper {
  static async startServer() {
    try {
      Hermes.log('Bootstrapping app...')

      const sheet = new Sheet('globalTranslations')
      await sheet.prewarm('everything')

      const currentYear = new Date().getFullYear().toString()
      const dynamicSheet = new Sheet('newsletterTranslations', currentYear)

      await dynamicSheet.prewarm('everything')
    } catch (err) {
      Hermes.error('Error during prewarm:', err)
    } finally {
      cache.isPrewarmed = true
      cacheRefresher.start()

      const port = Number(process.env.PORT)
      const publicUrl = process.env.PUBLIC_URL

      app.listen({ port, hostname: '0.0.0.0' })

      Hermes.debug(`-> Visit API docs @ ${publicUrl}/docs`)
    }
  }
}
