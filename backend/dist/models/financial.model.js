"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtFee = exports.Bill = exports.PaymentReceipt = exports.Invoice = void 0;
const mongoose_1 = require("mongoose");
const commonFields = {
    id: { type: String, required: true, unique: true },
    clientId: { type: Number, required: true },
    clientName: String,
    caseId: String,
    date: { type: String, required: true }
};
const invoiceSchema = new mongoose_1.Schema({
    ...commonFields,
    items: [{
            description: { type: String, required: true },
            amount: { type: Number, required: true }
        }],
    totalAmount: { type: Number, required: true },
    vatRate: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['paid', 'unpaid', 'overdue'],
        default: 'unpaid'
    }
}, {
    timestamps: true
});
const paymentReceiptSchema = new mongoose_1.Schema({
    ...commonFields,
    amount: { type: Number, required: true },
    amountInWords: { type: String, required: true },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'Cheque']
    },
    chequeDetails: {
        no: String,
        date: String,
        bank: String
    },
    description: { type: String, required: true }
}, {
    timestamps: true
});
const billSchema = new mongoose_1.Schema({
    ...commonFields,
    items: [{
            description: { type: String, required: true },
            qty: { type: Number, required: true },
            rate: { type: Number, required: true },
            amount: { type: Number, required: true }
        }],
    totalAmount: { type: Number, required: true }
}, {
    timestamps: true
});
const courtFeeSchema = new mongoose_1.Schema({
    ...commonFields,
    court: { type: String, required: true },
    items: [{
            description: { type: String, required: true },
            amount: { type: Number, required: true }
        }],
    totalAmount: { type: Number, required: true }
}, {
    timestamps: true
});
// Indexes
invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ caseId: 1 });
billSchema.index({ clientId: 1, caseId: 1 });
courtFeeSchema.index({ caseId: 1, court: 1 });
exports.Invoice = (0, mongoose_1.model)('Invoice', invoiceSchema);
exports.PaymentReceipt = (0, mongoose_1.model)('PaymentReceipt', paymentReceiptSchema);
exports.Bill = (0, mongoose_1.model)('Bill', billSchema);
exports.CourtFee = (0, mongoose_1.model)('CourtFee', courtFeeSchema);
//# sourceMappingURL=financial.model.js.map