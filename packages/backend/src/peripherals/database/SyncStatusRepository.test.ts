import { expect } from 'earljs'

import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { KeyValueStore } from './KeyValueStore'
import { SyncStatusRepository } from './SyncStatusRepository'

describe(SyncStatusRepository.name, () => {
  it('writes value to store', async () => {
    const store = mock<KeyValueStore>({
      addOrUpdate: async () => 'lastBlockNumberSynced',
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    await repository.setLastSynced(20)
    expect(store.addOrUpdate).toHaveBeenCalledWith([
      { key: 'lastBlockNumberSynced', value: '20' },
    ])
  })

  it('reads value from store', async () => {
    const store = mock<KeyValueStore>({
      findByKey: async () => '20',
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(20)
    expect(store.findByKey).toHaveBeenCalledWith([
      'lastBlockNumberSynced',
      undefined,
    ])
  })

  it('returns undefined when store is empty', async () => {
    const store = mock<KeyValueStore>({
      findByKey: async () => undefined,
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(undefined)
  })

  it('returns undefined when the store is corrupt', async () => {
    const store = mock<KeyValueStore>({
      findByKey: async () => '3 is my favorite number',
    })
    const repository = new SyncStatusRepository(store, Logger.SILENT)

    const actual = await repository.getLastSynced()
    expect(actual).toEqual(undefined)
  })
})
