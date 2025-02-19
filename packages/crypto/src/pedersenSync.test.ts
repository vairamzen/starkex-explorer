import { PedersenHash } from '@explorer/types'
import { expect } from 'earljs'

import { pedersenSync } from './pedersenSync'

describe(pedersenSync.name, () => {
  it('hashes sample values', () => {
    const result = pedersenSync(
      PedersenHash(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      ),
      PedersenHash(
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      )
    )
    expect(result).toEqual(
      PedersenHash(
        '1235ac944ab0709debd2756fc26deddd25741d0fca5c5acefdbd49b74c68af'
      )
    )
  })

  it('hashes different sample values', () => {
    const result = pedersenSync(
      PedersenHash(
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde'
      ),
      PedersenHash(
        '11223344556677889900aabbccddeeff11223344556677889900aabbccddeef'
      )
    )
    expect(result).toEqual(
      PedersenHash(
        '63920cff837c3b73b4607e66d5f78c8f7f50e187f02ee8646ae4be674baddc1'
      )
    )
  })

  it('follows original example 1', () => {
    const result = pedersenSync(
      PedersenHash(
        '3d937c035c878245caf64531a5756109c53068da139362728feb561405371cb'
      ),
      PedersenHash(
        '208a0a10250e382e1e4bbe2880906c2791bf6275695e02fbbc6aeff9cd8b31a'
      )
    )
    expect(result).toEqual(
      PedersenHash(
        '30e480bed5fe53fa909cc0f8c4d99b8f9f2c016be4c41e13a4848797979c662'
      )
    )
  })

  it('follows original example 2', () => {
    const result = pedersenSync(
      PedersenHash(
        '58f580910a6ca59b28927c08fe6c43e2e303ca384badc365795fc645d479d45'
      ),
      PedersenHash(
        '78734f65a067be9bdb39de18434d71e79f7b6466a4b66bbd979ab9e7515fe0b'
      )
    )
    expect(result).toEqual(
      PedersenHash(
        '68cc0b76cddd1dd4ed2301ada9b7c872b23875d5ff837b3a87993e0d9996b87'
      )
    )
  })
})
