const mongoose = require('mongoose');
// Define the User schema
const shopItemSchema = new mongoose.Schema({
    pKey: {
        type: Number,
        required: true,
        unique: true,
    },
    image: {
        type: String, // URL or file path
        required: false,
    },
    title: {
        type: String,
        required: true,
        unique: false,
    },
    description: {
        type: String,
        required: true,
        unique: false,
    },
    price: {
        type: Number,
        required: true,
        unique: false,
    },
    discount: {
        type: Number,
        required: true,
        unique: false,
    },
    discquantity: {
        type: Number,
        required: true,
        unique: false,
    }

});

// static generator
shopItemSchema.statics.generateItem = function (pKey) {
  const titles = ["Headphones", "Mouse", "Keyboard", "Monitor", "Speaker"];
  const descriptions = [
    "High-quality product",
    "Best in class performance",
    "Ergonomic and durable",
    "Top-rated item",
    "Customer favorite"
  ];

  return {
    pKey,
    image: `https://via.placeholder.com/300?text=Item+${pKey}`,
    title: `${titles[Math.floor(Math.random() * titles.length)]} ${pKey}`,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    price: +(Math.random() * 200 + 20).toFixed(2),
    discount: Math.floor(Math.random() * 30),
    discquantity: Math.floor(Math.random() * 100) + 1
  };
};

// Create the User model from the schema
const ShopItem = mongoose.model('shopItem', shopItemSchema);
module.exports = ShopItem;