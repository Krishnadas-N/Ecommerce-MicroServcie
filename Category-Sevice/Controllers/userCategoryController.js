const Category = require("../Models/categoryModel");


const categoryManagementGet = async (req, res, next) => {
    try {
  
      const categories = await Category.find() // Fetch all categories from the database
      const total = await Category.countDocuments();
  
      res.status(200).json({
        success: true,
        data: {
          categories: categories,
          totalCount:total,
        },
      });
    } catch (error) {
      next(error);
    }
  };

module.exports= {
    categoryManagementGet
}