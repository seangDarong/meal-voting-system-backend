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

// get/api/wishes/all
export const getAllWishes = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'totalWishes', 
            sortOrder = 'DESC' 
        } = req.query;

        const offset = (page - 1) * limit;

        // Get all dishes
        const allDishes = await Dish.findAndCountAll({
            attributes: ['id', 'name', 'imageURL', 'categoryId'],
            include: [
                {
                    model: Category,
                    attributes: ['name']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get wish counts for all dishes
        const wishCounts = await WishList.findAll({
            attributes: [
                'dishId',
                [db.sequelize.fn('COUNT', db.sequelize.col('dishId')), 'count']
            ],
            where: {
                dishId: {
                    [Op.ne]: null
                }
            },
            group: ['dishId'],
            raw: true
        });

        // Create a map of dish wishes
        const wishCountMap = {};
        wishCounts.forEach(item => {
            wishCountMap[item.dishId] = parseInt(item.count);
        });

        // Combine dishes with wish counts
        let dishesWithWishes = allDishes.rows.map(dish => ({
            dishId: dish.id,
            name: dish.name,
            imageUrl: dish.imageURL,
            categoryId: dish.categoryId,
            categoryName: dish.Category ? dish.Category.name : null,
            totalWishes: wishCountMap[dish.id] || 0
        }));

        // Sort the results
        if (sortBy === 'totalWishes') {
            dishesWithWishes.sort((a, b) => {
                return sortOrder === 'ASC' 
                    ? a.totalWishes - b.totalWishes
                    : b.totalWishes - a.totalWishes;
            });
        } else if (sortBy === 'name') {
            dishesWithWishes.sort((a, b) => {
                return sortOrder === 'ASC' 
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
        }

        res.json({
            dishes: dishesWithWishes,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(allDishes.count / limit),
                totalItems: allDishes.count,
                itemsPerPage: parseInt(limit),
                hasNextPage: page * limit < allDishes.count,
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