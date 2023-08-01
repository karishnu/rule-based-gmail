const { DataTypes } = require('sequelize');
const { sequelize } = require('./index'); // This imports the Sequelize instance created in config/database.js

const Email = sequelize.define('Email', {
  messageId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  threadId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
});

module.exports = Email;