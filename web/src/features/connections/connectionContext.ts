import type { Connection, Contact, WithId } from '@broadcast/shared'
import { useOutletContext } from 'react-router'
import type { Snapshot } from '../../lib/firestoreHooks'

// The connection page owns one contacts subscription and shares it with its tabs: the count
// badge, the contacts list and the broadcast composer all read the same data.
export type ConnectionContext = {
  connection: WithId<Connection>
  contacts: Snapshot<WithId<Contact>[]>
}

export const useConnectionContext = () => useOutletContext<ConnectionContext>()
