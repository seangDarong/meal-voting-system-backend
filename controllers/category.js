import db from '../models/index.js';

const Category = db.Category;

export const getAllCategory = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name', 'name_kh', 'description', 'description_kh']
        });

        res.status(200).json({
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(400).json({
            message: "Error: cannot fetch categories"
        });
    }
};
