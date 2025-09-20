require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = {
  generateTokens(user) {
    const getValue = (field) => {
      if (typeof user.get === 'function') {
        const value = user.get(field);
        if (typeof value !== 'undefined') {
          return value;
        }
      }
      return user[field];
    };

    const isAnonymous = !!getValue('is_anonymous');
    const isAdmin = !!getValue('is_admin');

    const payload = isAnonymous
      ? { id: user.id, device_id: user.device_id, is_anonymous: true, is_admin: isAdmin }
      : { id: user.id, email: user.email, is_admin: isAdmin };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  },

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  },

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }
};
