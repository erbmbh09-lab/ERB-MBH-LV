import { Task } from '../models/task.model';
import { Employee } from '../models/employee.model';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

interface ExportOptions {
  format: 'pdf' | 'excel';
  type: 'task' | 'timesheet' | 'billing';
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    status?: string[];
    category?: string[];
    assigneeId?: number;
  };
  groupBy?: 'user' | 'category' | 'status';
}

export class ExportService {
  /**
   * Generate task report in specified format
   */
  static async generateReport(options: ExportOptions): Promise<Buffer> {
    try {
      // Get tasks with filters
      const tasks = await this.getFilteredTasks(options);
      
      // Generate report in requested format
      return options.format === 'pdf' 
        ? await this.generatePDFReport(tasks, options)
        : await this.generateExcelReport(tasks, options);
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Generate Excel report
   */
  private static async generateExcelReport(tasks: any[], options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
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
      const timesheetData = tasks.flatMap(task => 
        (task.timeEntries || []).map((entry: any) => ({
          title: task.title,
          date: entry.date,
          hours: entry.hours,
          description: entry.description,
          billable: entry.billable ? 'نعم' : 'لا'
        }))
      );

      worksheet.addRows(timesheetData);
    } else if (options.type === 'billing') {
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
    } else {
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

  // ExcelJS: writeBuffer is a method on workbook.xlsx
  return await workbook.xlsx.writeBuffer();
  }

  /**
   * Generate PDF report
   */
  private static async generatePDFReport(tasks: any[], options: ExportOptions): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        const chunks: Buffer[] = [];
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
        } else if (options.type === 'billing') {
          await this.addBillingPDFContent(doc, tasks);
        } else {
          await this.addTasksPDFContent(doc, tasks);
        }
  // --- PDF Content Stubs ---
  private static async addTimesheetPDFContent(doc: any, tasks: any[]) {
    doc.moveDown().fontSize(14).text('سجل الساعات (تجريبي)', { align: 'right' });
    // Add stub content for now
    tasks.forEach((task, i) => {
      doc.text(`${i + 1}. ${task.title} - ${task.actualHours || 0} ساعة`, { align: 'right' });
    });
  }

  private static async addBillingPDFContent(doc: any, tasks: any[]) {
    doc.moveDown().fontSize(14).text('تقرير الفوترة (تجريبي)', { align: 'right' });
    tasks.forEach((task, i) => {
      doc.text(`${i + 1}. ${task.title} - ${task.billing?.amount || 0} ${task.billing?.currency || ''}`, { align: 'right' });
    });
  }

  private static async addTasksPDFContent(doc: any, tasks: any[]) {
    doc.moveDown().fontSize(14).text('تقرير المهام (تجريبي)', { align: 'right' });
    tasks.forEach((task, i) => {
      doc.text(`${i + 1}. ${task.title} - ${this.translateStatus(task.status)}`, { align: 'right' });
    });
  }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper methods
   */
  private static async getFilteredTasks(options: ExportOptions) {
    const filter: any = {};
    
    if (options.filters) {
      if (options.filters.status) filter.status = { $in: options.filters.status };
      if (options.filters.category) filter.category = { $in: options.filters.category };
      if (options.filters.assigneeId) filter.assigneeId = options.filters.assigneeId;
    }

    if (options.dateRange) {
      filter.createdAt = {
        $gte: options.dateRange.from,
        $lte: options.dateRange.to
      };
    }

    return await Task.find(filter);
  }

  private static async enrichTasksData(tasks: any[]) {
    const employeeIds = new Set(tasks.map(t => t.assigneeId));
    const employees = await Employee.find({ id: { $in: Array.from(employeeIds) } });
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

  private static calculateAmount(task: any): number {
    if (!task.billing || task.billing.rateType === 'non-billable') return 0;
    if (task.billing.rateType === 'fixed') return task.billing.rate || 0;
    return (task.actualHours || 0) * (task.billing.rate || 0);
  }

  private static getReportTitle(options: ExportOptions): string {
    const titles = {
      timesheet: 'تقرير سجل الساعات',
      billing: 'تقرير الفوترة',
      task: 'تقرير المهام'
    };
    return titles[options.type];
  }

  private static translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'new': 'جديدة',
      'in-progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة'
    };
    return translations[status] || status;
  }

  private static translatePriority(priority: string): string {
    const translations: { [key: string]: string } = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية'
    };
    return translations[priority] || priority;
  }

  private static translateRateType(rateType: string): string {
    const translations: { [key: string]: string } = {
      'hourly': 'بالساعة',
      'fixed': 'ثابت',
      'non-billable': 'غير قابل للفوترة'
    };
    return translations[rateType] || rateType;
  }

  // --- PDF Content Stubs ---
  private static async addTimesheetPDFContent(doc: any, tasks: any[]) {
    doc.moveDown().fontSize(14).text('سجل الساعات (تجريبي)', { align: 'right' });
    // Add stub content for now
    tasks.forEach((task: any, i: number) => {
      doc.text(`${i + 1}. ${task.title} - ${task.actualHours || 0} ساعة`, { align: 'right' });
    });
  }

  private static async addBillingPDFContent(doc: any, tasks: any[]) {
    doc.moveDown().fontSize(14).text('تقرير الفوترة (تجريبي)', { align: 'right' });
    tasks.forEach((task: any, i: number) => {
      doc.text(`${i + 1}. ${task.title} - ${task.billing?.amount || 0} ${task.billing?.currency || ''}`, { align: 'right' });
    });
  }

  private static async addTasksPDFContent(doc: any, tasks: any[]) {
    doc.moveDown().fontSize(14).text('تقرير المهام (تجريبي)', { align: 'right' });
    tasks.forEach((task: any, i: number) => {
      doc.text(`${i + 1}. ${task.title} - ${this.translateStatus(task.status)}`, { align: 'right' });
    });
  }
}