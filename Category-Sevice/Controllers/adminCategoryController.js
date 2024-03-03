const Category = require("../Models/categoryModel");

const categoryManagementGet = async (req, res, next) => {
  try {
    if (req.query.page) {
      page = parseInt(req.query.page);
    } else {
      page = 1;
    }
    const limit = 5;
    const skip = (page - 1) * limit;

    const categories = await Category.find().skip(skip).limit(limit); // Fetch all categories from the database
    const total = await Category.countDocuments();

    const totalPages = Math.ceil(total / limit);
    // Pass the categories to the view
    res.status(200).json({
      success: true,
      data: {
        categories: categories,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    error.adminError = true;
    next(error);
  }
};

const categoryManagementCreate = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    // Check if the category already exists (case-insensitive search)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
    });

    if (existingCategory) {
      const error = new Error("A category with this name already exists.");
      error.status = 409;
      throw error;
    }
    const category = new Category({
      name,
      description,
    });

    await category.save();
    res
      .status(201)
      .json({
        success: true,
        data: { msg: "Successfully added new Category", category },
      });
  } catch (error) {
    // Pass the error to the error handling middleware
    error.adminError = true;
    next(error);
  }
};

const categoryManagementEdit = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      const error = new Error("Category is Not Found in Database");
      error.status = 404;
      throw error;
    }
    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    return res
      .status(200)
      .json({
        success: true,
        data: { msg: "The category is Edited Successfully", category },
      });
  } catch (error) {
    error.adminError = true;
    next(error);
  }
};

const categoryManagementUnlist = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      const error = new Error("Category is Not Found in Database");
      error.status = 404;
      throw error;
    }
    category.status = category.status === "active" ? "unlisted" : "active";
    await category.save();
    res
      .status(201)
      .json({
        success: true,
        data: { msg: "category  status has been changed", category },
      });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ message: error });
  }
};

module.exports = {
  categoryManagementGet,
  categoryManagementCreate,
  categoryManagementEdit,
  categoryManagementUnlist,
};
