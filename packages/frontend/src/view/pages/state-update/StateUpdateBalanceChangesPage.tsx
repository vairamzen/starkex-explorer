import { TradingMode, UserDetails } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getBalanceChangeTableProps } from './common'
import {
  StateUpdateBalanceChangeEntry,
  StateUpdateBalanceChangesTable,
} from './components/StateUpdateBalanceChangesTable'
import { StateUpdatePageTitle } from './components/StateUpdatePageTitle'

export interface StateUpdateBalanceChangesPageProps {
  user: UserDetails | undefined
  id: string
  tradingMode: TradingMode
  balanceChanges: StateUpdateBalanceChangeEntry[]
  limit: number
  offset: number
  total: number
}

export function renderStateUpdateBalanceChangesPage(
  props: StateUpdateBalanceChangesPageProps
) {
  return reactToHtml(<StateUpdateBalanceChangesPage {...props} />)
}

function StateUpdateBalanceChangesPage(
  props: StateUpdateBalanceChangesPageProps
) {
  const common = getBalanceChangeTableProps(props.id)
  return (
    <Page path={common.link} description="TODO: description" user={props.user}>
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={
            <StateUpdatePageTitle prefix="Balance changes of" id={props.id} />
          }
          visible={props.balanceChanges.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <StateUpdateBalanceChangesTable
            tradingMode={props.tradingMode}
            balanceChanges={props.balanceChanges}
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
