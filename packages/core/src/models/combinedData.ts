export class CombinedData {
  private _data?: any

  public add(p: { value: any; identifier: string }) {
    const { value, identifier } = p
    this._data = {
      ...this._data,
      ...value,
      original: { ...this._data?.original, [identifier]: value.original },
    }
  }
  public serialize() {
    return {
      ...this._data,
    }
  }
}
