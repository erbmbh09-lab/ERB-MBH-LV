"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication token is required'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
        const user = await user_model_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid authentication token'
        });
    }
};
exports.authenticate = authenticate;
const authorize = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }
            const hasAllPermissions = requiredPermissions.every(permission => user.permissions.includes(permission));
            if (!hasAllPermissions) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Insufficient permissions'
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map