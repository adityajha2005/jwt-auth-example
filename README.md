# jwt-auth-example

A simple JWT authentication middleware example for Express.js applications.

## Installation

```bash
npm install
```

## Usage

The `auth.js` file provides an `authenticate` middleware function that can be used to protect routes in an Express application.

### Authentication Middleware

```javascript
const { authenticate } = require("./auth");

// Use in your Express routes
app.get("/protected", authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### How it works

1. Validates JWT_SECRET configuration is present
2. Extracts the JWT token from the `Authorization` header with Bearer prefix
3. Validates token format (proper JWT structure with 3 segments)
4. Verifies the token using `JWT_SECRET` with explicit algorithm specification
5. Sets `req.user` with the decoded token payload
6. Returns structured JSON error responses with appropriate status codes
7. Provides detailed server-side logging while keeping client errors generic

### Security Features

- **Algorithm Whitelisting**: Explicitly specifies allowed JWT algorithms (HS256, HS384, HS512) to prevent "none" algorithm attacks
- **Input Validation**: Validates Authorization header format and JWT structure before processing
- **Configuration Validation**: Ensures JWT_SECRET is configured before processing requests
- **Secure Error Handling**: Generic error messages to clients, detailed logging for debugging
- **Token Format Validation**: Checks for proper Bearer prefix and JWT structure
- **Expiration Handling**: Built-in support for token expiration via jsonwebtoken library

### Environment Variables

- `JWT_SECRET` - Secret key used to verify JWT tokens
- `PORT` - Server port (default: 3000)

### Running the Example Server

```bash
# Set your JWT secret
export JWT_SECRET=your-secret-key

# Start the server
npm start
```

## API Endpoints

- `GET /public` - Public endpoint (no authentication required)
- `GET /protected` - Protected endpoint (requires valid JWT token)

## Testing Authentication

To test the protected endpoint, include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3000/protected
```

## Generating Tokens

The module now exports a `generateToken` utility function for creating JWT tokens:

```javascript
const { generateToken } = require("./auth");

// Generate a token with 1 hour expiration
const token = generateToken({ userId: 123, role: "user" }, "1h");

// Generate a token with custom expiration
const longToken = generateToken({ userId: 456 }, "7d");
```

## Module Exports

- `authenticate` - Express middleware for JWT authentication
- `generateToken` - Utility function to create JWT tokens
- `AUTH_CONFIG` - Configuration constants (algorithms, error messages, etc.)
