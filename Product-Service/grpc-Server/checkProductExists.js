const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const Product = require("../Models/productModel");
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../protos/product.proto'); 

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const productService = grpc.loadPackageDefinition(packageDefinition).ProductService;

const server = new grpc.Server();

server.addService(productService.service, {
    CheckProductExistence:checkProductExistence,
    GetProductById: getProductById,
});


async function checkProductExistence(call, callback) {
  try {
    const productId = call.request.productId;
    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'No such product.' });
    }
    callback(null, { exists: true });
  } catch (error) {
    console.error('Error checking product existence:', error);
    callback({ code: grpc.status.INTERNAL, message: 'Internal Server Error' });
  }
}

async function getProductById(call, callback) {
    const productId = call.request.productId;
    
    try {
        const product = await Product.findById(productId);
        if (!product) {
            callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
            return;
        }
        
        const productData = {
            id: product._id.toString(),
            name: product.name,
            description: product.description,
            images: product.images,
            brand: product.brand,
            stock_count: product.countInStock,
            is_featured: product.isFeatured,
            sizes: product.sizes,
            price: product.price,
        };

        callback(null, productData);
    } catch (error) {
        console.error('Error fetching product:', error);
        callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
    }
}





const PORT = process.env.PORT || 50051;
server.bind(`0.0.0.0:50051`, grpc.ServerCredentials.createInsecure());
server.start();
console.log(`gRPC server running on port ${PORT}`);

main();
