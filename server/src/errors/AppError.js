class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super('VALIDATION_ERROR', message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error') {
    super('EXTERNAL_SERVICE_ERROR', message, 502);
  }
}

class AIParsingError extends AppError {
  constructor(message = 'AI parsing failed') {
    super('AI_PARSING_ERROR', message, 502);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ExternalServiceError,
  AIParsingError,
};
