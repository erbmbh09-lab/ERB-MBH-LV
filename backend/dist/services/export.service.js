"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const task_model_1 = require("../models/task.model");
const employee_model_1 = require("../models/employee.model");
const logger_1 = require("../utils/logger");
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
class ExportService {
    /**
     * Generate task report in specified format
     */
    static async generateReport(options) {
        try {
            // Get tasks with filters
            const tasks = await this.getFilteredTasks(options);
            // Generate report in requested format
            return options.format === 'pdf'
                ? await this.generatePDFReport(tasks, options)
                : await this.generateExcelReport(tasks, options);
        }
        catch (error) {
            logger_1.logger.error('Error generating report:', error);
            throw error;
        }
    }
    /**
     * Generate Excel report
     */
    static async generateExcelReport(tasks, options) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Tasks Report');
        // Set up columns based on report type
        if (options.type === 'timesheet') {
            worksheet.columns = [
                { header: 'المهمة', key: 'title', width: 30 },
                { header: 'التاريخ', key: 'date', width: 15 },
                { header: 'الساعات', key: 'hours', width: 10 },
                { header: 'الوصف', key: 'description', width: 40 },
                { header: 'قابل للفوترة', key: 'billable', width: 15 }
            ];
            // Add timesheet data
            const timesheetData = tasks.flatMap(task => (task.timeEntries || []).map((entry) => ({
                title: task.title,
                date: entry.date,
                hours: entry.hours,
                description: entry.description,
                billable: entry.billable ? 'نعم' : 'لا'
            })));
            worksheet.addRows(timesheetData);
        }
        else if (options.type === 'billing') {
            worksheet.columns = [
                { header: 'المهمة', key: 'title', width: 30 },
                { header: 'نوع التسعير', key: 'rateType', width: 15 },
                { header: 'المعدل', key: 'rate', width: 10 },
                { header: 'الساعات', key: 'hours', width: 10 },
                { header: 'المبلغ', key: 'amount', width: 15 },
                { header: 'العملة', key: 'currency', width: 10 }
            ];
            // Add billing data
            const billingData = tasks.map(task => ({
                title: task.title,
                rateType: this.translateRateType(task.billing?.rateType),
                rate: task.billing?.rate || 0,
                hours: task.actualHours || 0,
                amount: this.calculateAmount(task),
                currency: task.billing?.currency || 'USD'
            }));
            worksheet.addRows(billingData);
        }
        else {
            worksheet.columns = [
                { header: 'العنوان', key: 'title', width: 30 },
                { header: 'الحالة', key: 'status', width: 15 },
                { header: 'الأولوية', key: 'priority', width: 15 },
                { header: 'المسند إليه', key: 'assignee', width: 20 },
                { header: 'تاريخ الاستحقاق', key: 'dueDate', width: 15 },
                { header: 'التقدم', key: 'progress', width: 10 }
            ];
            // Add task data
            const taskData = await this.enrichTasksData(tasks);
            worksheet.addRows(taskData);
        }
        // Apply styling
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.font = { name: 'Arial', size: 11 };
            });
        });
        // Make headers bold
        worksheet.getRow(1).font = { bold: true };
        return await workbook.xlsx.writeBuffer();
    }
    /**
     * Generate PDF report
     */
    static async generatePDFReport(tasks, options) {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: 'A4',
                    margin: 50,
                    bufferPages: true
                });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                // Add header
                doc.font('fonts/Arial.ttf')
                    .fontSize(20)
                    .text(this.getReportTitle(options), { align: 'right' });
                // Add date range if specified
                if (options.dateRange) {
                    doc.moveDown()
                        .fontSize(12)
                        .text(`الفترة: ${options.dateRange.from} - ${options.dateRange.to}`, { align: 'right' });
                }
                // Add content based on report type
                if (options.type === 'timesheet') {
                    await this.addTimesheetPDFContent(doc, tasks);
                }
                else if (options.type === 'billing') {
                    await this.addBillingPDFContent(doc, tasks);
                }
                else {
                    await this.addTasksPDFContent(doc, tasks);
                }
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Helper methods
     */
    static async getFilteredTasks(options) {
        const filter = {};
        if (options.filters) {
            if (options.filters.status)
                filter.status = { $in: options.filters.status };
            if (options.filters.category)
                filter.category = { $in: options.filters.category };
            if (options.filters.assigneeId)
                filter.assigneeId = options.filters.assigneeId;
        }
        if (options.dateRange) {
            filter.createdAt = {
                $gte: options.dateRange.from,
                $lte: options.dateRange.to
            };
        }
        return await task_model_1.Task.find(filter);
    }
    static async enrichTasksData(tasks) {
        const employeeIds = new Set(tasks.map(t => t.assigneeId));
        const employees = await employee_model_1.Employee.find({ id: { $in: Array.from(employeeIds) } });
        const employeeMap = new Map(employees.map(e => [e.id, e.name]));
        return tasks.map(task => ({
            title: task.title,
            status: this.translateStatus(task.status),
            priority: this.translatePriority(task.priority),
            assignee: employeeMap.get(task.assigneeId) || 'غير معروف',
            dueDate: task.dueDate,
            progress: `${task.progress || 0}%`
        }));
    }
    static calculateAmount(task) {
        if (!task.billing || task.billing.rateType === 'non-billable')
            return 0;
        if (task.billing.rateType === 'fixed')
            return task.billing.rate || 0;
        return (task.actualHours || 0) * (task.billing.rate || 0);
    }
    static getReportTitle(options) {
        const titles = {
            timesheet: 'تقرير سجل الساعات',
            billing: 'تقرير الفوترة',
            task: 'تقرير المهام'
        };
        return titles[options.type];
    }
    static translateStatus(status) {
        const translations = {
            'new': 'جديدة',
            'in-progress': 'قيد التنفيذ',
            'completed': 'مكتملة',
            'cancelled': 'ملغاة'
        };
        return translations[status] || status;
    }
    static translatePriority(priority) {
        const translations = {
            'low': 'منخفضة',
            'medium': 'متوسطة',
            'high': 'عالية'
        };
        return translations[priority] || priority;
    }
    static translateRateType(rateType) {
        const translations = {
            'hourly': 'بالساعة',
            'fixed': 'ثابت',
            'non-billable': 'غير قابل للفوترة'
        };
        return translations[rateType] || rateType;
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=export.service.js.map