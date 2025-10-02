"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getClients = void 0;
const client_model_1 = require("../models/client.model");
const client_schema_1 = require("../schemas/client.schema");
const logger_1 = require("../utils/logger");
const getClients = async (req, res) => {
    try {
        const { classification, search, page = 1, limit = 20 } = req.query;
        // Build query
        const query = {};
        if (classification) {
            query.classification = classification;
        }
        if (search) {
            query.$or = [
                { nameAr: { $regex: search, $options: 'i' } },
                { nameEn: { $regex: search, $options: 'i' } },
                { phone1: { $regex: search } }
            ];
        }
        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);
        const clients = await client_model_1.Client.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const total = await client_model_1.Client.countDocuments(query);
        res.json({
            status: 'success',
            data: {
                clients,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting clients:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getClients = getClients;
const getClientById = async (req, res) => {
    try {
        const client = await client_model_1.Client.findOne({ id: req.params.id });
        if (!client) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
            });
        }
        res.json({
            status: 'success',
            data: { client }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting client:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getClientById = getClientById;
const createClient = async (req, res) => {
    try {
        // Validate input
        const validatedData = client_schema_1.clientSchema.parse(req.body);
        // Check for existing client with same ID or username
        const existingClient = await client_model_1.Client.findOne({
            $or: [
                { id: validatedData.id },
                { username: validatedData.username }
            ]
        });
        if (existingClient) {
            return res.status(400).json({
                status: 'error',
                message: 'Client with this ID or username already exists'
            });
        }
        // Create new client
        const client = await client_model_1.Client.create(validatedData);
        res.status(201).json({
            status: 'success',
            data: { client }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating client:', error);
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
exports.createClient = createClient;
const updateClient = async (req, res) => {
    try {
        // Validate input
        const validatedData = client_schema_1.clientUpdateSchema.parse(req.body);
        // Check if client exists
        const client = await client_model_1.Client.findOne({ id: req.params.id });
        if (!client) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
            });
        }
        // If username is being updated, check for uniqueness
        if (validatedData.username && validatedData.username !== client.username) {
            const existingClient = await client_model_1.Client.findOne({ username: validatedData.username });
            if (existingClient) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username already taken'
                });
            }
        }
        // Update client
        const updatedClient = await client_model_1.Client.findOneAndUpdate({ id: req.params.id }, { $set: validatedData }, { new: true });
        res.json({
            status: 'success',
            data: { client: updatedClient }
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating client:', error);
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
exports.updateClient = updateClient;
const deleteClient = async (req, res) => {
    try {
        const client = await client_model_1.Client.findOneAndDelete({ id: req.params.id });
        if (!client) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Client deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting client:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.deleteClient = deleteClient;
//# sourceMappingURL=client.controller.js.map