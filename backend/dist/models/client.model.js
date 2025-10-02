"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const mongoose_1 = require("mongoose");
const clientSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    classification: {
        type: String,
        required: true,
        enum: ['موكل', 'خصم']
    },
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    nationality: String,
    emiratesId: String,
    passportNo: String,
    phone1: { type: String, required: true },
    phone2: String,
    email: String,
    address: String,
    username: { type: String, required: true, unique: true },
    loginEnabled: { type: Boolean, default: false }
}, {
    timestamps: true
});
// Index for efficient queries
clientSchema.index({ nameAr: 1, nameEn: 1, phone1: 1 });
exports.Client = (0, mongoose_1.model)('Client', clientSchema);
//# sourceMappingURL=client.model.js.map