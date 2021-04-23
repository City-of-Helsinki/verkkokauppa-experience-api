interface ResultProps<T> {
  isSuccess: boolean
  error?: string | T
  data?: T
}
export class Result<T> {
  public isSuccess: boolean
  public isFailure: boolean
  public error?: T | string
  private readonly _data?: T

  public constructor(p: ResultProps<T>) {
    const { isSuccess, error, data } = p
    if (isSuccess && error) {
      throw new Error(
        'InvalidOperation: A result cannot be successful and contain an error'
      )
    }

    if (!isSuccess && !error) {
      throw new Error(
        'InvalidOperation: A failing result needs to contain an error message'
      )
    }

    this.isSuccess = isSuccess
    this.isFailure = !isSuccess
    this.error = error
    this._data = data

    Object.freeze(this)
  }

  public getData(): T | undefined {
    if (this.isFailure) {
      return this.error as T
    }

    return this._data
  }

  public static success<U>(data?: U): Result<U> {
    return new Result<U>({ isSuccess: true, data })
  }

  public static failure<U>(error: any): Result<U> {
    return new Result<U>({ isSuccess: false, error })
  }
}
