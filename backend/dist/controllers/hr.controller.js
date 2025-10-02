"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getEmployees = void 0;
const employee_model_1 = require("../models/employee.model");
const user_model_1 = require("../models/user.model");
const employee_schema_1 = require("../schemas/employee.schema");
const logger_1 = require("../utils/logger");
const getEmployees = async (req, res) => {
    try {
        const { role, branch, department, contractType, search, page = 1, limit = 20 } = req.query;
        // Build query
        const query = {};
        if (role)
            query.role = role;
        if (branch)
            query.branch = branch;
        if (department)
            query.department = department;
        if (contractType)
            query.contractType = contractType;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobilePhone: { $regex: search } }
            ];
        }
        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);
        const employees = await employee_model_1.Employee.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ name: 1 });
        const total = await employee_model_1.Employee.countDocuments(query);
        // Get user login status for each employee
        const employeeIds = employees.map(emp => emp.id);
        const users = await user_model_1.User.find({ employeeId: { $in: employeeIds } });
        const userMap = new Map(users.map(user => [user.employeeId, user.loginEnabled]));
        const enrichedEmployees = employees.map(emp => ({
            ...emp.toObject(),
            hasLoginAccess: userMap.has(emp.id),
            loginEnabled: userMap.get(emp.id) || false
        }));
        res.json({
            status: 'success',
            data: {
                employees: enrichedEmployees,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting employees:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getEmployees = getEmployees;
const getEmployeeById = async (req, res) => {
    try {
        const employee = await employee_model_1.Employee.findOne({ id: req.params.id });
        if (!employee) {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        // Get user login information
        const user = await user_model_1.User.findOne({ employeeId: employee.id });
        const enrichedEmployee = {
            ...employee.toObject(),
            hasLoginAccess: !!user,
            loginEnabled: user?.loginEnabled || false
        };
        res.json({
            status: 'success',
            data: { employee: enrichedEmployee }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting employee:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getEmployeeById = getEmployeeById;
const createEmployee = async (req, res) => {
    try {
        // Validate input
        const validatedData = employee_schema_1.employeeSchema.parse(req.body);
        // Check for existing employee with same ID
        const existingEmployee = await employee_model_1.Employee.findOne({ id: validatedData.id });
        if (existingEmployee) {
            return res.status(400).json({
                status: 'error',
                message: 'Employee with this ID already exists'
            });
        }
        // Create employee
        const employee = await employee_model_1.Employee.create(validatedData);
        // Create user account if requested
        if (req.body.createLoginAccount) {
            await user_model_1.User.create({
                employeeId: employee.id,
                username: req.body.username,
                password: req.body.password, // Will be hashed by the model's pre-save hook
                userType: 'Employee',
                loginEnabled: true,
                permissions: req.body.permissions || []
            });
        }
        const enrichedEmployee = {
            ...employee.toObject(),
            hasLoginAccess: req.body.createLoginAccount,
            loginEnabled: req.body.createLoginAccount
        };
        res.status(201).json({
            status: 'success',
            data: { employee: enrichedEmployee }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating employee:', error);
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
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        // Validate input
        const validatedData = employee_schema_1.employeeUpdateSchema.parse(req.body);
        // Check if employee exists
        const employee = await employee_model_1.Employee.findOne({ id: req.params.id });
        if (!employee) {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        // Update employee
        const updatedEmployee = await employee_model_1.Employee.findOneAndUpdate({ id: req.params.id }, { $set: validatedData }, { new: true });
        // Update user account if exists
        if (req.body.username || req.body.permissions || req.body.loginEnabled !== undefined) {
            const user = await user_model_1.User.findOne({ employeeId: employee.id });
            if (user) {
                if (req.body.username)
                    user.username = req.body.username;
                if (req.body.permissions)
                    user.permissions = req.body.permissions;
                if (req.body.loginEnabled !== undefined)
                    user.loginEnabled = req.body.loginEnabled;
                await user.save();
            }
        }
        // Get updated user information
        const user = await user_model_1.User.findOne({ employeeId: employee.id });
        const enrichedEmployee = {
            ...updatedEmployee.toObject(),
            hasLoginAccess: !!user,
            loginEnabled: user?.loginEnabled || false
        };
        res.json({
            status: 'success',
            data: { employee: enrichedEmployee }
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating employee:', error);
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
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const employee = await employee_model_1.Employee.findOne({ id: req.params.id });
        if (!employee) {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        // Delete associated user account if exists
        await user_model_1.User.findOneAndDelete({ employeeId: employee.id });
        // Delete employee
        await employee_model_1.Employee.findOneAndDelete({ id: req.params.id });
        res.json({
            status: 'success',
            message: 'Employee deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting employee:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.deleteEmployee = deleteEmployee;
//# sourceMappingURL=hr.controller.js.map