const jwt = require("jsonwebtoken");

const genrateJWTToken = (email)=>{
    const token = jwt.sign(email,process.env.SECRET_KEY)
    return token
}

module.exports = { genrateJWTToken }