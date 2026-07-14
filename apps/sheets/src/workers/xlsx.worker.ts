import * as xlsx from 'xlsx'

interface WorkerInput {
  buffer: ArrayBuffer
  sheetNameRequest: string | string[]
}

function matchSheetName(requested: string, actual: string): boolean {
  const req = requested.trim()
  const act = actual.trim()
  return act === req || act === req.slice(0, 31).trim() || act === req.slice(0, 31)
}

function processSheet(
  workbook: xlsx.WorkBook,
  sheetTitle: string
): { name: string; data: Record<string, any> } | null {
  try {
    const sheet = workbook.Sheets[sheetTitle]
    if (!sheet) return null

    const matrix: any[][] = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    })
    if (!matrix || matrix.length === 0) return null

    const headers = matrix[0] || []
    const rows = matrix.slice(1)
    const result: Record<string, any> = {}

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (header !== null && header !== undefined && String(header).trim() !== '') {
        const headerName = String(header).trim()
        result[headerName] = rows.map((row) => {
          const val = row[i]
          if (val === null || val === undefined) return null
          return String(val).replaceAll('\n', '<br />').trim()
        })
      }
    }

    if (Object.keys(result).length === 0) return null
    return { name: sheetTitle, data: result }
  } catch (err: any) {
    console.warn(`[xlsx.worker] Cannot process sheet "${sheetTitle}": ${err.message}`)
    return null
  }
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { buffer, sheetNameRequest } = event.data

  try {
    const workbook = xlsx.read(buffer)

    const sheetsToProcess: string[] = []

    if (Array.isArray(sheetNameRequest)) {
      if (sheetNameRequest.length === 1 && sheetNameRequest[0] === 'everything') {
        sheetsToProcess.push(...workbook.SheetNames)
      } else {
        for (const name of sheetNameRequest) {
          const match = workbook.SheetNames.find((n) => matchSheetName(name, n))
          if (match) sheetsToProcess.push(match)
        }
      }
    } else if (sheetNameRequest === 'everything') {
      sheetsToProcess.push(...workbook.SheetNames)
    } else {
      const match = workbook.SheetNames.find((n) => matchSheetName(sheetNameRequest, n))
      if (match) sheetsToProcess.push(match)
    }

    if (!sheetsToProcess.length) {
      console.error(
        `[xlsx.worker] No sheets matched! Available: ${workbook.SheetNames.join(', ')}`
      )
      self.postMessage({ result: null })
      return
    }

    if (Array.isArray(sheetNameRequest) || sheetNameRequest === 'everything') {
      const results: { name: string; data: Record<string, any> }[] = []

      for (const title of sheetsToProcess) {
        const parsed = processSheet(workbook, title)
        if (parsed) results.push(parsed)
      }

      if (results.length === 0) {
        console.error('[xlsx.worker] processSheet returned null for all sheets!')
        self.postMessage({ result: null })
        return
      }

      const combined = results.reduce(
        (acc, curr) => {
          acc[curr.name] = curr.data
          return acc
        },
        {} as Record<string, any>
      )

      self.postMessage({ result: combined })
      return
    }

    const parsed = processSheet(workbook, sheetsToProcess[0])
    self.postMessage({ result: parsed ? parsed.data : null })
  } catch (err: any) {
    self.postMessage({ error: err.message ?? String(err) })
  }
}
