import { v4 as uuidv4 } from 'uuid';
import db from '../models/index.js';
import cloudinary from '../utils/cloudinary.js';

const Dish = db.Dish;

//add a new dish to catalog
export const addDish = async (req, res) => {
    try {
        const { name, categoryId, ingredient, description } = req.body;
        const imageFile = req.file;
        const userId = req.user.id;

        // Validate required fields
        if (!name || !categoryId || !imageFile || !ingredient || !description) {
            return res.status(400).json({
                error: "Missing required fields: name, category, image, ingredient, description"
            });
        }

        //  Check if a dish with the same name already exists
        const existingDish = await Dish.findOne({ where: { name } });
        if (existingDish) {
            return res.status(409).json({
                error: "A dish with this name already exists. Please choose a different name."
            });
        }

        // Upload image to Cloudinary
        const uploadToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'Dishes',
                        public_id: uuidv4(),
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

        //  Save dish to database
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

// edit or update dish information
export const updateDish = async (req,res) => {
    try{
        const dishId = req.params.id;
        const {name,description,ingredient,categoryId} = req.body;
        const imageFile = req.file;
        
        const dish = await Dish.findByPk(dishId);
        if (!dish) {
            return res.status(404).json({ error: "Dish not found" });
        }

        if (name && name !== dish.name) {
            const nameExists = await Dish.findOne({ where: { name } });
            if (nameExists) {
                return res.status(400).json({ error: "Dish name must be unique" });
            }
        }

        let imageURL = dish.imageURL;
        if (imageFile){
            const uploadToCloudinary = () => {
                return new Promise((resolve,reject)=>{
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'Dishes',
                            public_id: dish.id,
                            resource_type: 'image',
                            overwrite: true,
                        },
                        (error,result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(imageFile.buffer);
                });
            };
            const result = await uploadToCloudinary();
            imageURL = result.secure_url;
        }

        await dish.update({
            name : name || Dish.name,
            decription: description || dish.description,
            ingredient: ingredient || dish.ingredient,
            categoryId: categoryId || dish.categoryId,
            imageURL
        });

        res.status(200).json({
            message : "Dish update successfully"
        })

    }catch (error){
        res.status(400).json({
            message : "Error cannot update dish"
        })
    }
}
//function view all dish from every category
export const getAllDishes = async (req, res) => {
    try {
        const dishes = await Dish.findAll({
            attributes: ['id', 'name','imageURL', 'ingredient','description', 'categoryId' ]
        });

        return res.status(200).json({
            message: "Dishes fetched successfully",
            data: dishes
        });
    } catch (error) {
        console.error("Error fetching dishes:", error); 
        return res.status(500).json({
            error: "Internal server error while fetching dishes"
        });
    }
};

//function view all dish by category
export const getAllDishesByCategory = async (req, res) => {
    try{
        const {categoryId} = req.params;

        if(!categoryId){
            res.status(400).json({
                error : "Category ID is required"
            });
        }

        const dishes = await Dish.findAll({
            where : {categoryId},
            attributes: ['id', 'name','imageURL', 'ingredient','description', 'categoryId' ]
        })

        if (dishes.length === 0){
            res.status(404).json({
                message : "No dishes found for this category"
            });
        }

        return res.status(200).json({
            message: `Dishes fetched successfully for category ${categoryId}`,
            data: dishes
        });

    }catch (error) {
        console.error("Error fetching dishes:", error); 
        return res.status(500).json({
            error: "Internal server error while fetching dishes"
        });
    }
}

//delete existing dish
export const deleteDish = async(req,res) => {
    try{
        const dishId = req.params.id;
        const dish = await Dish.findByPk(dishId);
        if (!dish){
            return res.status(404).json({ error: "Dish not found" });
        }

        await cloudinary.uploader.destroy(`Dishes/${dish.id}`, { resource_type: 'image' });// detlete photo from cloudinary 

        await dish.destroy();
        return res.status(200).json({
            message: "Dish deleted successfully"
        });

    }catch(error){
        console.error("Error deleting dishes:", error); 
        return res.status(500).json({
            error: "Internal server error while deleting dishes"
        });
    }
}