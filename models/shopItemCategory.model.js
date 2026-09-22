const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Mirrors lib/Models/ItemCategory.dart in the Flutter front end.
const ShopItemCategory = sequelize.define('ShopItemCategory', {
    key: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'shop_item_categories',
    timestamps: false,
});

module.exports = ShopItemCategory;
