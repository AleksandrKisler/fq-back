module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = req.user;
  const getValue = (field) => {
    if (!user) return undefined;
    if (typeof user.get === 'function') {
      const value = user.get(field);
      if (typeof value !== 'undefined') {
        return value;
      }
    }
    return user[field];
  };

  const isAdmin = getValue('is_admin') ?? getValue('isAdmin');

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
