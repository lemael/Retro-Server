"use strict";
module.exports = (sequelize, DataTypes) => {
  // Define the Like model
  var Like = sequelize.define(
    "Like",
    {
      messageId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Message",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "User",
          key: "id",
        },
      },
      isLike: DataTypes.INTEGER,
    },
    {}
  );
  // Define associations for the Like model
  Like.associate = function (models) {
    // Define many-to-many association between User and Message through Like

    models.User.belongsToMany(models.Message, {
      through: models.Like,
      foreignKey: "userId",
      otherKey: "messageId",
    });

    models.Message.belongsToMany(models.User, {
      through: models.Like,
      foreignKey: "messageId",
      otherKey: "userId",
    });
    // Define belongs-to association between Like and User
    models.Like.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    // Define belongs-to association between Like and Message
    models.Like.belongsTo(models.Message, {
      foreignKey: "messageId",
      as: "message",
    });
  };
  return Like;
};
