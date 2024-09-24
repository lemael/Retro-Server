// Imports
var models = require("../models"); // Imports the database models
var jwtUtils = require("../utils/jwt.utils"); // Utility functions for JWT authentication
var asyncLib = require("async"); // Library for managing asynchronous operations

// Constants
const DISLIKED = 0; // Constant representing a "dislike" reaction
const LIKED = 1; // Constant representing a "like" reaction

// Routes
module.exports = {
  likePost: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"]; // Retrieves the authorization token from the headers
    var userId = jwtUtils.getUserId(headerAuth); // Extracts user ID from the JWT token

    // Params
    var messageId = parseInt(req.params.messageId); // Parses the messageId from request parameters

    // Validate messageId
    if (messageId <= 0) {
      return res.status(400).json({ error: "invalid parameters" }); // Return error if the messageId is invalid
    }

    // Begin waterfall sequence to handle async operations
    asyncLib.waterfall(
      [
        // Step 1: Find the message (post) by ID
        function (done) {
          models.Message.findOne({
            where: { id: messageId },
          })
            .then(function (messageFound) {
              done(null, messageFound); // Pass found message to the next step
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to verify message" }); // Error if the message is not found
            });
        },
        // Step 2: Find the user by ID
        function (messageFound, done) {
          if (messageFound) {
            models.User.findOne({
              where: { id: userId },
            })
              .then(function (userFound) {
                done(null, messageFound, userFound); // Pass message and user to the next step
              })
              .catch(function (err) {
                return res.status(500).json({ error: "unable to verify user" }); // Error if user is not found
              });
          } else {
            res.status(404).json({ error: "post already liked" }); // Error if post is already liked
          }
        },
        // Step 3: Check if the user has already liked the post
        function (messageFound, userFound, done) {
          if (userFound) {
            models.Like.findOne({
              where: {
                userId: userId,
                messageId: messageId,
              },
            })
              .then(function (userAlreadyLikedFound) {
                done(null, messageFound, userFound, userAlreadyLikedFound); // Pass like status to the next step
              })
              .catch(function (err) {
                return res
                  .status(500)
                  .json({ error: "unable to verify is user already liked" }); // Error if like status can't be verified
              });
          } else {
            res.status(404).json({ error: "user not exist" }); // Error if user does not exist
          }
        },
        // Step 4: Handle the like logic (add or update like)
        function (messageFound, userFound, userAlreadyLikedFound, done) {
          if (!userAlreadyLikedFound) {
            // If user hasn't liked the post before, add the like
            messageFound
              .addUser(userFound, { isLike: LIKED })
              .then(function (alreadyLikeFound) {
                done(null, messageFound, userFound); // Pass updated message and user to the next step
              })
              .catch(function (err) {
                return res
                  .status(500)
                  .json({ error: "unable to set user reaction" }); // Error if unable to set like
              });
          } else {
            // If user has previously disliked, update the reaction to "liked"
            if (userAlreadyLikedFound.isLike === DISLIKED) {
              userAlreadyLikedFound
                .update({
                  isLike: LIKED,
                })
                .then(function () {
                  done(null, messageFound, userFound); // Pass updated message and user to the next step
                })
                .catch(function (err) {
                  res
                    .status(500)
                    .json({ error: "cannot update user reaction" }); // Error if reaction update fails
                });
            } else {
              // Error if the message has already been liked
              res.status(409).json({ error: "message already liked" });
            }
          }
        },
        // Step 5: Update the like counter on the post
        function (messageFound, userFound, done) {
          messageFound
            .update({
              likes: messageFound.likes + 1, // Increment the like counter by 1
            })
            .then(function () {
              done(messageFound); // Pass the updated message to the final callback
            })
            .catch(function (err) {
              res
                .status(500)
                .json({ error: "cannot update message like counter" }); // Error if unable to update like counter
            });
        },
      ],
      // Final callback: Send the updated message as a response
      function (messageFound) {
        if (messageFound) {
          return res.status(201).json(messageFound); // Respond with the updated message (status 201: created)
        } else {
          return res.status(500).json({ error: "cannot update message" }); // Error if unable to update the message
        }
      }
    );
  },

  dislikePost: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"]; // Retrieves the authorization token from the headers
    var userId = jwtUtils.getUserId(headerAuth); // Extracts user ID from the JWT token

    // Params
    var messageId = parseInt(req.params.messageId); // Parses the messageId from request parameters

    // Validate messageId
    if (messageId <= 0) {
      return res.status(400).json({ error: "invalid parameters" }); // Return error if the messageId is invalid
    }

    // Begin waterfall sequence to handle async operations
    asyncLib.waterfall([
      // Step 1: Find the message (post) by ID
      function (done) {
        models.Message.findOne({
          where: { id: messageId },
        })
          .then(function (messageFound) {
            done(null, messageFound); // Pass found message to the next step
          })
          .catch(function (err) {
            return res.status(500).json({ error: "unable to verify message" }); // Error if the message is not found
          });
      },
      // Step 2: Find the user by ID
      function (messageFound, done) {
        if (messageFound) {
          models.User.findOne({
            where: { id: userId },
          })
            .then(function (userFound) {
              done(null, messageFound, userFound); // Pass message and user to the next step
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" }); // Error if user is not found
            });
        } else {
          res.status(404).json({ error: "post already liked" }); // Error if post is already liked
        }
      },
      // Step 3: Check if the user has already disliked the post
      function (messageFound, userFound, done) {
        if (userFound) {
          models.Like.findOne({
            where: {
              userId: userId,
              messageId: messageId,
            },
          })
            .then(function (userAlreadyLikedFound) {
              done(null, messageFound, userFound, userAlreadyLikedFound); // Pass like status to the next step
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to verify is user already liked" }); // Error if like status can't be verified
            });
        } else {
          res.status(404).json({ error: "user not exist" }); // Error if user does not exist
        }
      },
      // Step 4: Handle the dislike logic (add or update dislike)
      function (messageFound, userFound, userAlreadyLikedFound, done) {
        if (!userAlreadyLikedFound) {
          // If user hasn't disliked the post before, add the dislike
          messageFound
            .addUser(userFound, { isLike: DISLIKED })
            .then(function (alreadyLikeFound) {
              done(null, messageFound, userFound); // Pass updated message and user to the next step
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to set user reaction" }); // Error if unable to set dislike
            });
        } else {
          // If user has previously liked, update the reaction to "disliked"
          if (userAlreadyLikedFound.isLike === LIKED) {
            userAlreadyLikedFound
              .update({
                isLike: DISLIKED,
              })
              .then(function () {
                done(null, messageFound, userFound); // Pass updated message and user to the next step
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot update user reaction" }); // Error if
              });
          }
        }
      },
    ]);
  },
};
