"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_routes_1 = __importDefault(require("./auth.routes"));
const client_routes_1 = __importDefault(require("./client.routes"));
const case_routes_1 = __importDefault(require("./case.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const hr_routes_1 = __importDefault(require("./hr.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const setupRoutes = (app) => {
    // API version prefix
    const apiPrefix = '/api/v1';
    // Mount routes
    app.use(`${apiPrefix}/auth`, auth_routes_1.default);
    app.use(`${apiPrefix}/clients`, client_routes_1.default);
    app.use(`${apiPrefix}/cases`, case_routes_1.default);
    app.use(`${apiPrefix}/tasks`, task_routes_1.default);
    app.use(`${apiPrefix}/employees`, hr_routes_1.default);
    app.use(`${apiPrefix}/notifications`, notification_routes_1.default);
    // Additional routes will be mounted here as they are created
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map