export interface CommonBackendRequest {
  id: string
}
export type CommonBackendHandler<T, Y> = (p: T) => Promise<Y>

export interface CommonExperienceRequest {
  id: string
}

export interface CommonBackendOriginals {
  [key: string]: any
}

export interface CartCreateBackendRequest {
  namespace: string
  user?: string
}

export interface CartCreateBackendResponse {
  cartId: string
  namespace: string
  user?: string
  createdAt: string
}

export interface CartBackendResponse extends CartCreateBackendResponse {
  [key: string]: any
}
