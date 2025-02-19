import {
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
  UserDetails,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import { z } from 'zod'

import { Asset } from '../../../utils/assets'

export type NewForcedActionFormAsset = z.infer<typeof NewForcedActionFormAsset>
export const NewForcedActionFormAsset = Asset.extend({
  balance: stringAsBigInt(),
  priceUSDCents: stringAsBigInt(),
})

export type NewForcedActionFormProps = z.infer<typeof NewForcedActionFormProps>
export const NewForcedActionFormProps = z.object({
  user: UserDetails,
  starkExAddress: stringAs(EthereumAddress),
  positionOrVaultId: stringAsBigInt(),
  starkKey: stringAs(StarkKey),
  asset: NewForcedActionFormAsset,
})

export function serializeForcedActionsFormProps(
  props: NewForcedActionFormProps
) {
  return toJsonWithoutBigInts(props)
}
