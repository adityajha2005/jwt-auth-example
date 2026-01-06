// Sample authentication module
const jwt = require('jsonwebtoken');

function authenticateUser(req, res, next) {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // EU region check
    const region = req.headers['x-region'];
    if (region === 'EU') {
      // Special handling for EU users
      const decoded = jwt.verify(token, process.env.JWT_SECRET_EU);
      req.user = decoded;
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticateUser };
