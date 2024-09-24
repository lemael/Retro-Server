// Imports
var jwt = require("jsonwebtoken");

const JWT_SIGN_SECRET =
  "0sjs6gf9mk9nwxq22pzn5hvpxmpgtty34tfx8gz17sy6djnm0xuc65bi9rcc";
// Exported functions
module.exports = {
  generateTokenForUser: function (userData) {
    // Generate a token with the user's data
    return jwt.sign(
      {
        userId: userData.id,
        isAdmin: userData.isAdmin,
      },
      JWT_SIGN_SECRET,
      {
        expiresIn: "1h", // Token expires in 1 hour
      }
    );
  },
  parseAuthorization: function (authorization) {
    return authorization != null ? authorization.replace("Bearer ", "") : null;
  },
  getUserId: function (authorization) {
    var userId = -1;
    var token = module.exports.parseAuthorization(authorization);
    if (token != null) {
      try {
        var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
        if (jwtToken != null) userId = jwtToken.userId;
      } catch (err) {}
    }
    return userId;
  },
};
