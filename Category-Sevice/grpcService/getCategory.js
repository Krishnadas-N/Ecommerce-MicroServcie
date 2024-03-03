const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const Category = require("../Models/categoryModel");
const path = require('path');

const categoryProtoPath = path.join(__dirname, '../../protos/category.proto'); 
// Load the protocol buffer dynamically
const packageDefinition = protoLoader.loadSync(categoryProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition);


const server = new grpc.Server();
server.addService(productProto.Category.service, {
    GetCategory: async (call, callback) => {
        const categories = await Category.find({});
        const categoryArray = categories.map(category => ({
            id: category._id.toString(),
            categoryName: category.name,
            isActive: category.status === 'active',
            status: category.status
        }));
        const response = { categories: categoryArray }
        callback(null, response);
    },
});

// Start the gRPC server
server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
console.log('Server running at http://0.0.0.0:50051');
server.start();
