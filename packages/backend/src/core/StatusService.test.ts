import { expect } from 'earljs'

import { StatusService } from './StatusService'

describe('StatusService', () => {
  it('returns the aggregate status', () => {
    const statusService = new StatusService({
      fooService: new FooService(),
      barService: new BarService(),
    })

    expect<unknown>(statusService.getStatus()).toEqual({
      fooService: { foo: 123 },
      barService: { bar: 'baz' },
    })
  })

  it('returns the list of reporters', () => {
    const statusService = new StatusService({
      fooService: new FooService(),
      barService: new BarService(),
    })

    expect(statusService.getReporters()).toEqual(['fooService', 'barService'])
  })

  it('returns the status of a reporter', () => {
    const statusService = new StatusService({
      fooService: new FooService(),
      barService: new BarService(),
    })

    expect<unknown>(statusService.getReporterStatus('fooService')).toEqual({
      foo: 123,
    })
  })

  it('throws for unknown reporters', () => {
    const statusService = new StatusService({
      fooService: new FooService(),
      barService: new BarService(),
    })

    expect(() => statusService.getReporterStatus('bazService')).toThrow(
      'Unknown reporter bazService!'
    )
  })
})

class FooService {
  getStatus() {
    return { foo: 123 }
  }
}

class BarService {
  getStatus() {
    return { bar: 'baz' }
  }
}
