import { Request, Response } from 'express';
import { Op } from 'sequelize';
import WishList from '@/models/wishList';
import Dish from '@/models/dish';
import Category from '@/models/category';
import db from '@/models/index';
import { WishListAttributes } from '@/models/wishList';
import { DishAttributes } from '@/models/dish';
import { CategoryAttributes } from '@/models/category';

import { GetMyWishRequest, UpdateWishRequest, RemoveWishRequest, GetAllWishesRequest } from '@/types/requests';

const COOLDOWN_SECONDS = 3600; // 1 hour

interface WishWithDish extends WishListAttributes {
  Dish?: DishAttributes;
}

interface WishResponseDish {
  dishId: number | null;
  dishName: string | null;
  image: string | null;
  updatedAt: Date | null;
}

// Interface for the paginated response
interface PaginatedWishesResponse {
  dishes: Array<{
    dishId: number;
    name: string | null;
    imageUrl: string;
    categoryId: number | undefined;
    categoryName: string | null;
    totalWishes: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// GET /api/wishes/mine
export const getMyWish = async (req: GetMyWishRequest, res: Response): Promise<Response> => {
  try {
    console.log('Looking for userId:', req.user.id);
    console.log('User ID type:', typeof req.user.id);
    
    const wish = await WishList.findOne({
      where: { userId: req.user.id },
      include: [{ 
        model: Dish, 
        attributes: ['name', 'imageURL']
      }]
    }) as unknown as WishWithDish | null;
    
    console.log('Found wish:', wish ? wish : 'null');
    
    if (!wish) return res.status(404).json({ message: 'Wish not found' });

    const response: WishResponseDish = {
      dishId: wish.dishId,
      dishName: wish.Dish ? wish.Dish.name : null,
      image: wish.Dish ? wish.Dish.imageURL : null,
      updatedAt: wish.updatedAt!
    };

    return res.json(response);
  } catch (err: any) {
    console.error('Error details:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/wishes
export const updateWish = async (req: UpdateWishRequest, res: Response): Promise<Response> => {
  const { dishId } = req.body;
  if (!dishId) return res.status(400).json({ message: 'dishId required' });

  try {
    const wish = await WishList.findOne({ where: { userId: req.user.id } });
    if (!wish) return res.status(404).json({ message: 'Wish not found' });

    const now = new Date();
    const lastUpdate = wish.lastModified;
    
    // Only check cooldown if lastModified exists (not null)
    if (lastUpdate) {
      const secondsSince = (now.getTime() - lastUpdate.getTime()) / 1000;
      if (secondsSince < COOLDOWN_SECONDS) {
        return res.status(403).json({
          message: 'Cooldown active',
          cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
        });
      }
    }

    wish.dishId = dishId;
    wish.lastModified = now;
    await wish.save();

    return res.json({ message: 'Wish updated', dishId });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/wishes  
export const removeWish = async (req: RemoveWishRequest, res: Response): Promise<Response> => {
  try {
    const wish = await WishList.findOne({ where: { userId: req.user.id } });
    if (!wish) return res.status(404).json({ message: 'Wish not found' });

    const now = new Date();
    const lastUpdate = wish.lastModified;

    // Only check cooldown if lastModified exists (not null)
    if (lastUpdate) {
      const secondsSince = (now.getTime() - lastUpdate.getTime()) / 1000;
      if (secondsSince < COOLDOWN_SECONDS) {
        return res.status(403).json({
          message: 'Cooldown active',
          cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
        });
      }
    }

    wish.dishId = null;
    wish.lastModified = now;
    await wish.save();

    return res.json({ message: 'Wish removed' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// GET /api/wishes/all
export const getAllWishes = async (req: GetAllWishesRequest, res: Response): Promise<Response> => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      sortBy = 'totalWishes', 
      sortOrder = 'DESC' 
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 50);
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

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
          model: WishList,
          attributes: [],
          required: false
        }
      ],
      group: ['Dish.id'],
      order: [
        sortBy === 'name' 
          ? ['name', sortOrder] 
          : [db.sequelize.literal('totalWishes'), sortOrder]
      ],
      limit: parsedLimit,
      offset
    });

    // Get all unique category IDs
    const categoryIds = [...new Set(rows.map(dish => dish.categoryId).filter(id => id !== undefined))] as number[];
    
    // Fetch all categories at once
    const categories = await Category.findAll({
      where: { id: categoryIds },
      attributes: ['id', 'name']
    });

    // Create a map for quick lookup
    const categoryMap = new Map();
    categories.forEach(category => {
      categoryMap.set(category.id, category.name);
    });

    const totalItems = Array.isArray(count) ? count.length : count;

    const dishes = rows.map(dish => ({
      dishId: dish.id,
      name: dish.name,
      imageUrl: dish.imageURL,
      categoryId: dish.categoryId,
      categoryName: dish.categoryId ? categoryMap.get(dish.categoryId) || null : null,
      totalWishes: parseInt((dish.get('totalWishes') as string), 10) || 0
    }));

    const response: PaginatedWishesResponse = {
      dishes,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalItems / parsedLimit),
        totalItems,
        itemsPerPage: parsedLimit,
        hasNextPage: parsedPage * parsedLimit < totalItems,
        hasPrevPage: parsedPage > 1
      }
    };

    return res.json(response);

  } catch (err: any) {
    console.error('Error fetching wishes status:', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

//i couldnt get fetching by associaztions working so shitty hack above sorry