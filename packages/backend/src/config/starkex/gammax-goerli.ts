import { AssetId, EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { StarkexConfig } from './StarkexConfig'

export function getGammaxGoerliConfig(): StarkexConfig {
  return {
    dataAvailabilityMode: 'validium',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: getEnv('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 6934760,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0x6E5de338D71af33B57831C5552775f54394d181B'),
    },
    availabilityGateway: {
      url: getEnv('GAMMAX_AG_URL'),
      serverCertificate: getEnv('GAMMAX_AG_SERVER_CERTIFICATE'),
      userCertificate: getEnv('GAMMAX_AG_USER_CERTIFICATE'),
      userKey: getEnv('GAMMAX_AG_USER_KEY'),
    },
    collateralAsset: {
      assetId: AssetId('COLLATERAL-1'),
      price: 1n,
    },
  }
}
