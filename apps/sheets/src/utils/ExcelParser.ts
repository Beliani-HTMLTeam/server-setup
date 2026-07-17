import { Hermes } from './Logger'

const WORKER_TIMEOUT_MS = 30_000

export class ExcelParser {
  static parseXLSXBufferAsync(
    buffer: ArrayBuffer,
    sheetNameRequest: string | string[]
  ): Promise<Record<string, any> | null> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        // @ts-ignore
        new URL('../workers/xlsx.worker.ts', import.meta.url),
        { type: 'module' }
      )

      const timer = setTimeout(() => {
        worker.terminate()
        const err = new Error(
          `[ExcelParser] Worker timed out after ${WORKER_TIMEOUT_MS / 1000}s — xlsx.read() likely hung`
        )
        Hermes.error('✖ xlsx.worker timeout — forcibly terminated:', err.message)
        reject(err)
      }, WORKER_TIMEOUT_MS)

      worker.addEventListener('message', (event: MessageEvent) => {
        clearTimeout(timer)
        worker.terminate()
        if (event.data?.error) {
          Hermes.error('✖ xlsx.worker reported an error:', event.data.error)
          reject(new Error(event.data.error))
        } else {
          resolve(event.data?.result ?? null)
        }
      })

      worker.addEventListener('error', (err) => {
        clearTimeout(timer)
        worker.terminate()
        Hermes.error('✖ xlsx.worker threw an unhandled error:', err)
        reject(err)
      })

      worker.postMessage({ buffer, sheetNameRequest }, [buffer])
    })
  }
}
