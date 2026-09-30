import type { WithId } from '@broadcast/shared'
import { doc, onSnapshot, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

type Snapshot<T> = {
  data: T
  loading: boolean
  error: Error | null
}

// `source` records which query/path produced the data, so loading is derived during
// render instead of being reset inside the effect.
type Received<S, T> = {
  source: S | null
  data: T
  error: Error | null
}

// Pass a memoized query (useMemo): a new instance on every render would resubscribe forever.
export const useQueryData = <T>(query: Query | null): Snapshot<WithId<T>[]> => {
  const [received, setReceived] = useState<Received<Query, WithId<T>[]>>({ source: null, data: [], error: null })

  useEffect(() => {
    if (!query) return
    return onSnapshot(
      query,
      (snapshot) =>
        setReceived({
          source: query,
          data: snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as T) })),
          error: null,
        }),
      (error) => setReceived({ source: query, data: [], error }),
    )
  }, [query])

  const loading = query !== null && received.source !== query
  return { data: loading ? [] : received.data, loading, error: loading ? null : received.error }
}

export const useDocumentData = <T>(path: string | null): Snapshot<WithId<T> | null> => {
  const [received, setReceived] = useState<Received<string, WithId<T> | null>>({
    source: null,
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
          data: snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as T) } : null,
          error: null,
        }),
      (error) => setReceived({ source: path, data: null, error }),
    )
  }, [path])

  const loading = path !== null && received.source !== path
  return { data: loading ? null : received.data, loading, error: loading ? null : received.error }
}
