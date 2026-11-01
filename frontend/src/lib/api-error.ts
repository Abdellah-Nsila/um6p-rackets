// The error thrown by api() for every failed request.
// It lives outside src/lib/api/ so components can use it in `instanceof` checks.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}