const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const productProtoPath = path.join(__dirname, '../../protos/category.proto'); 
const productPackageDefinition = protoLoader.loadSync(productProtoPath);
const productProto = grpc.loadPackageDefinition(productPackageDefinition);

const categoryClient = new productProto.CategoryService('0.0.0.0:50051', grpc.credentials.createInsecure());

module.exports={categoryClient}