"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCase = exports.linkCases = exports.updateCase = exports.createCase = exports.getCaseById = exports.getCases = void 0;
const case_model_1 = require("../models/case.model");
const case_schema_1 = require("../schemas/case.schema");
const logger_1 = require("../utils/logger");
const getCases = async (req, res) => {
    try {
        const { status, priority, assignedLawyerId, court, search, page = 1, limit = 20 } = req.query;
        // Build query
        const query = {};
        if (status)
            query.status = status;
        if (priority)
            query.priority = priority;
        if (assignedLawyerId)
            query.assignedLawyerId = Number(assignedLawyerId);
        if (court)
            query.court = court;
        if (search) {
            query.$or = [
                { caseNumber: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }
        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);
        // Get cases with pagination
        const cases = await case_model_1.Case.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ openDate: -1 });
        // Get total count for pagination
        const total = await case_model_1.Case.countDocuments(query);
        // Get related employee names
        const employeeIds = new Set();
        cases.forEach(caseItem => {
            employeeIds.add(caseItem.assignedLawyerId);
            if (caseItem.assistantLawyerId) {
                employeeIds.add(caseItem.assistantLawyerId);
            }
        });
        const employees = await Employee.find({ id: { $in: Array.from(employeeIds) } });
        const employeeMap = new Map(employees.map(emp => [emp.id, emp.name]));
        // Get related client names
        const clientIds = new Set();
        cases.forEach(caseItem => {
            caseItem.parties.forEach(party => clientIds.add(party.clientId));
        });
        const clients = await Client.find({ id: { $in: Array.from(clientIds) } });
        const clientMap = new Map(clients.map(client => [client.id, {
                nameAr: client.nameAr,
                nameEn: client.nameEn
            }]));
        // Enrich case data with names
        const enrichedCases = cases.map(caseItem => ({
            ...caseItem.toObject(),
            assignedLawyerName: employeeMap.get(caseItem.assignedLawyerId),
            assistantLawyerName: caseItem.assistantLawyerId ? employeeMap.get(caseItem.assistantLawyerId) : null,
            parties: caseItem.parties.map(party => ({
                ...party,
                client: clientMap.get(party.clientId)
            }))
        }));
        res.json({
            status: 'success',
            data: {
                cases: enrichedCases,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting cases:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getCases = getCases;
const getCaseById = async (req, res) => {
    try {
        const caseItem = await case_model_1.Case.findOne({ caseNumber: req.params.id });
        if (!caseItem) {
            return res.status(404).json({
                status: 'error',
                message: 'Case not found'
            });
        }
        res.json({
            status: 'success',
            data: { case: caseItem }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting case:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getCaseById = getCaseById;
const createCase = async (req, res) => {
    try {
        // Validate input
        const validatedData = case_schema_1.caseSchema.parse(req.body);
        // Check for existing case with same number
        const existingCase = await case_model_1.Case.findOne({ caseNumber: validatedData.caseNumber });
        if (existingCase) {
            return res.status(400).json({
                status: 'error',
                message: 'Case with this number already exists'
            });
        }
        // Create new case
        const caseItem = await case_model_1.Case.create(validatedData);
        res.status(201).json({
            status: 'success',
            data: { case: caseItem }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating case:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation error',
                errors: error.errors
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.createCase = createCase;
const updateCase = async (req, res) => {
    try {
        // Validate input
        const validatedData = case_schema_1.caseUpdateSchema.parse(req.body);
        // Check if case exists
        const caseItem = await case_model_1.Case.findOne({ caseNumber: req.params.id });
        if (!caseItem) {
            return res.status(404).json({
                status: 'error',
                message: 'Case not found'
            });
        }
        // Update case
        const updatedCase = await case_model_1.Case.findOneAndUpdate({ caseNumber: req.params.id }, { $set: validatedData }, { new: true });
        res.json({
            status: 'success',
            data: { case: updatedCase }
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating case:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation error',
                errors: error.errors
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.updateCase = updateCase;
const linkCases = async (req, res) => {
    try {
        const { cases } = req.body;
        if (!Array.isArray(cases) || cases.length < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'At least two case numbers are required'
            });
        }
        // Update all cases to include links to each other
        await Promise.all(cases.map(async (caseNumber) => {
            const otherCases = cases.filter(num => num !== caseNumber);
            await case_model_1.Case.findOneAndUpdate({ caseNumber }, { $addToSet: { linkedCases: { $each: otherCases } } });
        }));
        res.json({
            status: 'success',
            message: 'Cases linked successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error linking cases:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.linkCases = linkCases;
const deleteCase = async (req, res) => {
    try {
        const caseItem = await case_model_1.Case.findOneAndDelete({ caseNumber: req.params.id });
        if (!caseItem) {
            return res.status(404).json({
                status: 'error',
                message: 'Case not found'
            });
        }
        // Remove this case from linkedCases arrays of other cases
        await case_model_1.Case.updateMany({ linkedCases: req.params.id }, { $pull: { linkedCases: req.params.id } });
        res.json({
            status: 'success',
            message: 'Case deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting case:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.deleteCase = deleteCase;
//# sourceMappingURL=case.controller.js.map