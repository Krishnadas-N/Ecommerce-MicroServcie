const User = require("../Models/userSchema");
const AddressModel = require('../Models/addressModel')

const userAddAddress = async (req, res, next) => {
    try {
        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
        } = req.body;

        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            const error = new Error("No user logged in");
            error.status = 401;
            throw error;
        }

        let userAddresses = await AddressModel.findOne({ user: userId });

        if (!userAddresses) {
            userAddresses = new AddressModel({ user: userId, addresses: [] });
        }

        if (!addressType) {
            const error = new Error("Address type is required");
            error.status = 400;
            throw error;
        }

        const existingAddress = userAddresses.addresses.find((address) =>
            address.addressType === addressType &&
            address.houseNo === houseNo &&
            address.street === street &&
            address.pincode === pincode &&
            address.city === city &&
            address.state === state &&
            address.country === country
        );

        if (existingAddress) {
            const error = new Error("Address already exists for this user");
            error.status = 400;
            throw error;
        }

        if (userAddresses.addresses.length >= 3) {
            const error = new Error("User cannot have more than 3 addresses");
            error.status = 403;
            throw error;
        }

        const newAddress = {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country,
        };

        userAddresses.addresses.push(newAddress);
        await userAddresses.save();

        res.status(200).json({ success: true, data: { message: 'Address added successfully', newAddress } });
    } catch (err) {
        next(err);
    }
};


const userEditAddress = async(req, res, next) => {
    try {
        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country,
        } = req.body;

        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            const error = new Error("No user logged in");
            error.statusCode = 401;
            throw error;
        }

        const addresses = await AddressModel.findOne({ user: userId })

        if (!addresses) {
            const error = new Error("Address not found");
            error.statusCode = 404; // 404 Not Found
            throw error;
        }

        const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

        if (!addressToEdit) {
            const error = new Error(`Address with type ${addressType} not found`);
            error.statusCode = 404; // 404 Not Found
            throw error;
        }

        addressToEdit.houseNo = houseNo;
        addressToEdit.street = street;
        addressToEdit.landmark = landmark;
        addressToEdit.pincode = pincode;
        addressToEdit.city = city;
        addressToEdit.district = district;
        addressToEdit.state = state;
        addressToEdit.country = country;

        await addresses.save();

        res.status(200).json({success:true,data:{msg:'Address Edited Successfully',address:addressToEdit}});

    } catch (error) {
        console.error(error);
        next(error);
    }
}


const userdeleteAddress = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            const error = new Error("No user logged in");
            error.statusCode = 401;
            throw error;
        }

        const addresses = await AddressModel.findOne({ user: userId });

        if (!addresses) {
            const error = new Error("Address not found");
            error.statusCode = 404; // 404 Not Found
            throw error;
        }

        const addressTypeToDelete = req.query.addressType;
        const addressIndexToDelete = addresses.addresses.findIndex((address) => address.addressType === addressTypeToDelete);

        if (addressIndexToDelete === -1) {
            const error = new Error(`Address with type '${addressTypeToDelete}' not found`);
            error.statusCode = 404; // 404 Not Found
            throw error;
        }

        addresses.addresses.splice(addressIndexToDelete, 1);

        await addresses.save();

        res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        next(error);
    }
}


const GetAddress = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            const error = new Error("No user logged in");
            error.statusCode = 401;
            throw error;
        }

        const addresses = await AddressModel.findOne({ user: userId });

        if (!addresses) {
            const error = new Error("Address not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: { message: 'Address Retrieved Successfully', addresses: addresses.addresses } });
    } catch (error) {
        next(error);
    }
}

const GetSingleAddress =async (req, res, next) => {
    try {
        const addressType = req.params.type;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            const error = new Error("No user logged in");
            error.statusCode = 401;
            throw error;
        }

        const addresses = await AddressModel.findOne({ user: userId });

        if (!addresses) {
            const error = new Error("Address not found");
            error.statusCode = 404;
            throw error;
        }
        const SelectedAddress =addresses.addresses.filter((addr)=>addr.addressType===addressType)

        res.status(200).json({ success: true, data: { message: 'Address Retrieved Successfully', addresses: SelectedAddress } });
    } catch (error) {
        next(error);
    }
}


module.exports={
    userAddAddress,
    userEditAddress,
    userdeleteAddress,
    GetAddress,
    GetSingleAddress
}

