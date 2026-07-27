import { getStaticTranslations, getDynamicTranslations } from '../googleAuth'
import type { CacheType } from './Cache'
import { Hermes } from '../utils/Logger'

const DOWNLOAD_TIMEOUT_MS = 60_000

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class GoogleSheetsRepository {
  static async fetchDocumentBuffer(
    sheetType: CacheType,
    year?: string,
    retries = 3
  ): Promise<ArrayBuffer> {
    let document

    if (sheetType === 'globalTranslations') {
      document = await getStaticTranslations()
    } else if (sheetType === 'newsletterTranslations') {
      if (!year) {
        throw new Error('Year must be provided for newsletter translations.')
      }
      document = await getDynamicTranslations(year)
    }

    if (!document) {
      throw new Error('Unexpected error occurred. Document not found.')
    }

    let attempt = 0
    while (attempt < retries) {
      try {
        const download = document.downloadAsXLSX()
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`[GoogleSheetsRepository] downloadAsXLSX() timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s`)),
            DOWNLOAD_TIMEOUT_MS
          )
        )
        return await Promise.race([download, timeout])
      } catch (err: any) {
        attempt++
        Hermes.error(`✖ Failed to download document as XLSX (Attempt ${attempt}/${retries}):`, err.message)
        
        if (attempt >= retries) {
          throw new Error('Failed to download spreadsheet!')
        }
        
        await wait(Math.pow(2, attempt) * 1000)
      }
    }
    
    throw new Error('Failed to download spreadsheet!')
  }
}
