"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userSchema = new mongoose_1.Schema({
    employeeId: { type: Number },
    clientId: { type: Number },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, required: true, enum: ['Employee', 'Client'] },
    permissions: [{ type: String }]
}, {
    timestamps: true
});
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method
userSchema.methods.comparePassword = async function (password) {
    return bcryptjs_1.default.compare(password, this.password);
};
// Generate JWT token
userSchema.methods.generateToken = function () {
    return jsonwebtoken_1.default.sign({
        id: this._id,
        userType: this.userType,
        employeeId: this.employeeId,
        clientId: this.clientId
    }, process.env.JWT_SECRET || 'your-secret-key-here', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map