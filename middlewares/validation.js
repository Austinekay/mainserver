
const validateRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Validate name
  if (!name || typeof name !== 'string' || name.length < 2) {
    return res.status(400).json({
      message: 'Name must be at least 2 characters long',
    });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Please provide a valid email address',
    });
  }

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long',
    });
  }

  // Validate role
  if (role && !['user', 'shop_owner'].includes(role)) {
    return res.status(400).json({
      message: 'Invalid role specified',
    });
  }

  return next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Please provide a valid email address',
    });
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Please provide a password',
    });
  }

  return next();
};

module.exports = {
  validateRegistration,
  validateLogin,
};
