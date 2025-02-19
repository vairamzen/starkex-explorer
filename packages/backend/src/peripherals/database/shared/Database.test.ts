import { expect } from 'earljs'
import { readdirSync } from 'fs'
import path from 'path'

import { getTestDatabase } from '../../../test/database'
import { Database } from './Database'

describe(Database.name, () => {
  it('can run and rollback all migrations', async function () {
    const { database, skip } = getTestDatabase()
    if (skip) {
      this.skip()
    }

    await database.migrateToLatest()
    await database.rollbackAll()

    const knex = await database.getKnex()
    const result = await knex.raw(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()'
    )
    const tables = result.rows.map((x: { table_name: string }) => x.table_name)

    expect(tables).toEqual(['knex_migrations', 'knex_migrations_lock'])

    await database.closeConnection()
  })

  it('migrations have consecutive numbering', () => {
    const migrationsDirectory = path.resolve(__dirname, '../migrations')
    const fileNames = readdirSync(migrationsDirectory).sort()
    for (const [i, fileName] of fileNames.entries()) {
      const number = parseInt(fileName.slice(0, 3))
      expect(number).toEqual(i + 1)
    }
  })
})
