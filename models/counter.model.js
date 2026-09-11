const mongoose = require('mongoose');
// Define the User schema
const counterSchema = new mongoose.Schema({
    count: {
        type: Number,
        required: true,
        unique: false,
    },
});

// Create the User model from the schema
const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;