import { localTimeFromDateTime } from '../service'

describe('service tests', () => {
  it('Should return correct date', async () => {
    const inputDateTime = '2022-11-05T23:59:11.999Z'

    const formattedTime = localTimeFromDateTime(inputDateTime)

    expect(formattedTime).toBe('23:59:11')
  })
})
