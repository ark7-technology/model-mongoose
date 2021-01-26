export class CircleDependencyError extends Error {
  constructor(public path: string) {
    super(`CircleDependencyError: ${path}`);
  }
}
