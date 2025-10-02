"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStepDocuments = exports.processStepAction = exports.initializeWorkflow = void 0;
const workflow_service_1 = require("../services/workflow.service");
const logger_1 = require("../utils/logger");
const initializeWorkflow = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { steps } = req.body;
        const task = await workflow_service_1.WorkflowService.initializeWorkflow(taskId, steps);
        res.json({
            status: 'success',
            data: { task }
        });
    }
    catch (error) {
        logger_1.logger.error('Error initializing workflow:', error);
        throw error;
    }
};
exports.initializeWorkflow = initializeWorkflow;
const processStepAction = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { stepNumber, action, notes } = req.body;
        const task = await workflow_service_1.WorkflowService.processStepAction(taskId, stepNumber, req.user.employeeId, action, notes);
        res.json({
            status: 'success',
            data: { task }
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing workflow step:', error);
        throw error;
    }
};
exports.processStepAction = processStepAction;
const addStepDocuments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { stepNumber, documents } = req.body;
        const task = await workflow_service_1.WorkflowService.addStepDocuments(taskId, stepNumber, req.user.employeeId, documents);
        res.json({
            status: 'success',
            data: { task }
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding step documents:', error);
        throw error;
    }
};
exports.addStepDocuments = addStepDocuments;
//# sourceMappingURL=workflow.controller.js.map