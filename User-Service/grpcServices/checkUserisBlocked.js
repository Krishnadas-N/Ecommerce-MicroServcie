const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const User = require("../Models/userSchema"); 
const userProtoPath = '../../protos/user-proto';
const userPackageDefinition = protoLoader.loadSync(userProtoPath);
const userServiceProto = grpc.loadPackageDefinition(userPackageDefinition).UserService
const AddressModel = require('../Models/addressModel')

const checkUserBlocked = async(call, callback) => {
    try {
    const userId = call.request.user_id;
    const user = await User.findById(userId);
    const isBlocked = user.isBlocked;
    response.is_blocked = isBlocked;
    callback(null, response);
    } catch (error) {
        console.error(error);
        callback(error, null);
    }
};

const getUsersAddress = async(call, callback) => {
    try {
        const userId = call.request.user_id;
        const user = await AddressModel.findOne({ user: userId });
        const response = {
            addresses: user.addresses 
        };
        callback(null, response);
    } catch (error) {
        console.error(error);
        callback(error, null);
    }
};

const server = new grpc.Server();
server.addService(userServiceProto.UserService.service, {
    CheckUserBlocked: checkUserBlocked,
    GetUserAddress:getUsersAddress
});

server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
console.log('Server running at http://0.0.0.0:50051');
server.start();;