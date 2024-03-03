// user_grpc_client.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const userProtoPath = path.join(__dirname, '../../protos/user.proto'); 

const userPackageDefinition = protoLoader.loadSync(userProtoPath);
const userServiceProto = grpc.loadPackageDefinition(userPackageDefinition).UserService

const client = new userServiceProto('0.0.0.0:50051', grpc.credentials.createInsecure());

module.exports={client}

