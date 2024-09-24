// Imports
var models = require("../models"); // Import the database models
var asyncLib = require("async"); // Import async library to handle asynchronous operations
var jwtUtils = require("../utils/jwt.utils"); // Utility functions for handling JWT (JSON Web Token)

// Constants
const TITLE_LIMIT = 2; // Minimum length of the message title
const CONTENT_LIMIT = 4; // Minimum length of the message content
const ITEMS_LIMIT = 50; // Maximum number of items to return in a list query

// Routes (module exports)
module.exports = {
  // Route to create a new message (post)
  createMessage: function (req, res) {
    // Getting authorization header
    var headerAuth = req.headers["authorization"]; // Retrieve the JWT token from the request headers
    var userId = jwtUtils.getUserId(headerAuth); // Extract the user ID from the JWT token

    // Params (Request body parameters)
    var title = req.body.title; // Get the title of the message
    var content = req.body.content; // Get the content of the message

    // Check if the required parameters are missing
    if (title == null || content == null) {
      return res.status(400).json({ error: "missing parameters" }); // Respond with 400 error if title or content is missing
    }

    // Validate title and content length
    if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
      return res.status(400).json({ error: "invalid parameters" }); // Respond with 400 error if title or content is too short
    }

    // Use async waterfall to manage asynchronous operations in sequence
    asyncLib.waterfall(
      [
        // Step 1: Find the user by userId
        function (done) {
          models.User.findOne({
            where: { id: userId },
          })
            .then(function (userFound) {
              done(null, userFound); // Pass the found user to the next step
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" }); // Respond with 500 error if user verification fails
            });
        },
        // Step 2: Create a new message if the user is found
        function (userFound, done) {
          if (userFound) {
            models.Message.create({
              title: title, // Set the title of the message
              content: content, // Set the content of the message
              likes: 0, // Initialize the likes count to 0
              UserId: userFound.id, // Associate the message with the user who created it
            })
              .then(function (newMessage) {
                done(newMessage); // Pass the new message to the final callback
              })
              .catch(function (newMessage) {
                console.log(newMessage);
                return res
                  .status(500)
                  .json({ error: "unable to create message" }); // Respond with 500 error if message creation fails
              });
          } else {
            res.status(404).json({ error: "user not found" }); // Respond with 404 error if the user does not exist
          }
        },
      ],
      // Final callback: Return the newly created message
      function (newMessage) {
        if (newMessage) {
          return res.status(201).json(newMessage); // Respond with the created message (status 201: created)
        } else {
          return res.status(500).json({ error: "cannot post message" }); // Respond with 500 error if message creation fails
        }
      }
    );
  },

  // Route to list messages with optional query filters
  listMessages: function (req, res) {
    // Query parameters
    var fields = req.query.fields; // Get specific fields to return (optional)
    var limit = parseInt(req.query.limit); // Get the limit of messages to return (optional)
    var offset = parseInt(req.query.offset); // Get the offset for pagination (optional)
    var order = req.query.order; // Get the order in which messages should be sorted (optional)

    // Enforce the maximum limit for returned items
    if (limit > ITEMS_LIMIT) {
      limit = ITEMS_LIMIT; // Set limit to ITEMS_LIMIT if it exceeds the maximum allowed limit
    }

    // Query the database to find all messages with the given filters
    models.Message.findAll({
      order: [order != null ? order.split(":") : ["title", "ASC"]], // Set the order of messages (default: sort by title in ascending order)
      attributes: fields !== "*" && fields != null ? fields.split(",") : null, // Return only specified fields if provided
      limit: !isNaN(limit) ? limit : null, // Set the limit if it's a valid number
      offset: !isNaN(offset) ? offset : null, // Set the offset if it's a valid number
      include: [
        {
          model: models.User, // Include the associated user model
          attributes: ["username"], // Return only the username of the user
        },
      ],
    })
      .then(function (messages) {
        if (messages) {
          res.status(200).json(messages); // Respond with the list of messages (status 200: success)
        } else {
          res.status(404).json({ error: "no messages found" }); // Respond with 404 error if no messages are found
        }
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).json({ error: "invalid fields" }); // Respond with 500 error if query fails
      });
  },
};
