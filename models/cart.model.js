const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// One cart per JWT session. The sessionId comes from the verified token,
// so a client can only ever read/write its own cart.
// Lines are stored as JSONB: [{ pKey, qty }]
const Cart = sequelize.define('Cart', {
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
}, {
    tableName: 'carts',
    timestamps: true,
});

module.exports = Cart;
