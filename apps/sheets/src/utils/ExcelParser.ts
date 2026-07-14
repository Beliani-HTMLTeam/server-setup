import { Hermes } from './Logger'

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

      worker.addEventListener('message', (event: MessageEvent) => {
        worker.terminate()
        if (event.data?.error) {
          Hermes.error('✖ xlsx.worker reported an error:', event.data.error)
          reject(new Error(event.data.error))
        } else {
          resolve(event.data?.result ?? null)
        }
      })

      worker.addEventListener('error', (err) => {
        worker.terminate()
        Hermes.error('✖ xlsx.worker threw an unhandled error:', err)
        reject(err)
      })

      worker.postMessage({ buffer, sheetNameRequest }, [buffer])
    })
  }
}
