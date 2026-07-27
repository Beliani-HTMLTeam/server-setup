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
  let tabs: string[] = []

  if (year) {
    try {
      const doc = await getDynamicTranslations(year)
      if (doc && doc.sheetsByIndex) {
        tabs = doc.sheetsByIndex.map(sheet => sheet.title)
      }
    } catch (e) {
      Hermes.error('[getCachedTabs] Failed to fetch tabs', e)
    }
  }

  const keys = cache.keys()
  const keyPrefix = year ? `dynamic_${year}_` : null
  const sampleKey = keyPrefix ? keys.find(k => k.startsWith(keyPrefix)) : null

  const rawAge = sampleKey ? cache.getAge(sampleKey) : null
  const age = rawAge !== null && !isNaN(rawAge) ? Number(rawAge.toFixed(1)) : null
  const recacheIn = age !== null ? calcRecacheIn(age) : null

  return { tabs, age, recacheIn }
}

export default getCachedTabs
