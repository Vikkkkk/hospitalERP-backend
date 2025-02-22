// backend-api/src/middlewares/RoleCheck.js

// Middleware for checking global and department roles
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
      const user = req.user; // Extract user from the authenticated request (set by authMiddleware)
  
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
      }
  
      const { globalRole, departmentRole } = user;
  
      // Allow access if user's global role or department role matches the allowed roles
      if (
        (globalRole && allowedRoles.includes(globalRole)) ||
        (departmentRole && allowedRoles.includes(departmentRole))
      ) {
        return next();
      }
  
      // Reject if no matching role found
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    };
  };
  
  module.exports = {
    authorizeRole,
  };
  