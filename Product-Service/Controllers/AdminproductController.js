const Product = require("../Models/productModel");
const mongoose = require("mongoose");
const { categoryClient } = require("../grpcClient/getCategory");

const productManagementGet = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const selectedCategory = req.query.category || ""; // Default to empty string if not provided
    const searchQuery = req.query.search || "";
    const query = {};
    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");

      query.$or = [{ name: { $regex: regex } }, { brand: { $regex: regex } }];
    }
    if (selectedCategory) {
      query.category = selectedCategory;
    }

    console.log("query", query);

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate("category") // Populate the 'category' field
        .lean()
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const categoriesResponse = await new Promise((resolve, reject) => {
      categoryClient.GetCategories({}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    const categories = categoriesResponse.categories;

    const productsForListedCategories = [];
    const productsForUnlistedCategories = [];

    for (const product of products) {
      const category = categories.find((cat) => cat._id === product.category);
      if (category && category.isActive) {
        productsForListedCategories.push(product);
      } else {
        productsForUnlistedCategories.push(product);
      }
    }

    // Concatenate the two arrays to get products with listed categories at the top
    const sortedProducts = productsForListedCategories.concat(
      productsForUnlistedCategories
    );

    res.status(201).json({
      products: sortedProducts,
      selectedCategory,
      searchQuery,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    // Pass the error to the error handling middleware
    next(error);
  }
};

const productManagementCreate = async (req, res, next) => {
  try {
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp("^" + req.body.name + "$", "i") },
    });
    if (existingProduct) {
      const error = new Error("This Product already exists");
      error.status = 409;
      throw error;
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      images: req.files["images"].map((file) =>
        file.path.replace(/\\/g, "/").replace("public/", "")
      ),
      brand: req.body.brand,
      countInStock: req.body.countInStock,
      sizes: req.body.sizes,
      category: req.body.category, // Assuming category is a MongoDB ObjectId reference
      price: req.body.price,
    });

    console.log(req.body.category);
    console.log(
      "//////////////////////////////////////////////////////////////////////"
    );
    console.log(req.files);

    // Save the new product to the database
    await product.save();

    req.session.successMessage = "Product Added Successfully";
    return res.status(201).json({
      success: true,
      data: {
        msg: "Product Added Successfully",
        product: product,
      },
    });
  } catch (error) {
    next(error);
  }
};

const productManagementEditGet = async (req, res, next) => {
  try {
    const id = req.params.Id;
    if (!mongoose.isValidObjectId(id)) {
      const error = new Error("Invalid Product ID");
      error.status = 403;
      throw error;
    }
    const products = await Product.findOne({ _id: id });
    if (!products) {
      const error = new Error("Mo Product is Found");
      error.status = 404;
      throw error;
    }
    return res.status(200).json({
      success: true,
      data: {
        msg: "Product Found Successfully",
        product: products,
      },
    });
  } catch (error) {
    next(error);
  }
};

const productManagementEdit = async (req, res, next) => {
  try {
    const productId = req.params.Id;
    console.log(productId);
    console.log(req.body);
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      const error = new Error("Product not found");
      error.status = 403;
      throw error;
    }

    const { name, description, brand, countInStock, sizes, category, price } =
      req.body;

    let images = existingProduct.images;

    if (req.files) {

      if (req.files["images"]) {
        images = images.concat(
          req.files["images"].map((file) =>
            file.path.replace(/\\/g, "/").replace("public/", "")
          )
        );
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        brand,
        countInStock,
        sizes,
        category,
        price,
        images,
      },
      {
        new: true,
      }
    );

    res
      .status(200)
      .json({ success: true, data:{msg: "Product Edit Successfuly",product:updatedProduct} });
  } catch (error) {
    console.error(error);
    next(error)
    }
};

const productManagementPublish = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    // Toggle the isFeatured flag in the database without fetching the document
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $bit: { isFeatured: { xor: 1 } } }, // Toggle the bit using bitwise XOR operation
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: {
        msg: "Product status updated successfully",
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error(error);
    next(error)
  }
};

const productManagementremoveImages = async (req, res, next) => {
  const { productId, index } = req.params;
  console.log(productId, index);
  try {
    console.log(productId, index);
    const product = await Product.findById(productId);

    if (!product) {

      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }
    console.log(productId, index);
    console.log(product);
    // Remove the image at the specified index
    product.images.splice(index, 1);

    // Save the updated product
    await product.save();

    res.status(200).json({success:true,data:{msg:'Image remove successfullly',images:product.images}});
  } catch (error) {
    console.error(error);
    next(error)
  }
};





module.exports = {
  productManagementGet,
  productManagementCreate,
  productManagementEdit,
  productManagementEditGet,
  productManagementPublish,
  productManagementremoveImages,
};
