export interface Result<T> {
  code?: number
  message?: string
  data?: T
  keys?: string[]
  error?: string
  details?: string
  dataOrigin?: 'cache' | 'googleAPI'
  executionTime?: number
  age?: number | null
  recacheIn?: number
  cacheSettings?: { ttl: number; workerInterval: number }
}
