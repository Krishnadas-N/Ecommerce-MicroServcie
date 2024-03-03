const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path')
const PROTO_PATH = path.join(__dirname, '../../protos/product.proto'); 
console.log(PROTO_PATH);
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const productProto = grpc.loadPackageDefinition(packageDefinition);

const client = new productProto.ProductService('0.0.0.0:50051', grpc.credentials.createInsecure());


 

module.exports={client}