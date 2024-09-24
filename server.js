// Imports
var express = require("express");
var bodyParser = require("body-parser");
var apiRouter = require("./apiRouter").router;

// Instantiate server
var server = express();

// Body Parser Configuration

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

// Configure routes
server.get("/", function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send("<h1>Guten Tag das ist mein schönes server</h1>");
});

server.use("/api", apiRouter);
// Launch server
server.listen(3000, function () {
  console.log("Server is running on port 3000");
});
