import WishList from '../models/wishList.js';
import Dish from '../models/dish.js';
import Category from '../models/category.js';  // Add this import
import db from '../models/index.js'; 
import { Op } from 'sequelize'; 

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
        const lastUpdate = wish.lastModified; // Use lastModified instead
        
        // Only check cooldown if lastModified exists (not null)
        if (lastUpdate) {
            const secondsSince = (now - lastUpdate) / 1000;
            if (secondsSince < COOLDOWN_SECONDS) {
                return res.status(403).json({
                    message: 'Cooldown active',
                    cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
                });
            }
        }

        wish.dishId = dishId;
        wish.lastModified = now; // Set lastModified instead of updatedAt
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
        const lastUpdate = wish.lastModified; // Use lastModified instead

        // Only check cooldown if lastModified exists (not null)
        if (lastUpdate) {
            const secondsSince = (now - lastUpdate) / 1000;
            if (secondsSince < COOLDOWN_SECONDS) {
                return res.status(403).json({
                    message: 'Cooldown active',
                    cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
                });
            }
        }

        wish.dishId = null;
        wish.lastModified = now; // Set lastModified instead of updatedAt
        await wish.save();

        res.json({ message: 'Wish removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/wishes/all
export const getAllWishes = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'totalWishes', 
            sortOrder = 'DESC' 
        } = req.query;

        const parsedLimit = Math.min(parseInt(limit, 10) || 10, 50); // cap at 50
        const offset = (parseInt(page, 10) - 1) * parsedLimit;

        // Query dishes with wish counts (LEFT JOIN so dishes with 0 wishes still appear)
        const { count, rows } = await Dish.findAndCountAll({
            attributes: [
                'id',
                'name',
                'imageURL',
                'categoryId',
                [db.sequelize.fn('COUNT', db.sequelize.col('WishLists.id')), 'totalWishes']
            ],
            include: [
                {
                    model: Category,
                    attributes: ['name']
                },
                {
                    model: WishList,
                    attributes: [],
                    required: false // LEFT JOIN
                }
            ],
            group: ['Dish.id', 'Category.id'],
            order: [
                sortBy === 'name' 
                    ? ['name', sortOrder] 
                    : [db.sequelize.literal('totalWishes'), sortOrder]
            ],
            limit: parsedLimit,
            offset
        });

        // Sequelize count with GROUP BY returns an array → use length for total
        const totalItems = Array.isArray(count) ? count.length : count;

        // Transform result
        const dishes = rows.map(dish => ({
            dishId: dish.id,
            name: dish.name,
            imageUrl: dish.imageURL,
            categoryId: dish.categoryId,
            categoryName: dish.Category ? dish.Category.name : null,
            totalWishes: parseInt(dish.get('totalWishes'), 10) || 0
        }));

        res.json({
            dishes,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalItems / parsedLimit),
                totalItems,
                itemsPerPage: parsedLimit,
                hasNextPage: page * parsedLimit < totalItems,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        console.error('Error fetching wishes status:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};
