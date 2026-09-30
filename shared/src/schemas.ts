import { z } from 'zod'
import { MESSAGE_BODY_MAX_LENGTH, NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './constants.ts'

const id = z.string().min(1)

const name = z.string().trim().min(1, 'Informe o nome').max(NAME_MAX_LENGTH)

const phone = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(z.string().regex(/^(55)?\d{10,11}$/, 'Telefone inválido'))
  .transform((digits) => `+${digits.length >= 12 ? digits : `55${digits}`}`)

const body = z
  .string()
  .trim()
  .min(1, 'Escreva a mensagem')
  .max(MESSAGE_BODY_MAX_LENGTH)

const contactIds = z
  .array(id)
  .min(1, 'Selecione ao menos um contato')
  .transform((ids) => [...new Set(ids)])

const scheduledAt = z.number().int().positive().nullable()

const email = z.string().trim().pipe(z.email('E-mail inválido'))

export const signInInputSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
})

export const signUpInputSchema = z.object({
  name,
  email,
  password: z.string().min(PASSWORD_MIN_LENGTH, `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres`),
})

export const connectionInputSchema = z.object({ name })

export const contactInputSchema = z.object({ name, phone })

export const createMessageInputSchema = z.object({
  connectionId: id,
  contactIds,
  body,
  scheduledAt,
})

export const updateMessageInputSchema = z.object({
  messageId: id,
  body,
  contactIds: contactIds.optional(),
  scheduledAt: scheduledAt.optional(),
})

export const deleteMessageInputSchema = z.object({ messageId: id })

export const deleteContactInputSchema = z.object({ contactId: id })

export type SignInInput = z.infer<typeof signInInputSchema>
export type SignUpInput = z.infer<typeof signUpInputSchema>
export type ConnectionInput = z.infer<typeof connectionInputSchema>
export type ContactInput = z.infer<typeof contactInputSchema>
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>
export type UpdateMessageInput = z.infer<typeof updateMessageInputSchema>
export type DeleteMessageInput = z.infer<typeof deleteMessageInputSchema>
export type DeleteContactInput = z.infer<typeof deleteContactInputSchema>
