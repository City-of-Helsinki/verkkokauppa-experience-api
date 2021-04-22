export class CombinedData {
  private _data?: any

  public add(p: { value: any; identifier: string }) {
    const { value, identifier } = p
    this._data = {
      ...this._data,
      ...value,
      originals: { ...this._data?.originals, [identifier]: value.originals },
    }
  }
  public serialize() {
    return {
      ...this._data,
    }
  }
}
