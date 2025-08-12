import WishList from '../models/wishList.js';
import Dish from '../models/dish.js';

const COOLDOWN_SECONDS = 3600; // 1 hour

// GET /api/wishes/mine
// GET /api/wishes/mine
export const getMyWish = async (req, res) => {
    try {
        console.log('Looking for userId:', req.user.id);
        console.log('User ID type:', typeof req.user.id);
        
        const wish = await WishList.findOne({
            where: { userId: req.user.id },
            include: [{ 
                model: Dish, 
                attributes: ['name', 'imageURL']
                // Remove foreignKey: 'dishId' from here
            }]
        });
        
        console.log('Found wish:', wish ? wish.toJSON() : 'null');
        
        if (!wish) return res.status(404).json({ message: 'Wish not found' });

        res.json({
            dishId: wish.dishId,
            dishName: wish.Dish ? wish.Dish.name : null,
            image: wish.Dish ? wish.Dish.imageURL : null,
            updatedAt: wish.updatedAt
        });
    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/wishes
export const updateWish = async (req, res) => {
    const { dishId } = req.body;
    if (!dishId) return res.status(400).json({ message: 'dishId required' });

    try {
        const wish = await WishList.findOne({ where: { userId: req.user.id } });
        if (!wish) return res.status(404).json({ message: 'Wish not found' });

        const now = new Date();
        const lastUpdate = wish.updatedAt || new Date(0);
        const secondsSince = (now - lastUpdate) / 1000;

        if (secondsSince < COOLDOWN_SECONDS) {
            return res.status(403).json({
                message: 'Cooldown active',
                cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
            });
        }

        wish.dishId = dishId;
        wish.updatedAt = now;
        await wish.save();

        res.json({ message: 'Wish updated', dishId });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/wishes
export const removeWish = async (req, res) => {
    try {
        const wish = await WishList.findOne({ where: { userId: req.user.id } });
        if (!wish) return res.status(404).json({ message: 'Wish not found' });

        const now = new Date();
        const lastUpdate = wish.updatedAt || new Date(0);
        const secondsSince = (now - lastUpdate) / 1000;

        if (secondsSince < COOLDOWN_SECONDS) {
            return res.status(403).json({
                message: 'Cooldown active',
                cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
            });
        }

        wish.dishId = null;
        wish.updatedAt = now;
        await wish.save();

        res.json({ message: 'Wish removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};