import { FunctionsError } from 'firebase/functions'

// Codes whose message is written for the user by our functions; anything else is unexpected.
const USER_FACING_CODES = new Set([
  'functions/not-found',
  'functions/invalid-argument',
  'functions/failed-precondition',
])

export const callableErrorMessage = (error: unknown, fallback: string) =>
  error instanceof FunctionsError && USER_FACING_CODES.has(error.code) ? error.message : fallback
