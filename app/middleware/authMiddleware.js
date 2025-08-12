const jwt = require('jsonwebtoken');
const {User} = require('../models');
const {JWT_ACCESS_SECRET} = process.env;

module.exports = async (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({error: 'Authentication required'});
    }

    const token = authHeader.split(' ')[1];

    // Верифицируем токен
    console.log(token);
    let decoded = ''
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (error) {
      console.log(error);
    }
    console.log('decoded', decoded);

    // Находим пользователя и добавляем его в запрос
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({error: 'User not found'});
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({error: 'Token expired'});
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({error: 'Invalid token'});
    }
    res.status(500).json({error: 'Authentication failed'});
  }
};
