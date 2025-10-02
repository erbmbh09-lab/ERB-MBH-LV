"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
// Connect to MongoDB
(0, database_1.connectDB)();
// Start the server
app_1.app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map