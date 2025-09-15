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
    console.log('Looking for userId:', req.user!.id);
    console.log('User ID type:', typeof req.user!.id);
    
    const wish = await WishList.findOne({
      where: { userId: req.user!.id },
      include: [{ 
        model: Dish, 
        attributes: ['name', 'imageURL', 'description', 'description_kh', 'name_kh', 'categoryId'],
        include: [{ 
          model: Category, 
          attributes: ['name', 'name_kh'] 
        }]
      }]
    }) as unknown as WishWithDish | null;
    
    console.log('Found wish:', wish ? wish : 'null');
    
    if (!wish) return res.status(404).json({ message: 'Wish not found' });

    const response = {
      dishId: wish.dishId,
      dishName: wish.Dish ? wish.Dish.name : null,
      dishNameKh: wish.Dish ? wish.Dish.name_kh : null,
      image: wish.Dish ? wish.Dish.imageURL : null,
      description: wish.Dish ? wish.Dish.description : null,
      descriptionKh: wish.Dish ? wish.Dish.description_kh : null,
      updatedAt: wish.updatedAt!
    };

    return res.json(wish);
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
    const wish = await WishList.findOne({ where: { userId: req.user!.id } });
    if (!wish) return res.status(404).json({ message: 'Wish not found' });

    const now = new Date();
    const lastUpdate = wish.lastModified;
    
    // Only check cooldown if lastModified exists (not null)
    // if (lastUpdate) {
    //   const secondsSince = (now.getTime() - lastUpdate.getTime()) / 1000;
    //   if (secondsSince < COOLDOWN_SECONDS) {
    //     return res.status(403).json({
    //       message: 'Cooldown active',
    //       cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
    //     });
    //   }
    // }

    wish.dishId = dishId;
    wish.lastModified = null;
    await wish.save();

    return res.json({ message: 'Wish updated', dishId });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/wishes  
export const removeWish = async (req: RemoveWishRequest, res: Response): Promise<Response> => {
  try {
    const wish = await WishList.findOne({ where: { userId: req.user!.id } });
    if (!wish) return res.status(404).json({ message: 'Wish not found' });

    const now = new Date();
    const lastUpdate = wish.lastModified;

    // Only check cooldown if lastModified exists (not null)
    // if (lastUpdate) {
    //   const secondsSince = (now.getTime() - lastUpdate.getTime()) / 1000;
    //   if (secondsSince < COOLDOWN_SECONDS) {
    //     return res.status(403).json({
    //       message: 'Cooldown active',
    //       cooldownRemaining: Math.ceil(COOLDOWN_SECONDS - secondsSince)
    //     });
    //   }
    // }

    wish.dishId = null;
    wish.lastModified = null;
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

    const parsedLimit = Math.min(parseInt(String(limit), 10) || 10, 50);
    const parsedPage = parseInt(String(page), 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Subquery to avoid JOIN and alias issues
    const totalWishesLiteral = db.sequelize.literal(
      '(SELECT COUNT(*) FROM "WishLists" WHERE "WishLists"."dishId" = "Dish"."id")'
    );

    const { count, rows } = await Dish.findAndCountAll({
      attributes: [
        'id',
        'name',
        'imageURL',
        'categoryId',
        [totalWishesLiteral, 'totalWishes']
      ],
      order:
        String(sortBy) === 'name'
          ? [['name', orderDir]]
          : [[db.sequelize.literal('"totalWishes"'), orderDir]],
      limit: parsedLimit,
      offset
    });

    const totalItems = Number(count);

    // Fetch category names without associations
    const categoryIds = Array.from(
      new Set(rows.map(d => d.categoryId).filter((id): id is number => typeof id === 'number'))
    );

    const categories = await Category.findAll({
      where: { id: categoryIds },
      attributes: ['id', 'name']
    });

    const categoryMap = new Map<number, string>();
    categories.forEach(c => categoryMap.set(c.id as number, c.name!));

    const dishes = rows.map(dish => {
      const dishId = dish.get('id') as number;
      const name = (dish.get('name') as string) ?? null;
      const imageURL = (dish.get('imageURL') as string) ?? '';
      const categoryId = dish.get('categoryId') as number | null;
      const totalWishes = parseInt(String(dish.get('totalWishes') ?? '0'), 10) || 0;

      return {
        dishId,
        name,
        imageUrl: imageURL,
        categoryId: categoryId ?? undefined,
        categoryName: categoryId ? categoryMap.get(categoryId) ?? null : null,
        totalWishes
      };
    });

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