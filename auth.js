const jwt = require("jsonwebtoken");

/**
 * Authentication configuration and constants
 */
const AUTH_CONFIG = {
  // Allowed JWT algorithms (prevents "none" algorithm attack)
  ALLOWED_ALGORITHMS: ["HS256", "HS384", "HS512"],
  // Token prefix in Authorization header
  TOKEN_PREFIX: "Bearer ",
  // Error messages (generic for client, specific for logs)
  ERRORS: {
    NO_TOKEN: "Authentication required",
    INVALID_TOKEN: "Invalid or expired token",
    INVALID_SECRET: "JWT_SECRET environment variable is not configured",
  },
};

/**
 * Validates that required environment variables are configured
 * @throws {Error} If JWT_SECRET is not configured
 */
function validateConfig() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
    throw new Error(AUTH_CONFIG.ERRORS.INVALID_SECRET);
  }
}

/**
 * Extracts and validates the JWT token from the Authorization header
 * @param {string} authHeader - The Authorization header value
 * @returns {string|null} The extracted token or null if invalid
 */
function extractToken(authHeader) {
  // Check if Authorization header exists and is a string
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  // Check if header has Bearer prefix
  if (!authHeader.startsWith(AUTH_CONFIG.TOKEN_PREFIX)) {
    return null;
  }

  // Extract token after "Bearer "
  const token = authHeader.substring(AUTH_CONFIG.TOKEN_PREFIX.length).trim();

  // Validate token format (should not be empty and should contain two dots for JWT structure)
  if (!token || token.split(".").length !== 3) {
    return null;
  }

  return token;
}

/**
 * Verifies the JWT token using secure options
 * @param {string} token - The JWT token to verify
 * @returns {object} The decoded token payload
 * @throws {Error} If token verification fails
 */
function verifyToken(token) {
  // Verify with explicit algorithm specification to prevent algorithm confusion attacks
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: AUTH_CONFIG.ALLOWED_ALGORITHMS,
  });
}

/**
 * Express middleware for JWT authentication
 * Validates JWT tokens from the Authorization header and attaches user data to the request
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 *
 * @example
 * app.get('/protected', authenticate, (req, res) => {
 *   res.json({ user: req.user });
 * });
 */
function authenticate(req, res, next) {
  try {
    // Validate configuration on first use
    validateConfig();

    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization);

    if (!token) {
      // Log for debugging (in production, use proper logging framework)
      console.warn("Authentication failed: No valid token provided");
      return res.status(401).json({
        error: AUTH_CONFIG.ERRORS.NO_TOKEN,
      });
    }

    // Verify token and extract payload
    const decoded = verifyToken(token);

    // Attach decoded user data to request object
    req.user = decoded;

    // Proceed to next middleware
    next();
  } catch (error) {
    // Log detailed error for debugging (in production, use proper logging framework)
    console.error("Authentication error:", error.message);

    // Determine appropriate error response
    let statusCode = 401;
    let errorMessage = AUTH_CONFIG.ERRORS.INVALID_TOKEN;

    // Configuration errors should return 500
    if (error.message === AUTH_CONFIG.ERRORS.INVALID_SECRET) {
      statusCode = 500;
      errorMessage = "Server configuration error";
    }

    // Return generic error to client (don't expose internal details)
    return res.status(statusCode).json({
      error: errorMessage,
    });
  }
}

/**
 * Creates a JWT token (utility function for testing/development)
 * @param {object} payload - The data to encode in the token
 * @param {string} expiresIn - Token expiration time (e.g., "1h", "7d")
 * @returns {string} The generated JWT token
 *
 * @example
 * const token = generateToken({ userId: 123, role: 'user' }, '1h');
 */
function generateToken(payload, expiresIn = "1h") {
  validateConfig();
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: AUTH_CONFIG.ALLOWED_ALGORITHMS[0],
    expiresIn,
  });
}

module.exports = {
  authenticate,
  generateToken,
  AUTH_CONFIG,
};
