let userModel = require('../schemas/users')
let bcrypt = require('bcrypt')
module.exports = {
    CreateAnUser: async function (
        username, password, email, role, fullname, avatarUrl, status, loginCount) {
        let newUser = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullname,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newUser.save();
        return newUser;
    },
    FindUserByUsername: async function (username) {
        return await userModel.findOne({
            username: username,
            isDeleted: false
        })
    },
    FindUserById: async function (id) {
        try {
            return await userModel.findOne({
                _id: id,
                isDeleted: false
            })
        } catch (error) {
            return false
        }
    },
    ChangePassword: async function (id, oldPassword, newPassword) {
        try {
            let user = await userModel.findOne({
                _id: id,
                isDeleted: false
            });
            if (!user) {
                return { success: false, message: "User khong ton tai" }
            }
            // Verify old password
            if (!bcrypt.compareSync(oldPassword, user.password)) {
                return { success: false, message: "Old password khong dung" }
            }
            // Update password
            user.password = newPassword;
            await user.save();
            return { success: true, message: "Thay doi password thanh cong" }
        } catch (error) {
            return { success: false, message: "Co loi xay ra: " + error.message }
        }
    }
}