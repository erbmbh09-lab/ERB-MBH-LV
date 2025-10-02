"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientUpdateSchema = exports.clientSchema = void 0;
const zod_1 = require("zod");
exports.clientSchema = zod_1.z.object({
    id: zod_1.z.number(),
    classification: zod_1.z.enum(['موكل', 'خصم']),
    nameAr: zod_1.z.string().min(2, 'Arabic name must be at least 2 characters'),
    nameEn: zod_1.z.string().min(2, 'English name must be at least 2 characters'),
    nationality: zod_1.z.string().optional(),
    emiratesId: zod_1.z.string().optional(),
    passportNo: zod_1.z.string().optional(),
    phone1: zod_1.z.string().min(9, 'Phone number must be at least 9 digits'),
    phone2: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
    address: zod_1.z.string().optional(),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    loginEnabled: zod_1.z.boolean()
});
exports.clientUpdateSchema = exports.clientSchema.partial().omit({ id: true });
//# sourceMappingURL=client.schema.js.map