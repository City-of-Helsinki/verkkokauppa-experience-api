export interface CommonBackendRequest {
  id: string
}
export type CommonBackendHandler<T> = (p: CommonBackendRequest) => Promise<T>

export interface CommonExperienceRequest {
  id: string
}
