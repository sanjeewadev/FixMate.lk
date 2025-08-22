// Usage: requireRole('admin') or requireRole('admin', 'coordinator')
module.exports = function requireRole(...roles) {
   roles = roles.flat();
  return (req, res, next) => {
    const role = req.user?.role; // set by verifyToken
    if (!role) return res.status(401).json({ message: 'Unauthorized User' });
    if (!roles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
};
