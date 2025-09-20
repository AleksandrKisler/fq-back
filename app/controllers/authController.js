const jwt = require('../config/jwt');
const {User} = require('../models');

function toPlainUser(user) {
  if (!user) {
    return null;
  }
  const plain = typeof user.get === 'function' ? user.get({plain: true}) : {...user};
  if (plain && Object.prototype.hasOwnProperty.call(plain, 'password')) {
    delete plain.password;
  }
  return plain;
}

module.exports = {
  async register(req, res) {
    try {
      const {name, email, password} = req.body;

      const existingUser = await User.findOne({where: {email}});
      if (existingUser) {
        return res.status(422).json({error: 'Неправильный email'});
      }

      const user = await User.create({
        name,
        email,
        password
      });

      const tokens = jwt.generateTokens(user);

      res.status(200).json({user: toPlainUser(user), token: {...tokens}});
    } catch (error) {
      res.status(401).json({error: 'Ошибка регистрации', statusCode: 401, message: error.message});
    }
  },

  async login(req, res) {
    try {
      const {email, password} = req.body;
      const user = await User.findOne({where: {email}});

      if (!user || !user.isValidPassword(password)) {
        return res.status(401).json({error: 'Неправильный email или пароль'});
      }

      const tokens = jwt.generateTokens(user);

      res.json({user: toPlainUser(user), token: {...tokens}});
    } catch (error) {
      res.status(500).json({error: 'Login failed'});
    }
  },

  async refresh(req, res) {
    try {
      const {refreshToken} = req.body;
      const decoded = jwt.verifyRefreshToken(refreshToken);

      const user = await User.findByPk(decoded.id);
      if (!user) throw new Error('User not found');

      const tokens = jwt.generateTokens(user);

      res.json({
        user: toPlainUser(user),
        token: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      res.status(401).json({error: error.message});
    }
  },

  async createAnonymousUser(req, res) {
    try {
      const {device_id} = req.body;
      if (!device_id) {
        return res.status(422).json({error: 'Device ID обязателен'});
      }
      let user = await User.findOne({where: {device_id}});

      if (!user) {
        user = await User.create({
          device_id: device_id,
          name: 'Anonymous User',
          email: `${device_id}-box@anon.com`,
          is_anonymous: true,
          password: 'device'
        });
      }

      const tokens = jwt.generateTokens(user);

      res.status(200).json({
        user: {
          id: user.id,
          device_id: user.device_id,
          is_anonymous: user.is_anonymous,
          is_admin: user.is_admin,
        },
        token: {...tokens}
      });
    } catch (error) {
      res.status(404).json({error: 'Анонимный пользователь не найден', message: error.message});
    }
  },

  async convertToRegularUser(req, res) {
    try {
      const {id} = req.user; // ID анонимного пользователя из токена
      const {name, email, password} = req.body;

      const user = await User.findByPk(id);

      if (!user || !user.is_anonymous) {
        return res.status(422).json({error: 'Пользователь не найден'});
      }

      const existingUser = await User.findOne({where: {email}});
      if (existingUser) {
        return res.status(422).json({error: 'Почта введена не верно'});
      }

      await user.update({
        name,
        email,
        password,
        is_anonymous: false,
        device_id: null
      });

      const tokens = jwt.generateTokens(user);

      res.status(200).json({user: toPlainUser(user), token: {...tokens}});
    } catch (error) {
      res.status(500).json({error: 'Ошибка в создании пользователя', message: error.message});
    }
  }
};
