import type { Result } from '../types/cache/Result'
import cache, { CacheType } from '../services/Cache'
import { Hermes } from './Logger'
import { GoogleSheetsRepository } from '../services/GoogleSheetsRepository'
import { ExcelParser } from './ExcelParser'
import { cacheRefresher } from '../services/CacheRefresher'
import settings from '../config'

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

export class Sheet {
  public sheetType: CacheType
  public year?: string

  constructor(sheetType: CacheType, year?: string) {
    this.sheetType = sheetType
    this.year = year
  }

  getCacheKey(tabName: string): string {
    const normalizedTab = tabName.trim().slice(0, 31).trim()
    return this.year
      ? `dynamic_${this.year}_${normalizedTab}`
      : `static_${normalizedTab}`
  }

  // raw sheets fetch
  async getNewData(
    sheetName: string | string[]
  ): Promise<Result<Record<string, any>>> {
    try {
      const buffer = await GoogleSheetsRepository.fetchDocumentBuffer(
        this.sheetType,
        this.year
      )
      const parsedData = await ExcelParser.parseXLSXBufferAsync(buffer, sheetName)

      if (!parsedData) {
        return { code: 404, message: 'No translations found or error parsing!' }
      }

      return { code: 200, data: parsedData }
    } catch (err: any) {
      Hermes.error(`Error in getNewData:`, err)
      return {
        code: 500,
        message: err.message || 'Error occurred during data processing',
      }
    }
  }

  // get single tab either from cache or automatically downloaded and cached
  async getTab(tabName: string): Promise<{
    data: Record<string, any[]>
    dataOrigin: string
    executionTime: number
    age: number | null
    recacheIn: number
  } | null> {
    const start_time = Date.now()
    const cacheKey = this.getCacheKey(tabName)

    // returns data + age from same get() - no race between has/get/getAge
    const cached = await cache.getWithMeta<Record<string, any[]>>(cacheKey)

    if (cached) {
      const { data, age } = cached
      const recacheIn = calcRecacheIn(age)
      Hermes.log(
        `✓ Cache HIT for "${cacheKey}" (Age: ${age.toFixed(1)}s)`
      )

      if (age > cache.getTTL() / 1000) {
        Hermes.debug(
          ` > Cache is stale (Age > TTL). Refreshing before responding...`
        )
        await cache.renew(cacheKey)

        const fresh = await cache.getWithMeta<Record<string, any[]>>(cacheKey)
        if (fresh) {
          return {
            data: fresh.data,
            dataOrigin: 'googleAPI',
            executionTime: Number(((Date.now() - start_time) / 1000).toFixed(3)),
            age: Number(fresh.age.toFixed(1)),
            recacheIn: calcRecacheIn(fresh.age),
          }
        }

        // if renew failed and fresh read failed, fall through to cache miss
      } else {
        return {
          data,
          dataOrigin: 'cache',
          executionTime: Number(((Date.now() - start_time) / 1000).toFixed(3)),
          age: Number(age.toFixed(1)),
          recacheIn,
        }
      }
    }

    // cache miss (or broken cache hit) - fetch fresh data from Google API
    Hermes.log(`✖ Cache MISS for "${cacheKey}". Fetching from Google API...`)
    const res = await this.getNewData(tabName)

    if (res.code === 200 && res.data) {
      await cache.set(cacheKey, res.data, this.sheetType, tabName, this.year)

      const freshAge = cache.getAge(cacheKey)
      return {
        data: res.data,
        dataOrigin: 'googleAPI',
        executionTime: Number(((Date.now() - start_time) / 1000).toFixed(3)),
        age: freshAge !== null ? Number(freshAge.toFixed(1)) : 0,
        recacheIn: calcRecacheIn(freshAge),
      }
    }

    return null
  }

  // force renew tab without waiting for worker
  async forceRefresh(tabName: string): Promise<{ executionTime: number }> {
    const start_time = Date.now()
    const cacheKey = this.getCacheKey(tabName)
    const res = await this.getNewData(tabName)

    if (res.code === 200 && res.data) {
      await cache.set(cacheKey, res.data, this.sheetType, tabName, this.year)

      Hermes.log(`✓ Cache renewed for "${tabName}"`)

      return { executionTime: Number(((Date.now() - start_time) / 1000).toFixed(3)) }
    } else {
      throw new Error(`✖ Failed to force refresh ${tabName}: ${res.code}`)
    }
  }

  private async populateCache(
    sheetNames: string[] | 'everything',
    isRecache: boolean
  ): Promise<{ executionTime: number }> {
    const start_time = Date.now()
    const actionName = isRecache ? 'recache' : 'prewarm'
    const ActionPast = isRecache ? 'Recached' : 'Prewarmed'

    Hermes.log(
      `-> Starting ${actionName} for ${this.sheetType} ${this.year ? `(${this.year})` : ''}...`
    )

    const res = await this.getNewData(sheetNames)

    if (res.code === 200 && res.data) {
      const titles = Object.keys(res.data)
      const CHUNK_SIZE = 5

      for (let i = 0; i < titles.length; i += CHUNK_SIZE) {
        const chunk = titles.slice(i, i + CHUNK_SIZE)

        for (const title of chunk) {
          const cacheKey = this.getCacheKey(title)
          await cache.set(cacheKey, res.data[title], this.sheetType, title, this.year)
        }

        if (i + CHUNK_SIZE < titles.length) {
          await new Promise<void>((resolve) => setImmediate(resolve))
        }
      }

      Hermes.log(
        `--> ✓ ${ActionPast} ${titles.length} tabs for ${this.sheetType}`
      )
      return { executionTime: Number(((Date.now() - start_time) / 1000).toFixed(3)) }
    } else {
      Hermes.error(
        `--> ✖ Failed to ${actionName} ${this.sheetType}`,
        res.message
      )
      throw new Error(
        `✖ Failed to ${actionName} ${this.sheetType}: ${res.code}`
      )
    }
  }

  // download all tabs in this document and bulk insert into Cache on startup
  async prewarm(
    sheetNames: string[] | 'everything' = 'everything'
  ): Promise<{ executionTime: number }> {
    return this.populateCache(sheetNames, false)
  }

  // refresh all tabs in this document and bulk insert into Cache during runtime
  async recache(
    sheetNames: string[] | 'everything' = 'everything'
  ): Promise<{ executionTime: number }> {
    return this.populateCache(sheetNames, true)
  }
}
