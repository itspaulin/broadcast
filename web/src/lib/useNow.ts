import { useEffect, useState } from 'react'

// Re-renders on a timer so relative times ("envia em 2 h") stay current without a new snapshot.
export const useNow = (intervalMs = 30 * 1000) => {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
