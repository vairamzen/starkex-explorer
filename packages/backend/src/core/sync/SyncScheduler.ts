import assert from 'assert'

import { BlockRange } from '../../model'
import { SyncStatusRepository } from '../../peripherals/database/SyncStatusRepository'
import { JobQueue } from '../../tools/JobQueue'
import { Logger } from '../../tools/Logger'
import { DataSyncService } from '../DataSyncService'
import { BlockDownloader } from './BlockDownloader'
import {
  INITIAL_SYNC_STATE,
  SyncSchedulerAction,
  syncSchedulerReducer,
  SyncState,
} from './syncSchedulerReducer'

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE
  private jobQueue: JobQueue

  constructor(
    private readonly syncStatusRepository: SyncStatusRepository,
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService: DataSyncService,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
    this.jobQueue = new JobQueue({ maxConcurrentJobs: 1 }, this.logger)
  }

  async start() {
    const lastSynced =
      await this.syncStatusRepository.getLastBlockNumberSynced()

    await this.dataSyncService.discardAfter(lastSynced)

    this.logger.info('start', { lastSynced })

    this.blockDownloader
      .getKnownBlocks(lastSynced)
      .then((blocks) => this.dispatch({ type: 'init', blocks }))

    this.blockDownloader.onNewBlock((block) =>
      this.dispatch({ type: 'newBlocks', blocks: [block] })
    )

    this.blockDownloader.onReorg((blocks) =>
      this.dispatch({ type: 'reorg', blocks })
    )
  }

  private dispatch(action: SyncSchedulerAction) {
    this.jobQueue.add({
      name: 'action',
      execute: async () => {
        const [newState, effect] = syncSchedulerReducer(this.state, action)
        if (effect === 'sync') {
          await this.handleSync(newState)
        } else if (effect === 'discardAfter') {
          await this.handleDiscardAfter(newState)
        }

        this.state = newState

        this.logger.debug({
          method: 'dispatch',
          action: action.type,
          ...('success' in action && { success: action.success }),
          ...('blocks' in action &&
            action.blocks.length && {
              blocksRange: [
                action.blocks[0].number,
                action.blocks[action.blocks.length - 1].number,
              ].join(' - '),
            }),
        })
      },
    })
  }

  private async handleSync({
    blocksProcessing,
    latestBlockProcessed,
  }: SyncState) {
    await this.syncStatusRepository.setLastBlockNumberSynced(
      latestBlockProcessed
    )
    try {
      await this.dataSyncService.sync(new BlockRange(blocksProcessing))
      this.dispatch({ type: 'syncFinished', success: true })
    } catch (err) {
      this.dispatch({ type: 'syncFinished', success: false })
      this.logger.error(err)
    }
  }

  private async handleDiscardAfter({
    blocksToProcess,
    latestBlockProcessed,
  }: SyncState) {
    await this.syncStatusRepository.setLastBlockNumberSynced(
      latestBlockProcessed
    )

    assert(blocksToProcess.first, 'blocksToProcess.first must be defined')

    try {
      await this.dataSyncService.discardAfter(blocksToProcess.first.number - 1)
      this.dispatch({ type: 'discardFinished', success: true })
    } catch (err) {
      this.dispatch({ type: 'discardFinished', success: false })
      this.logger.error(err)
    }
  }
}
