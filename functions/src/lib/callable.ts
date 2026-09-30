import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import type { z } from 'zod'

export const requireClientId = (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login para continuar.')
  return request.auth.uid
}

export const parseInput = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new HttpsError('invalid-argument', result.error.issues[0]?.message ?? 'Dados inválidos.')
  }
  return result.data
}
