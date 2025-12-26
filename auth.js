const jwt = require("jsonwebtoken");

/**
 * Authentication errors with specific codes for better error handling
 */
class AuthenticationError extends Error {
  constructor(message, code, statusCode = 401) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Error codes for authentication failures
 */
const AUTH_ERROR_CODES = {
  NO_TOKEN: "NO_TOKEN",
  INVALID_FORMAT: "INVALID_FORMAT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  NO_SECRET: "NO_SECRET"
};

/**
 * Extracts and validates the Bearer token from the Authorization header
 * @param {string} authHeader - The Authorization header value
 * @returns {string} The extracted token
 * @throws {AuthenticationError} If token is missing or malformed
 */
function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== "string") {
    throw new AuthenticationError(
      "Authorization header is required",
      AUTH_ERROR_CODES.NO_TOKEN
    );
  }

  const parts = authHeader.trim().split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AuthenticationError(
      "Authorization header must be in format: Bearer <token>",
      AUTH_ERROR_CODES.INVALID_FORMAT
    );
  }

  const token = parts[1];
  
  if (!token || token.length === 0) {
    throw new AuthenticationError(
      "Token cannot be empty",
      AUTH_ERROR_CODES.NO_TOKEN
    );
  }

  return token;
}

/**
 * Verifies JWT token and returns decoded payload
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The secret key for verification
 * @returns {object} The decoded token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
function verifyToken(token, secret) {
  if (!secret) {
    throw new AuthenticationError(
      "JWT secret is not configured",
      AUTH_ERROR_CODES.NO_SECRET,
      500
    );
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationError(
        "Token has expired",
        AUTH_ERROR_CODES.TOKEN_EXPIRED
      );
    }
    
    if (error.name === "JsonWebTokenError") {
      throw new AuthenticationError(
        "Invalid token signature or format",
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
    }
    
    throw new AuthenticationError(
      "Token verification failed",
      AUTH_ERROR_CODES.INVALID_TOKEN
    );
  }
}

/**
 * Express middleware for JWT authentication
 * Validates the Bearer token from Authorization header and attaches decoded user to req.user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }
    
    return res.status(500).json({
      error: "Internal server error during authentication"
    });
  }
}

module.exports = { 
  authenticate,
  AuthenticationError,
  AUTH_ERROR_CODES,
  extractBearerToken,
  verifyToken
};
