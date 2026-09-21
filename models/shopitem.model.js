const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Mirrors lib/Models/ShopItem.dart in the Flutter front end.
const ShopItem = sequelize.define('ShopItem', {
    pKey: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    tags: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: { min: 0 },
    },
    discount: {
        type: DataTypes.DOUBLE, // discount amount subtracted from price
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
    },
    availableQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
    },
    image: {
        type: DataTypes.STRING, // URL or file path
        allowNull: true,
    },
    dateAdded: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    categoryKey: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [],
    },
}, {
    tableName: 'shop_items',
    timestamps: false,
    indexes: [
        // backing the filter/sort options exposed by /shopitems/search
        { fields: ['price'] },
        { fields: ['dateAdded'] },
        { fields: ['categoryKey'], using: 'gin' },
    ],
});

module.exports = ShopItem;
