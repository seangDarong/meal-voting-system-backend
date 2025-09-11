import { Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { fn, col } from 'sequelize';
import db from '@/models/index';
import { uploadImageToR2, deleteImageFromR2, File } from '@/utils/r2';
import { DishAttributes, DishCreationAttributes } from '@/models/dish';
import Feedback from '@/models/feedback';
import WishList from '@/models/wishList';

import { AddDishRequest, UpdateDishRequest, DeleteDishRequest, GetDishesByCategoryRequest } from '@/types/requests.js';

const Dish = db.Dish;

// Add a new dish
export const addDish = async (req: AddDishRequest, res: Response): Promise<Response> => {
  try {
    const {
      name,
      name_kh,
      categoryId,
      ingredient,
      ingredient_kh,
      description,
      description_kh
    } = req.body;
    const imageFile = req.file;
    const userId = req.user!.id;

    // Validate required fields
    if (!categoryId || !imageFile || !name_kh) {
      return res.status(400).json({
        error: "Missing required fields: category, image, or Khmer name"
      });
    }

    // Check if a dish with the same English or Khmer name already exists
    const existingDish = await Dish.findOne({ 
      where: { 
        [Op.or]: [
          { name: name || '' },       // Provide empty string if undefined
          { name_kh: name_kh } 
        ]
      } 
    });

    if (existingDish) {
      return res.status(409).json({
        error: "A dish with this name or Khmer name already exists. Please choose a different name."
      });
    }

    let imageURL: string;
    try {
      imageURL = await uploadImageToR2(imageFile, 'dishes');
    } catch (error: any) {
      console.error("Error uploading to R2:", error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }


    // Save dish to database
    const newDish = await Dish.create({
      name: name || null,
      name_kh: name_kh || null,
      categoryId: parseInt(categoryId),
      ingredient: ingredient || null,
      ingredient_kh: ingredient_kh || null,
      description: description || null,
      description_kh: description_kh || null,
      imageURL: imageURL,
      userId
    } as DishCreationAttributes);

    return res.status(200).json({
      message: "Dish created successfully",
      dish: newDish
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update dish
export const updateDish = async (req: UpdateDishRequest, res: Response): Promise<Response> => {
  try {
    const dishId = parseInt(req.params.id);
    const {
      name,
      name_kh,
      description,
      description_kh,
      ingredient,
      ingredient_kh,
      categoryId
    } = req.body;
    const imageFile = req.file;

    const dish = await Dish.findByPk(dishId);
    if (!dish) return res.status(404).json({ error: "Dish not found" });

    // Check unique name if provided
    if (name && name !== dish.name) {
      const nameExists = await Dish.findOne({ where: { name } });
      if (nameExists) return res.status(400).json({ error: "Dish name must be unique" });
    }

    let imageURL = dish.imageURL;
    if (imageFile) {
      try {
        // First delete the old image from R2 if it exists
        if (dish.imageURL) {
          try {
            const urlParts = dish.imageURL.split('/');
            const key = urlParts.slice(3).join('/'); // Remove the domain parts
            await deleteImageFromR2(key);
          } catch (error: any) {
            console.error("Error deleting old image from R2:", error);
            // Continue with upload even if deletion fails
          }
        }
        
        // Upload new image to R2
        imageURL = await uploadImageToR2(imageFile, 'dishes');
      } catch (error: any) {
        console.error("Error uploading to R2:", error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    await dish.update({
      name: name ?? dish.name,
      name_kh: name_kh ?? dish.name_kh,
      description: description ?? dish.description,
      description_kh: description_kh ?? dish.description_kh,
      ingredient: ingredient ?? dish.ingredient,
      ingredient_kh: ingredient_kh ?? dish.ingredient_kh,
      categoryId: categoryId ? parseInt(categoryId) : dish.categoryId,
      imageURL
    });

    return res.status(200).json({ message: "Dish updated successfully" });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error cannot update dish" });
  }
};

// Get all dishes
export const getAllDishes = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Parse pagination params
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // max 50
    const offset = parseInt(req.query.offset as string) || 0;

    const { count, rows } = await Dish.findAndCountAll({
      attributes: [
        'id', 'name', 'name_kh', 'imageURL', 'ingredient', 'ingredient_kh',
        'description', 'description_kh', 'categoryId'
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Calculate nextOffset
    const nextOffset = offset + limit < count ? offset + limit : null;

    return res.status(200).json({
      message: "Dishes fetched successfully",
      items: rows,
      total: count,
      nextOffset
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error while fetching dishes" });
  }
};

// Get dishes by category
export const getAllDishesByCategory = async (req: GetDishesByCategoryRequest, res: Response): Promise<Response> => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) return res.status(400).json({ error: "Category ID is required" });

    const dishes = await Dish.findAll({
      where: { categoryId: parseInt(categoryId) },
      attributes: [
        'id', 'name', 'name_kh', 'imageURL', 'ingredient', 'ingredient_kh',
        'description', 'description_kh', 'categoryId'
      ]
    });

    if (dishes.length === 0) return res.status(404).json({ message: "No dishes found for this category" });

    return res.status(200).json({
      message: `Dishes fetched successfully for category ${categoryId}`,
      data: dishes
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error while fetching dishes" });
  }
};

// Delete a dish
export const deleteDish = async (req: DeleteDishRequest, res: Response): Promise<Response> => {
  try {
    const dishId = parseInt(req.params.id);
    const dish = await Dish.findByPk(dishId);
    if (!dish) return res.status(404).json({ error: "Dish not found" });

    // Delete image from R2 if it exists
    if (dish.imageURL) {
      try {
        const urlParts = dish.imageURL.split('/');
        const key = urlParts.slice(3).join('/');
        await deleteImageFromR2(key);
      } catch (error: any) {
        console.error("Error deleting image from R2:", error);
        // Continue with dish deletion even if image deletion fails
      }
    }

    await dish.destroy();
    return res.status(200).json({ message: "Dish deleted successfully" });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error while deleting dishes" });
  }
};

export const getDishById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const dishId = parseInt(req.params.id);
    if (isNaN(dishId)) {
      return res.status(400).json({ error: "Invalid dish ID" });
    }

    const dish = await Dish.findByPk(dishId, {
      attributes: [
        'id', 'name', 'name_kh', 'imageURL', 'ingredient', 'ingredient_kh',
        'description', 'description_kh', 'categoryId'
      ]
    });

    if (!dish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    return res.status(200).json({ dish });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error while fetching dish" });
  }
};

export const getMostRatedDishes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const results = await db.sequelize.query(`
      SELECT d.*,
             COALESCE(AVG(f.food), 0) AS "averageRating",
             COUNT(f.id) AS "ratingCount"
      FROM "Dishes" d
      LEFT JOIN "Feedbacks" f ON f."dishId" = d.id
      GROUP BY d.id
      ORDER BY "averageRating" DESC, "ratingCount" DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { limit, offset },
      type: db.sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({
      message: "Most rated dishes fetched successfully",
      items: results,
      total: results.length,
      nextOffset: offset + limit < results.length ? offset + limit : null,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error while fetching most rated dishes" });
  }
};



export const getMostFavoritedDishes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const results = await db.sequelize.query(`
      SELECT d.*, COALESCE(COUNT(w.id), 0) AS "favoriteCount"
      FROM "Dishes" d
      LEFT JOIN "WishLists" w ON w."dishId" = d.id
      GROUP BY d.id
      ORDER BY "favoriteCount" DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { limit, offset },
      type: db.sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({
      message: "Most favorited dishes fetched successfully",
      items: results,
      total: results.length,
      nextOffset: offset + limit < results.length ? offset + limit : null,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error while fetching most favorited dishes" });
  }
};
