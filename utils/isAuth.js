const jwt = require("jsonwebtoken");

const isAuth = (req, res, next) => {
    const accessToken = req.cookies.accessToken;

    console.log('accessToken in isAuth >> ', accessToken)

    if (!accessToken) {
        return res.send({
            status: 401,
            message: "Unauthorized: No access token provided",
            isTokenPresent : false
        });
    }

    jwt.verify(accessToken, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.send({
                status: 401,
                message: "Unauthorized: Invalid access token",
            });
        } else {
            req.name = decoded.name; // 'name' is stored in the token
            next();
        }
    });
};

module.exports = isAuth
