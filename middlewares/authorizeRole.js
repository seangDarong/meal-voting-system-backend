export const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated (this should come after authenticateToken)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Check if user has one of the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
                    requiredRoles: allowedRoles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            console.error('Role authorization error:', error);
            res.status(500).json({
                success: false,
                error: 'Authorization check failed'
            });
        }
    };
};