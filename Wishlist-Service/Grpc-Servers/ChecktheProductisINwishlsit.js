const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const Wishlist = require('../Models/wishlistModel')
const path = require('path');

const wishlistProtoPath = path.join(__dirname, '../../protos/wishlist.proto'); 
const wishlistPackageDefinition = protoLoader.loadSync(wishlistProtoPath);
const wishlistProto = grpc.loadPackageDefinition(wishlistPackageDefinition).wishlist;

const wishlistService = {
    GetUserWishlist: async (call, callback) => {
        const { userId } = call.request;
        try {
            const wishlist = await Wishlist.findOne({ user: userId });
            if (!wishlist) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    message: 'Wishlist not found for the user',
                });
                return;
            }
            callback(null, { productIds: wishlist.products });
        } catch (error) {
            console.error('Error retrieving user wishlist:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Internal server error',
            });
        }
    }
};


const server = new grpc.Server();

server.addService(wishlistProto.WishlistService.service, wishlistService);

const address = '0.0.0.0:50051';
const credentials = grpc.ServerCredentials.createInsecure(); // Insecure credentials for development

server.bind(address, credentials);
console.log(`Server running at ${address}`);
server.start();
