import React from 'react'

import { reactToHtml } from '../../reactToHtml'
import { PositionAtUpdate } from './PositionAtUpdate'
import { PositionAtUpdateProps } from './PositionAtUpdateProps'
import { PositionDetails } from './PositionDetails'
import { PositionDetailsProps } from './PositionDetailsProps'

export * from './PositionAtUpdateProps'
export * from './PositionDetailsProps'

export function renderOldPositionDetailsPage(props: PositionDetailsProps) {
  return reactToHtml(<PositionDetails {...props} />)
}

export function renderOldPositionAtUpdatePage(props: PositionAtUpdateProps) {
  return reactToHtml(<PositionAtUpdate {...props} />)
}
