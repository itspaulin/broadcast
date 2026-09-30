// Imported first: ES modules evaluate imports in order, and v2 functions read the global
// options (region) when they are defined, not when they run.
import './setup.ts'

export { onUserCreated } from './auth/onUserCreated.ts'
export { deleteConnection } from './connections/deleteConnection.ts'
