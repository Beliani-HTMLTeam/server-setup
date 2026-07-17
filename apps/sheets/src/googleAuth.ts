import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import credentials from '../data/google-credentials.json'
import spreadsheets from '../data/spreadsheets.json'

const xlsxAccount = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const STATIC_TRANSLATIONS = new GoogleSpreadsheet(
  spreadsheets.static,
  xlsxAccount
)

const DYNAMIC_SHEETS: Record<string, GoogleSpreadsheet> = Object.fromEntries(
  Object.entries(spreadsheets.dynamic).map(([year, id]) => [
    year,
    new GoogleSpreadsheet(id as string, xlsxAccount),
  ])
)

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`[googleAuth] ${label} timed out after ${ms}ms`)),
      ms
    )
  )
  return Promise.race([promise, timeout])
}

const LOAD_INFO_TIMEOUT_MS = 15_000

export function resolveYearFromSpreadsheetId(
  spreadsheetId: string
): string | undefined {
  const entry = Object.entries(spreadsheets.dynamic).find(
    ([_, id]) => id === spreadsheetId
  )
  return entry?.[0]
}

export async function getStaticTranslations() {
  await withTimeout(
    STATIC_TRANSLATIONS.loadInfo(),
    LOAD_INFO_TIMEOUT_MS,
    'getStaticTranslations loadInfo()'
  )
  return STATIC_TRANSLATIONS
}

export async function getDynamicTranslations(year?: string) {
  if (!year) return undefined

  const doc = DYNAMIC_SHEETS[year]
  if (!doc) return undefined

  await withTimeout(
    doc.loadInfo(),
    LOAD_INFO_TIMEOUT_MS,
    `getDynamicTranslations loadInfo() [year=${year}]`
  )
  return doc
}
