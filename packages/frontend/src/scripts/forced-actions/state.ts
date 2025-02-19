import { AssetId } from '@explorer/types'

import { formatCurrencyInput } from '../../utils/formatting/formatCurrencyInput'
import { NewForcedActionFormProps } from '../../view/pages/forced-actions/NewForcedActionFormProps'
import { FormAction, FormState } from './types'
import { getFormType, parseCurrencyInput } from './utils'

export function getInitialState(props: NewForcedActionFormProps): FormState {
  const { hashOrId, balance, priceUSDCents } = props.asset
  const assetId = AssetId(hashOrId.toString())
  const type = getFormType(assetId, balance)
  const candidate: FormState = {
    props,
    assetId,
    balance,
    priceUSDCents,
    type,
    amountInputString: '',
    amountInputValue: 0n,
    amountInputError: false,
    priceInputString: '',
    priceInputValue: 0n,
    totalInputString: '',
    totalInputValue: 0n,
    boundVariable: 'price',
    canSubmit: false,
  }
  return candidate
}

export function nextFormState(state: FormState, action: FormAction): FormState {
  if (action.type === 'ModifyAmount') {
    const parsed = parseCurrencyInput(action.value, state.assetId)
    const amountInputString =
      parsed !== undefined ? action.value : state.amountInputString
    const amountInputValue = parsed ?? state.amountInputValue

    if (state.boundVariable === 'price') {
      return stateFromAmountAndPrice(
        state,
        amountInputString,
        amountInputValue,
        state.priceInputString,
        state.priceInputValue
      )
    } else {
      return stateFromAmountAndTotal(
        state,
        amountInputString,
        amountInputValue,
        state.totalInputString,
        state.totalInputValue
      )
    }
  }

  if (action.type === 'ModifyPrice') {
    const parsed = parseCurrencyInput(action.value, AssetId.USDC)
    const priceInputString =
      parsed !== undefined ? action.value : state.priceInputString
    const priceInputValue = parsed ?? state.priceInputValue
    return stateFromAmountAndPrice(
      state,
      state.amountInputString,
      state.amountInputValue,
      priceInputString,
      priceInputValue
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (action.type === 'ModifyTotal') {
    const parsed = parseCurrencyInput(action.value, AssetId.USDC)
    const totalInputString =
      parsed !== undefined ? action.value : state.totalInputString
    const totalInputValue = parsed ?? state.totalInputValue
    return stateFromAmountAndTotal(
      state,
      state.amountInputString,
      state.amountInputValue,
      totalInputString,
      totalInputValue
    )
  }

  return state
}

function stateFromAmountAndPrice(
  state: FormState,
  amountInputString: string,
  amountInputValue: bigint,
  priceInputString: string,
  priceInputValue: bigint
): FormState {
  if (amountInputString === '' || priceInputString === '') {
    return withChecks({
      ...state,
      boundVariable: 'price',
      amountInputString,
      amountInputValue,
      priceInputString,
      priceInputValue,
      totalInputString: '',
      totalInputValue: 0n,
    })
  }
  const totalInputValue =
    (amountInputValue * priceInputValue) /
    10n ** BigInt(AssetId.decimals(state.assetId))
  return withChecks({
    ...state,
    boundVariable: 'price',
    amountInputString,
    amountInputValue,
    priceInputString,
    priceInputValue,
    totalInputString: formatCurrencyInput(totalInputValue, AssetId.USDC),
    totalInputValue,
  })
}

function stateFromAmountAndTotal(
  state: FormState,
  amountInputString: string,
  amountInputValue: bigint,
  totalInputString: string,
  totalInputValue: bigint
): FormState {
  if (amountInputString === '' || totalInputString === '') {
    return withChecks({
      ...state,
      boundVariable: 'total',
      amountInputString,
      amountInputValue,
      totalInputString,
      totalInputValue,
      priceInputString: '',
      priceInputValue: 0n,
    })
  }
  const priceInputValue =
    (totalInputValue * 10n ** BigInt(AssetId.decimals(state.assetId))) /
    amountInputValue

  return withChecks({
    ...state,
    boundVariable: 'total',
    amountInputString,
    amountInputValue,
    totalInputString,
    totalInputValue,
    priceInputString: formatCurrencyInput(priceInputValue, AssetId.USDC),
    priceInputValue,
  })
}

function withChecks(state: FormState): FormState {
  const balance = state.balance
  const absolute = balance < 0 ? -balance : balance

  if (state.assetId === AssetId.USDC && balance < 0) {
    return {
      ...state,
      amountInputError: true,
      canSubmit: false,
    }
  }
  if (state.amountInputValue > absolute) {
    return {
      ...state,
      amountInputError: true,
      canSubmit: false,
    }
  }

  if (state.type === 'withdraw') {
    return {
      ...state,
      amountInputError: false,
      canSubmit: state.amountInputValue > 0n,
    }
  }

  return {
    ...state,
    amountInputError: false,
    canSubmit:
      state.amountInputValue > 0n &&
      state.priceInputValue > 0n &&
      state.totalInputValue > 0n,
  }
}
