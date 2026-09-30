import { FUNCTIONS_REGION } from '@broadcast/shared'
import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'

initializeApp()
setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 10 })
