import { expect } from 'earljs'

import { formatWithPrecision } from './formatNumber'

describe(formatWithPrecision.name, () => {
  const cases: [number, number, string][] = [
    [0, 0, '0'],
    [1, 0, '1'],
    [12, 0, '12'],
    [123, 0, '123'],
    [1234, 0, '1,234'],
    [12345, 0, '12,345'],
    [123456, 0, '123,456'],
    [1234567, 0, '1,234,567'],
    [0, 2, '0.00'],
    [1, 2, '0.01'],
    [12, 2, '0.12'],
    [123, 2, '1.23'],
    [1234, 2, '12.34'],
    [12345, 2, '123.45'],
    [123456, 2, '1,234.56'],
    [1234567, 2, '12,345.67'],
    [12345671234567, 7, '1,234,567.1234567'],
    [-1, 0, '-1'],
    [-12, 0, '-12'],
    [-123, 0, '-123'],
    [-1234, 0, '-1,234'],
    [-12345, 0, '-12,345'],
    [-123456, 0, '-123,456'],
    [-1234567, 0, '-1,234,567'],
    [-1, 2, '-0.01'],
    [-12, 2, '-0.12'],
    [-123, 2, '-1.23'],
    [-1234, 2, '-12.34'],
    [-12345, 2, '-123.45'],
    [-123456, 2, '-1,234.56'],
    [-1234567, 2, '-12,345.67'],
    [-12345671234567, 7, '-1,234,567.1234567'],
  ]

  for (const [value, precision, expected] of cases) {
    it(`formats ${value} with ${precision} precision as ${expected}`, () => {
      const result = formatWithPrecision(value, precision)
      expect(result).toEqual(expected)
    })
  }
})
