let jwt = require('jsonwebtoken')
let userController = require("../controllers/users")
let { getKeys } = require('./keys')

module.exports = {
    checkLogin: async function (req, res, next) {
        try {
            let token = req.headers.authorization;
            if (!token || !token.startsWith('Bearer')) {
                res.status(404).send("ban chua dang nhap")
                return;
            }
            token = token.split(" ")[1];
            
            // Lấy public key để verify
            let { publicKey } = getKeys();
            
            // Verify token với RS256
            let result = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
            
            if (result.exp * 1000 > Date.now()) {
                let user = await userController.FindUserById(result.id);
                if (user) {
                    req.user = user
                    next()
                } else {
                    res.status(404).send("ban chua dang nhap")
                }
            } else {
                res.status(404).send("ban chua dang nhap")
            }
        } catch (error) {
            res.status(404).send("ban chua dang nhap")
        }
    }
}