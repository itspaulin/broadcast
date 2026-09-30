export const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

// Stored phones are Brazilian E.164 (+55 + area code + 8 or 9 digits).
export const formatPhone = (phone: string) => {
  const match = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(phone)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone
}
