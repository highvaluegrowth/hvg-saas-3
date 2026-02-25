export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(code, message, 401);
    this.name = 'AuthError';
  }
}

export class TenantError extends AppError {
  constructor(message: string) {
    super('TENANT_ERROR', message, 403);
    this.name = 'TenantError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}
