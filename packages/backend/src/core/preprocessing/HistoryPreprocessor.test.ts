import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'

class NonAbstractHistoryPreprocessor extends HistoryPreprocessor<AssetId> {
  async preprocessNextStateUpdate() {}
}

describe(HistoryPreprocessor.name, () => {
  describe(HistoryPreprocessor.prototype.closePositionOrVault.name, () => {
    it('should add new history records with 0 balance for all nonempty positions', async () => {
      const starkKey = StarkKey.fake()
      const trx = mock<Knex.Transaction>()
      const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
        getCurrentByPositionOrVaultId: async () => [
          {
            historyId: 10,
            stateUpdateId: 1_000,
            blockNumber: 1_000,
            timestamp: Timestamp(123_456_789n),
            starkKey: starkKey,
            positionOrVaultId: 5n,
            assetHashOrId: AssetId('ETH-9'),
            balance: 2_000_000n,
            prevBalance: 800_000n,
            price: 666_000n,
            prevPrice: undefined,
            isCurrent: true,
            prevHistoryId: undefined,
          },
          {
            historyId: 13,
            stateUpdateId: 1_000,
            blockNumber: 1_000,
            timestamp: Timestamp(123_456_789n),
            starkKey: starkKey,
            positionOrVaultId: 5n,
            assetHashOrId: AssetId('WBTC-9'),
            balance: 3_000_000n,
            prevBalance: 1_000_000n,
            price: 8_888_000n,
            prevPrice: 7_777_000n,
            isCurrent: true,
            prevHistoryId: 12,
          },
        ],
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )
      const mockAddNewRecordsAndUpdateIsCurrent = mockFn().resolvesTo([])
      preprocessor.addNewRecordsAndUpdateIsCurrent =
        mockAddNewRecordsAndUpdateIsCurrent

      await preprocessor.closePositionOrVault(
        trx,
        5n,
        mock<StateUpdateRecord>({
          id: 1_005,
          blockNumber: 1_005,
          timestamp: Timestamp(223_456_789n),
        }),
        {
          'ETH-9': 777_000n,
          'WBTC-9': 9_999_000n,
        }
      )
      expect(mockAddNewRecordsAndUpdateIsCurrent).toHaveBeenCalledWith([
        trx,
        [
          {
            assetHashOrId: AssetId('ETH-9'),
            balance: 0n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 2_000_000n,
            prevHistoryId: 10,
            prevPrice: 666_000n,
            price: 777_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
          },
          {
            assetHashOrId: AssetId('WBTC-9'),
            balance: 0n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 3_000_000n,
            prevHistoryId: 13,
            prevPrice: 8_888_000n,
            price: 9_999_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
          },
        ],
      ])
    })

    it('should handle case where there are no records to close', async () => {
      const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
        getCurrentByPositionOrVaultId: async () => [],
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )
      const mockAddNewRecordsAndUpdateIsCurrent = mockFn().rejectsWith(
        new Error('should not have been called')
      )
      preprocessor.addNewRecordsAndUpdateIsCurrent =
        mockAddNewRecordsAndUpdateIsCurrent
      const trx = mock<Knex.Transaction>()

      await preprocessor.closePositionOrVault(
        trx,
        5n,
        mock<StateUpdateRecord>({
          id: 1_005,
          blockNumber: 1_005,
          timestamp: Timestamp(223_456_789n),
        }),
        {
          'ETH-9': 777_000n,
          'WBTC-9': 9_999_000n,
        }
      )
    })
  })

  describe(
    HistoryPreprocessor.prototype.addNewRecordsAndUpdateIsCurrent.name,
    () => {
      it('should clear isCurrent on old records and set on new ones with balance > 0', async () => {
        const trx = mock<Knex.Transaction>()
        const starkKey = StarkKey.fake()
        const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
          unsetCurrentByPositionOrVaultIdAndAsset: async () => 2,
          add: async () => 2,
        })
        const preprocessor = new NonAbstractHistoryPreprocessor(
          historyRepo,
          Logger.SILENT
        )
        await preprocessor.addNewRecordsAndUpdateIsCurrent(trx, [
          {
            assetHashOrId: AssetId('ETH-9'),
            balance: 100_000n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 2_000_000n,
            prevHistoryId: 10,
            prevPrice: 666_000n,
            price: 777_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
          },
          {
            assetHashOrId: AssetId('WBTC-9'),
            balance: 0n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 3_000_000n,
            prevHistoryId: 13,
            prevPrice: 8_888_000n,
            price: 9_999_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
          },
        ])
        // Check that current records where set as isCurrent = false
        expect(
          historyRepo.unsetCurrentByPositionOrVaultIdAndAsset
        ).toHaveBeenCalledWith([5n, AssetId('ETH-9'), trx])
        expect(
          historyRepo.unsetCurrentByPositionOrVaultIdAndAsset
        ).toHaveBeenCalledWith([5n, AssetId('WBTC-9'), trx])
        expect(
          historyRepo.unsetCurrentByPositionOrVaultIdAndAsset.calls.length
        ).toEqual(2)

        // Check that new records where added with correct isCurrent
        expect(historyRepo.add).toHaveBeenCalledWith([
          {
            assetHashOrId: AssetId('ETH-9'),
            balance: 100_000n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 2_000_000n,
            prevHistoryId: 10,
            prevPrice: 666_000n,
            price: 777_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
            isCurrent: true,
          },
          trx,
        ])

        // When balance = 0, isCurrent should be set to false
        expect(historyRepo.add).toHaveBeenCalledWith([
          {
            assetHashOrId: AssetId('WBTC-9'),
            balance: 0n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 3_000_000n,
            prevHistoryId: 13,
            prevPrice: 8_888_000n,
            price: 9_999_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
            isCurrent: false,
          },
          trx,
        ])
        expect(historyRepo.add.calls.length).toEqual(2)
      })
    }
  )

  describe(HistoryPreprocessor.prototype.rollbackOneStateUpdate.name, () => {
    it('should delete relevant records and set current to their prevHistoryId', async () => {
      const trx = mock<Knex.Transaction>()
      const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
        getPrevHistoryByStateUpdateId: async () => [
          { historyId: 10, prevHistoryId: 9 },
          { historyId: 100, prevHistoryId: 90 },
          { historyId: 1000, prevHistoryId: 900 },
          { historyId: 10000, prevHistoryId: undefined },
        ],
        deleteByHistoryId: async () => 1,
        setAsCurrentByHistoryId: async () => 1,
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )

      await preprocessor.rollbackOneStateUpdate(trx, 123)

      expect(historyRepo.getPrevHistoryByStateUpdateId).toHaveBeenCalledWith([
        123,
        trx,
      ])
      expect(historyRepo.deleteByHistoryId).toHaveBeenCalledExactlyWith([
        [10, trx],
        [100, trx],
        [1000, trx],
        [10000, trx],
      ])
      expect(historyRepo.setAsCurrentByHistoryId).toHaveBeenCalledExactlyWith([
        [9, trx],
        [90, trx],
        [900, trx],
      ])
    })
  })
})
