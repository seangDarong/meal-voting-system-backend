import { Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import db from '@/models/index';
import { uploadImageToR2, deleteImageFromR2, File } from '@/utils/r2';
import { DishAttributes, DishCreationAttributes } from '@/models/dish';

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
    const userId = req.user.id;

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
    const dishes = await Dish.findAll({
      attributes: [
        'id', 'name', 'name_kh', 'imageURL', 'ingredient', 'ingredient_kh',
        'description', 'description_kh', 'categoryId'
      ]
    });

    return res.status(200).json({
      message: "Dishes fetched successfully",
      data: dishes
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