
import { v4 as uuidv4 } from 'uuid'; // Use UUID from 'uuid' package
import db from '../models/index.js';
import cloudinary from '../utils/cloudinary.js'; // Assuming you have a cloudinary config file

const Dish = db.Dish;

export const addDish = async (req, res) => {
    try {
        const { name, categoryId, ingredient, description } = req.body;
        const imageFile = req.file;
        const userId = req.user.id;
        
;

        // Validate required fields
        if (!name || !categoryId || !imageFile || !ingredient || !description) {
            return res.status(400).json({
                error: "Missing required fields: name, category, image, ingredient, description"
            });
        }

        // Upload to Cloudinary
        const uploadToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'Dishes',
                        public_id: uuidv4(), // Generate unique image ID
                        resource_type: 'image',
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(imageFile.buffer);
            });
        };

        const result = await uploadToCloudinary();

        // Save dish to database
        const newDish = await Dish.create({
            name,
            categoryId,
            ingredient,
            description,
            imageURL: result.secure_url,
            userId
        });

        return res.status(200).json({
            message: "Dish created successfully",
            dish: newDish
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};
