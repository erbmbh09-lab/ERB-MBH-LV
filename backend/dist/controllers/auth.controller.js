"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getProfile = exports.logout = exports.login = void 0;
const user_model_1 = require("../models/user.model");
const logger_1 = require("../utils/logger");
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Find user
        const user = await user_model_1.User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }
        // Generate token
        const token = user.generateToken();
        res.json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    userType: user.userType,
                    employeeId: user.employeeId,
                    clientId: user.clientId
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    // In a token-based auth system, the frontend just needs to remove the token
    res.json({
        status: 'success',
        message: 'Successfully logged out'
    });
};
exports.logout = logout;
const getProfile = async (req, res) => {
    try {
        const user = await user_model_1.User.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        res.json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    userType: user.userType,
                    employeeId: user.employeeId,
                    clientId: user.clientId
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getProfile = getProfile;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await user_model_1.User.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
        }
        // Update password
        user.password = newPassword;
        await user.save();
        res.json({
            status: 'success',
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.controller.js.map