import db from '../models/index.js';

const Category = db.Category;

export const getAllCategory = async (req, res) => {
    try{
        const categories = await Category.findAll({
            attributes: ['id','name','description']
        });

        res.status(200).json({
            message: "Categories fetched successfully",
            data: categories
        });
    }catch (error) {
        res.status(400).json({
            message : "Error cannot fetched categories"
        })
    }
}