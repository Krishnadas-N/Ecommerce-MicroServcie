const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const User = require("../Models/userSchema");
const path = require('path');

const userProtoPath = path.join(__dirname, '../../protos/user.proto');
const userPackageDefinition = protoLoader.loadSync(userProtoPath);
const userServiceProto = grpc.loadPackageDefinition(userPackageDefinition)
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

const grpcServer = new grpc.Server();
grpcServer.addService(userServiceProto.UserService.service, {
    CheckUserBlocked: checkUserBlocked,
    GetUserAddress:getUsersAddress
});

grpcServer.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error("Error binding server:", err);
            return;
        }
        console.log(`User gRPC server started on port ${port}`);
        grpcServer.start();
    }
);

module.exports = grpcServer