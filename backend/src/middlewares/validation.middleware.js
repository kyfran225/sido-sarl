import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import logger from '../config/logger.js';

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
addFormats(ajv);

/**
 * Middleware to validate request body against JSON schema
 * @param {Object} schema - AJV schema object
 * @returns {Function} Middleware function
 */
export const validateRequest = (schema) => {
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const valid = validate(req.body);

    if (!valid) {
      const errors = validate.errors.map(err => ({
        field: err.instancePath || '/',
        message: err.message,
        value: err.data
      }));

      logger.warn({
        errors,
        body: req.body,
        url: req.originalUrl,
        method: req.method
      }, 'Request validation failed');

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }

    next();
  };
};
