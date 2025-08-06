export const requireVerification = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user?.isVerified) {
            return res.status(403).json({ 
                error: 'Please verify your email address',
                needsVerification: true
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking verification status' });
    }
};