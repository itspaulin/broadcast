export const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

// Stored phones are Brazilian E.164 (+55 + area code + 8 or 9 digits).
export const formatPhone = (phone: string) => {
  const match = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(phone)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone
}

export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dayAndMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const DAY_MS = 24 * 60 * 60 * 1000

// "hoje, 14:30", "amanhã, 07:00", "ontem, 17:40" or "10/03, 07:30", in the user's time zone.
export const formatWhen = (millis: number, nowMillis = Date.now()) => {
  const date = new Date(millis)
  const days = Math.round((startOfDay(date) - startOfDay(new Date(nowMillis))) / DAY_MS)
  const day = days === 0 ? 'hoje' : days === 1 ? 'amanhã' : days === -1 ? 'ontem' : dayAndMonth.format(date)
  return `${day}, ${time.format(date)}`
}
