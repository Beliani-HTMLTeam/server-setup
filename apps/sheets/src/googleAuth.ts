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

const LOAD_INFO_TIMEOUT_MS = 15_000

async function loadInfoWithTimeout(
  doc: GoogleSpreadsheet,
  ms: number,
  label: string
): Promise<void> {
  let timedOut = false
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => {
      timedOut = true
      reject(new Error(`[googleAuth] ${label} timed out after ${ms}ms`))
    }, ms)
  )

  try {
    await Promise.race([doc.loadInfo(), timeout])
  } catch (err) {
    if (timedOut) {
      console.log(`[googleAuth] ${label} timed out after ${ms}ms`)
      ;(doc as any).__timedOut = true
    }
    throw err
  }
}

export function resolveYearFromSpreadsheetId(
  spreadsheetId: string
): string | undefined {
  const entry = Object.entries(spreadsheets.dynamic).find(
    ([_, id]) => id === spreadsheetId
  )
  return entry?.[0]
}

export async function getStaticTranslations() {
  await loadInfoWithTimeout(
    STATIC_TRANSLATIONS,
    LOAD_INFO_TIMEOUT_MS,
    'getStaticTranslations loadInfo()'
  )
  return STATIC_TRANSLATIONS
}

export async function getDynamicTranslations(year?: string) {
  if (!year) return undefined

  let doc = DYNAMIC_SHEETS[year]
  if (!doc) return undefined

  try {
    await loadInfoWithTimeout(
      doc,
      LOAD_INFO_TIMEOUT_MS,
      `getDynamicTranslations loadInfo() [year=${year}]`
    )
  } catch (err) {
    if ((doc as any).__timedOut) {
      DYNAMIC_SHEETS[year] = new GoogleSpreadsheet(
        (DYNAMIC_SHEETS[year] as any).spreadsheetId,
        xlsxAccount
      )
    }
    throw err
  }

  return doc
}
