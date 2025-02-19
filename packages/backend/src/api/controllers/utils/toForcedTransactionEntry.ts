import { ForcedTransactionEntry } from '@explorer/frontend'
import { AssetId } from '@explorer/types'

import { UserTransactionRecord } from '../../../peripherals/database/transactions/UserTransactionRepository'

export function toForcedTransactionEntry(
  record: UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>
): ForcedTransactionEntry {
  return {
    type:
      record.data.type === 'ForcedWithdrawal'
        ? 'exit'
        : record.data.isABuyingSynthetic
        ? 'buy'
        : 'sell',
    status: record.included ? 'verified' : 'mined',
    hash: record.transactionHash,
    // TODO: change the name of this field to reflect the fact that it no longer is the latest update
    lastUpdate: record.timestamp,
    amount:
      record.data.type === 'ForcedTrade'
        ? record.data.syntheticAmount
        : record.data.quantizedAmount,
    assetId:
      record.data.type === 'ForcedTrade'
        ? record.data.syntheticAssetId
        : AssetId.USDC,
    positionId:
      record.data.type === 'ForcedTrade'
        ? record.data.positionIdA
        : record.data.positionId,
  }
}
