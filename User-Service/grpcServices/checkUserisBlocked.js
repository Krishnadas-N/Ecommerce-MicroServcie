const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const User = require("../Models/userSchema"); 
const userProtoPath = '../../protos/user-proto';
const userPackageDefinition = protoLoader.loadSync(userProtoPath);
const userServiceProto = grpc.loadPackageDefinition(userPackageDefinition).UserService


const checkUserBlocked = async(call, callback) => {
    const userId = call.request.user_id;
    const user = await User.findById(userId);
    const isBlocked = user.isBlocked;
    response.is_blocked = isBlocked;
    callback(null, response);
};


const server = new grpc.Server();
server.addService(userServiceProto.UserService.service, {
    CheckUserBlocked: checkUserBlocked
});

server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
console.log('Server running at http://0.0.0.0:50051');
server.start();;