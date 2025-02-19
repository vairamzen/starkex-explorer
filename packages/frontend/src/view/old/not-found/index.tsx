import React from 'react'

import { reactToHtml } from '../../reactToHtml'
import { NotFound } from './NotFound'
import { NotFoundProps } from './NotFoundProps'

export * from './NotFoundProps'

export function renderOldNotFoundPage(props: NotFoundProps) {
  return reactToHtml(<NotFound {...props} />)
}
