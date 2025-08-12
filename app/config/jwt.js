require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = {
  generateTokens(user) {
    const payload = user.is_anonymous
      ? { id: user.id, device_id: user.device_id, is_anonymous: true }
      : { id: user.id, email: user.email };

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
