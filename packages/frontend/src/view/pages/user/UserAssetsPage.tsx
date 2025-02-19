import { TradingMode, UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getAssetsTableProps } from './common'
import { UserAssetEntry, UserAssetsTable } from './components/UserAssetTable'
import { UserPageTitle } from './components/UserPageTitle'

export interface UserAssetsPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  tradingMode: TradingMode
  assets: UserAssetEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserAssetsPage(props: UserAssetsPageProps) {
  return reactToHtml(<UserAssetsPage {...props} />)
}

function UserAssetsPage(props: UserAssetsPageProps) {
  const common = getAssetsTableProps(props.starkKey)
  return (
    <Page path={common.link} description="TODO: description" user={props.user}>
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={<UserPageTitle prefix="Assets of" starkKey={props.starkKey} />}
          visible={props.assets.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserAssetsTable
            starkKey={props.starkKey}
            tradingMode={props.tradingMode}
            assets={props.assets}
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
