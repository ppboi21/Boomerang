// An error with an HTTP status code. Thrown from controllers and turned into a
// JSON response by the error handler middleware.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
