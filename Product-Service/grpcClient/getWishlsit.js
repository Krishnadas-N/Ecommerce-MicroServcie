const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const wishlistProtoPath = path.join(__dirname, '../../protos/wishlist.proto'); 
const wishlistPackageDefinition = protoLoader.loadSync(wishlistProtoPath);
const wishlistProto = grpc.loadPackageDefinition(wishlistPackageDefinition);

const wishlistClient = new wishlistProto.WishlistService('0.0.0.0:50051', grpc.credentials.createInsecure());

module.exports={wishlistClient}
