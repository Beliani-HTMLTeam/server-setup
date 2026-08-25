import cache from './Cache'
import { Sheet } from '../utils/Sheet'
import settings from '../config'
import { Hermes } from '../utils/Logger'

const TICK_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

class CacheRefresher {
  private isRenewing = false
  private intervalId?: ReturnType<typeof setInterval>
  private lastTickAt: number = Date.now()

  start() {
    this.intervalId = setInterval(async () => {
      await this.tick()
    }, settings.workerInterval * 1000)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  getNextTickIn(): number {
    const elapsedMs = Date.now() - this.lastTickAt
    return Math.max(0, settings.workerInterval - elapsedMs / 1000)
  }

  private async tick() {
    this.lastTickAt = Date.now()
    if (!cache.isPrewarmed) return
    if (this.isRenewing) return
    this.isRenewing = true

    const tickWork = async () => {
      Hermes.info(`$ Starting scheduled cache refresh...`)

      // recache global translations
      try {
        Hermes.info(` > - Renewing all global translations...`)
        
				const globalSheet = new Sheet('globalTranslations')
        await globalSheet.recache('everything')

				Hermes.info(` > ✔ Global translations renewed!`)
      } catch (err) {
        Hermes.error(` > ✖ Failed to mass-refresh globalTranslations:`, err)
      }

      // recache the current year newsletter translations
      try {
        const currentYear = new Date().getFullYear().toString()
        
				Hermes.info(` > - Mass-refreshing all newsletter translations for year: ${currentYear}`)
        
				const dynamicSheet = new Sheet('newsletterTranslations', currentYear)
        await dynamicSheet.recache('everything')
        
				Hermes.info(` > ✔ Year ${currentYear} refreshed successfully.`)
      } catch (err) {
        Hermes.error(` > ✖ Failed to mass-refresh year:`, err)
      }
    }

    try {
      await Promise.race([
        tickWork(),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error(`[CacheRefresher] tick() exceeded ${TICK_TIMEOUT_MS / 60000}min hard limit`)),
            TICK_TIMEOUT_MS
          )
        ),
      ])
    } catch (err) {
      Hermes.error(`✖ Worker error:`, err)
    } finally {
      this.isRenewing = false
    }
  }
}

export const cacheRefresher = new CacheRefresher()
