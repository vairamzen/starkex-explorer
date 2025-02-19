import { toSignableCancelOffer, toSignableCreateOffer } from '@explorer/shared'
import { EthereumAddress, Hash256, Timestamp } from '@explorer/types'
import { expect } from 'earljs'
import { Wallet } from 'ethers'

import { AccountService } from '../../core/AccountService'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { fakeAccepted, fakeOffer } from '../../test/fakes'
import { mock } from '../../test/mock'
import { ForcedTradeOfferController } from './ForcedTradeOfferController'
import * as tradeMock from './utils/ForcedTradeOfferMockData'

describe(ForcedTradeOfferController.name, () => {
  const stateUpdateId = 1
  const positionA = {
    positionId: tradeMock.offer.positionIdA,
    starkKey: tradeMock.offer.starkKeyA,
    collateralBalance: tradeMock.offer.collateralAmount,
    balances: [],
    stateUpdateId,
  }
  const positionB = {
    starkKey: tradeMock.accepted.starkKeyB,
    positionId: tradeMock.accepted.positionIdB,
    collateralBalance: 0n,
    balances: [
      {
        assetId: tradeMock.offer.syntheticAssetId,
        balance: tradeMock.offer.syntheticAmount,
      },
    ],
    stateUpdateId,
  }
  const wallet = Wallet.createRandom()
  const addressA = EthereumAddress(wallet.address)
  const userA = {
    id: 1,
    blockNumber: 1,
    starkKey: tradeMock.offer.starkKeyA,
    ethAddress: addressA,
  }
  const userB = {
    id: 2,
    blockNumber: 1,
    starkKey: tradeMock.accepted.starkKeyB,
    ethAddress: tradeMock.addressB,
  }
  const invalidSignature = '0x12345'

  const mockAccountService = mock<AccountService>({
    getAccount: async (address) =>
      address
        ? {
            address: address,
            positionId: 123n,
            hasUpdates: false,
          }
        : undefined,
  })

  describe(
    ForcedTradeOfferController.prototype.getOfferDetailsPage.name,
    () => {
      it('redirects to transaction page after submission', async () => {
        const offer = fakeOffer({
          accepted: fakeAccepted({ transactionHash: Hash256.fake() }),
        })
        const offerRepository = mock<ForcedTradeOfferRepository>({
          findById: async () => offer,
        })
        const controller = new ForcedTradeOfferController(
          mockAccountService,
          offerRepository,
          mock<PositionRepository>(),
          mock<UserRegistrationEventRepository>(),
          EthereumAddress.fake()
        )

        expect(
          await controller.getOfferDetailsPage(offer.id, undefined)
        ).toEqual({
          type: 'redirect',
          url: `/forced/${offer.accepted?.transactionHash?.toString() ?? ''}`,
        })
      })
    }
  )

  describe(ForcedTradeOfferController.prototype.postOffer.name, () => {
    it('blocks invalid signature', async () => {
      const offerRepository = mock<ForcedTradeOfferRepository>({
        add: async () => 1,
      })
      const positionRepository = mock<PositionRepository>({
        findById: async () => positionA,
      })
      const userRegistrationEventRepository =
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        })
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        offerRepository,
        positionRepository,
        userRegistrationEventRepository,
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'bad request',
        content: 'Your offer is invalid.',
      })
    })

    it('blocks missing position', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => undefined,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks missing user', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => positionA,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        }),
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks invalid balance', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => ({ ...positionA, collateralAmount: 0n }),
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'bad request',
        content: 'Your offer is invalid.',
      })
    })

    it('creates offer', async () => {
      const id = 1
      const offerRepository = mock<ForcedTradeOfferRepository>({
        add: async () => id,
      })
      const positionRepository = mock<PositionRepository>({
        findById: async () => positionA,
      })
      const userRegistrationEventRepository =
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        })
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        offerRepository,
        positionRepository,
        userRegistrationEventRepository,
        EthereumAddress.fake()
      )

      const request = toSignableCreateOffer(tradeMock.offer)
      const signature = await wallet.signMessage(request)
      expect(await controller.postOffer(tradeMock.offer, signature)).toEqual({
        type: 'created',
        content: { id },
      })
    })
  })

  describe(ForcedTradeOfferController.prototype.acceptOffer.name, () => {
    it('blocks missing position', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => undefined,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks missing user', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => positionA,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        }),
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks missing offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        mock<PositionRepository>({
          findById: async () => positionA,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'not found',
        content: 'Offer does not exist.',
      })
    })

    it('blocks accepted offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            id: 1,
            createdAt: Timestamp(Date.now() - 2000),
            ...tradeMock.offer,
            accepted: {
              ...tradeMock.accepted,
              at: Timestamp(Date.now() - 1000),
            },
          }),
        }),
        mock<PositionRepository>({
          findById: async () => positionA,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'bad request',
        content: 'Offer already accepted.',
      })
    })

    it('blocks cancelled offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            id: 1,
            createdAt: Timestamp(Date.now() - 2000),
            ...tradeMock.offer,
            cancelledAt: Timestamp(Date.now() - 1000),
          }),
        }),
        mock<PositionRepository>({
          findById: async () => positionA,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'bad request',
        content: 'Offer already cancelled.',
      })
    })

    it('blocks invalid signature', async () => {
      const id = 1
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          add: async () => id,
          findById: async () => ({
            ...tradeMock.offer,
            id,
            createdAt: Timestamp.now(),
          }),
        }),
        mock<PositionRepository>({
          findById: async (id) => {
            if (id === positionA.positionId) {
              return positionA
            }
            if (id === positionB.positionId) {
              return { ...positionB, balances: [] }
            }
          },
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === userA.starkKey) {
              return userA
            }
            if (starkKey === userB.starkKey) {
              return userB
            }
          },
        }),
        EthereumAddress.fake()
      )

      expect(
        await controller.acceptOffer(id, {
          ...tradeMock.accepted,
          signature: 'invalid',
        })
      ).toEqual({
        type: 'bad request',
        content: 'Invalid signature.',
      })
    })

    it('accepts offer', async () => {
      const id = 1
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          add: async () => id,
          findById: async () => ({
            id,
            createdAt: Timestamp.now(),
            ...tradeMock.offer,
          }),
          update: async () => 1,
        }),
        mock<PositionRepository>({
          findById: async (id) => {
            if (id === positionA.positionId) {
              return positionA
            }
            if (id === positionB.positionId) {
              return positionB
            }
          },
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === userA.starkKey) {
              return userA
            }
            if (starkKey === userB.starkKey) {
              return userB
            }
          },
        }),
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(id, tradeMock.accepted)).toEqual({
        type: 'success',
        content: 'Accept offer was submitted.',
      })
    })
  })

  describe(ForcedTradeOfferController.prototype.cancelOffer.name, () => {
    const id = 1
    const request = toSignableCancelOffer(id)
    const initial = {
      id,
      ...tradeMock.offer,
      createdAt: Timestamp(Date.now() - 1000),
      accepted: undefined,
    }
    const accepted = {
      ...initial,
      accepted: {
        ...tradeMock.accepted,
        at: Timestamp(Date.now() - 500),
      },
    }

    it('blocks missing offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>(),
        EthereumAddress.fake()
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'not found',
        content: 'Offer does not exist.',
      })
    })

    it('blocks cancelled offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...initial,
            cancelledAt: Timestamp.now(),
          }),
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>(),
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request)
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'bad request',
        content: 'Offer already cancelled.',
      })
    })

    it('blocks submitted offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...accepted,
            accepted: {
              ...accepted.accepted,
              transactionHash: Hash256.fake(),
            },
          }),
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>(),
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request)
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'bad request',
        content: 'Offer already submitted.',
      })
    })

    it('blocks missing position', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => accepted,
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        }),
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request)
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks invalid signature', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => accepted,
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request + 'tampered')
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'bad request',
        content: 'Signature does not match.',
      })
    })

    it('cancels offer', async () => {
      const controller = new ForcedTradeOfferController(
        mockAccountService,
        mock<ForcedTradeOfferRepository>({
          findById: async () => accepted,
          update: async () => 1,
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => ({
            ...userA,
            ethAddress: addressA,
          }),
        }),
        EthereumAddress.fake()
      )
      const signature = await wallet.signMessage(request)

      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'success',
        content: 'Offer cancelled.',
      })
    })
  })
})
