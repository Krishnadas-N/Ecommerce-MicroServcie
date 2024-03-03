const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WishlistSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    products: [{
        type: String,
    }]
});

module.exports = mongoose.model('Wishlist', WishlistSchema);