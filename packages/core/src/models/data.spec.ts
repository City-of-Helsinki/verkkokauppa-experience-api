import { Data } from './data'
describe('Test data model', () => {
  it('Should construct data properly', () => {
    const data = { test: true }
    const model = new Data(data)
    expect(model.serialize()).toEqual(data)
  })
  it('Should set data correctly', () => {
    const data = { test: true }
    const model = new Data()
    model.data = data
    expect(model.serialize()).toEqual(data)
  })
  it('Should get data correctly', () => {
    const data = { test: true }
    const model = new Data(data)
    expect(model.data).toEqual(data)
  })
})
