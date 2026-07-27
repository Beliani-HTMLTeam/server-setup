import cache from '../services/Cache'
import { getDynamicTranslations } from '../googleAuth'
import { cacheRefresher } from '../services/CacheRefresher'
import settings from '../config'
import { Hermes } from './Logger'

function calcRecacheIn(age: number | null): number {
  const ttlSeconds = cache.getTTL() / 1000
  const nextTickIn = cacheRefresher.getNextTickIn()

  if (age === null) return Math.round(nextTickIn)

  const timeUntilExpiry = Math.max(0, ttlSeconds - age)

  // next tick will renew it
  if (timeUntilExpiry === 0) return Math.round(nextTickIn)

  // find the first tick that lands AFTER expiry
  if (timeUntilExpiry <= nextTickIn) {
    return Math.round(nextTickIn)
  }

  const timeAfterFirstTick = timeUntilExpiry - nextTickIn
  const additionalTicks = Math.ceil(timeAfterFirstTick / settings.workerInterval)
  return Math.round(nextTickIn + additionalTicks * settings.workerInterval)
}

const getCachedTabs = async (year?: string) => {
  const keys = cache.keys()
  const tabs = new Set<string>()

  let fullTitles: string[] = []
  if (year) {
    try {
      const doc = await getDynamicTranslations(year)
      if (doc && doc.sheetsByIndex) {
        fullTitles = doc.sheetsByIndex.map(sheet => sheet.title)
      }
    } catch (e) {
      Hermes.error('[getCachedTabs] Failed to fetch dynamic translations to map full titles', e)
    }
  }

  let sampleKey: string | null = null

  Hermes.debug(`[getCachedTabs] Requested year: "${year}". Total cache keys: ${keys.length}`);

  for (const key of keys) {
    const entry = cache.getRaw(key)
    if (entry && entry.tabName) {
      if (!year || String(entry.year).trim() === String(year).trim() || (year === 'all')) {
        if (!sampleKey) sampleKey = key

        let finalTabName = entry.tabName
        
        if (fullTitles.length > 0) {
          const matched = fullTitles.find(
            t => t.trim().slice(0, 31).trim() === entry.tabName || t === entry.tabName
          )
          if (matched) {
            finalTabName = matched
          }
        }

        tabs.add(finalTabName)
      }
    }
  }

  Hermes.debug(`[getCachedTabs] Found ${tabs.size} tabs for year "${year}"`);

  const age = sampleKey ? cache.getAge(sampleKey) : null
  const recacheIn = sampleKey ? calcRecacheIn(age) : null

  return {
    tabs: Array.from(tabs),
    age: age !== null ? Number(age.toFixed(1)) : null,
    recacheIn
  }
}

export default getCachedTabs
