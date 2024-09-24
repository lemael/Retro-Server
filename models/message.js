"use strict";
module.exports = (sequelize, DataTypes) => {
  // Define the Message model
  var Message = sequelize.define(
    "Message",
    {
      title: DataTypes.STRING,
      content: DataTypes.STRING,
      attachment: DataTypes.STRING,
      likes: DataTypes.INTEGER,
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      // Declaration of class methods
      classMethods: {
        // Definition of associations
        associate: function (models) {
          // Associate Message with User
          models.Message.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
          });
        },
      },
    }
  );
  return Message;
};
