import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      const error = new Error('Validation failed');
      error.status = 400;
      error.details = details;
      return next(error);
    }
    req[source] = source === 'params' ? { ...req[source], ...result.data } : result.data;
    return next();
  };
}

export function notFoundHandler(req, _res, next) {
  next({ status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((item) => ({ path: item.path, message: item.message }));
  }
  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }
  if (err.code === 11000) {
    status = 409;
    message = 'A record with those details already exists';
    details = err.keyValue;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    error: { message, ...(details ? { details } : {}) },
  });
}
