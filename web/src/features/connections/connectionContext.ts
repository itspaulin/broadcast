import type { Connection, WithId } from '@broadcast/shared'
import { useOutletContext } from 'react-router'

export const useConnection = () => useOutletContext<WithId<Connection>>()
