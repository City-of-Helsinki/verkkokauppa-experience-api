import { CombinedData } from './combinedData'

describe('Test that combined data combines correctly', () => {
  it('Should return empty data when not added yet', () => {
    const model = new CombinedData()
    expect(model.serialize()).toEqual({})
  })
  it('Should return null original if no original defined', () => {
    const model = new CombinedData()
    model.add({ value: { test: true }, identifier: 'namespace' })
    expect(model.serialize()).toEqual({
      test: true,
      original: { namespace: null },
    })
  })
  it('Should return correct original if original defined', () => {
    const data = { test: true, testDeep: { some: 'another' } }
    const original = {
      originalTest: false,
      originalDeep: { originalSome: 'originalAnother' },
    }
    const model = new CombinedData()
    model.add({
      value: { ...data, original },
      identifier: 'namespace',
    })
    expect(model.serialize()).toEqual({
      ...data,
      original: { namespace: original },
    })
  })
  it('Should merge data correctly with two namespaces', () => {
    const data = { test: true, testDeep: { some: 'another' } }
    const dataAnother = {
      testAnother: false,
      testDeepAnother: { someAnother: 'anotherAnother' },
    }
    const original = {
      originalTest: false,
      originalDeep: { originalSome: 'originalAnother' },
    }
    const originalAnother = {
      originalTestAnother: false,
      originalDeepAnother: { originalSomeAnother: 'originalAnotherAnother' },
    }
    const model = new CombinedData()
    model.add({
      value: { ...data, original },
      identifier: 'namespace',
    })
    model.add({
      value: { ...dataAnother, original: originalAnother },
      identifier: 'anotherNamespace',
    })
    expect(model.serialize()).toEqual({
      ...data,
      ...dataAnother,
      original: { namespace: original, anotherNamespace: originalAnother },
    })
  })
})
