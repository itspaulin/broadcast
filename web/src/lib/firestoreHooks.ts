import type { WithId } from '@broadcast/shared'
import { doc, onSnapshot, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

export type Snapshot<T> = {
  data: T
  loading: boolean
  error: Error | null
  // A failed listener is closed by Firestore; retry opens a new one.
  retry: () => void
}

// `source` and `attempt` record which subscription produced the data, so loading is derived
// during render instead of being reset inside the effect.
type Received<S, T> = {
  source: S | null
  attempt: number
  data: T
  error: Error | null
}

// Pass a memoized query (useMemo): a new instance on every render would resubscribe forever.
export const useQueryData = <T>(query: Query | null): Snapshot<WithId<T>[]> => {
  const [attempt, setAttempt] = useState(0)
  const [received, setReceived] = useState<Received<Query, WithId<T>[]>>({
    source: null,
    attempt: 0,
    data: [],
    error: null,
  })

  useEffect(() => {
    if (!query) return
    return onSnapshot(
      query,
      (snapshot) =>
        setReceived({
          source: query,
          attempt,
          data: snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as T) })),
          error: null,
        }),
      (error) => setReceived({ source: query, attempt, data: [], error }),
    )
  }, [query, attempt])

  const loading = query !== null && (received.source !== query || received.attempt !== attempt)
  return {
    data: loading ? [] : received.data,
    loading,
    error: loading ? null : received.error,
    retry: () => setAttempt((current) => current + 1),
  }
}

export const useDocumentData = <T>(path: string | null): Snapshot<WithId<T> | null> => {
  const [attempt, setAttempt] = useState(0)
  const [received, setReceived] = useState<Received<string, WithId<T> | null>>({
    source: null,
    attempt: 0,
    data: null,
    error: null,
  })

  useEffect(() => {
    if (!path) return
    return onSnapshot(
      doc(db, path),
      (snapshot) =>
        setReceived({
          source: path,
          attempt,
          data: snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as T) } : null,
          error: null,
        }),
      (error) => setReceived({ source: path, attempt, data: null, error }),
    )
  }, [path, attempt])

  const loading = path !== null && (received.source !== path || received.attempt !== attempt)
  return {
    data: loading ? null : received.data,
    loading,
    error: loading ? null : received.error,
    retry: () => setAttempt((current) => current + 1),
  }
}
