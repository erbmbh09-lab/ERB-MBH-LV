import { Request, Response } from 'express';
import { Task } from '../models/task.model';
import { taskSchema, taskUpdateSchema } from '../schemas/task.schema';
import { logger } from '../utils/logger';
import { Employee } from '../models/employee.model';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getTasks = async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      assigneeId,
      assignerId,
      type,
      relatedCaseId,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigneeId) query.assigneeId = Number(assigneeId);
    if (assignerId) query.assignerId = Number(assignerId);
    if (type) query.type = type;
    if (relatedCaseId) query.relatedCaseId = relatedCaseId;

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const tasks = await Task.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    // Fetch employee names for the tasks
    const employeeIds = new Set<number>();
    tasks.forEach(task => {
      employeeIds.add(task.assigneeId);
      employeeIds.add(task.assignerId);
      task.comments?.forEach(comment => employeeIds.add(comment.authorId));
      task.approvalWorkflow?.forEach(step => employeeIds.add(step.approverId));
    });

    const employees = await Employee.find({ id: { $in: Array.from(employeeIds) } });
    const employeeMap = new Map(employees.map(emp => [emp.id, emp.name]));

    // Enrich tasks with employee names
    const enrichedTasks = tasks.map(task => ({
      ...task.toObject(),
      assigneeName: employeeMap.get(task.assigneeId),
      assignerName: employeeMap.get(task.assignerId),
      comments: task.comments?.map(comment => ({
        ...comment,
        authorName: employeeMap.get(comment.authorId)
      })),
      approvalWorkflow: task.approvalWorkflow?.map(step => ({
        ...step,
        approverName: employeeMap.get(step.approverId)
      }))
    }));

    res.json({
      status: 'success',
      data: {
        tasks: enrichedTasks,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error getting tasks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Fetch employee names
    const employeeIds = new Set<number>([
      task.assigneeId,
      task.assignerId,
      ...(task.comments?.map(c => c.authorId) || []),
      ...(task.approvalWorkflow?.map(s => s.approverId) || [])
    ]);

    const employees = await Employee.find({ id: { $in: Array.from(employeeIds) } });
    const employeeMap = new Map(employees.map(emp => [emp.id, emp.name]));

    const enrichedTask = {
      ...task.toObject(),
      assigneeName: employeeMap.get(task.assigneeId),
      assignerName: employeeMap.get(task.assignerId),
      comments: task.comments?.map(comment => ({
        ...comment,
        authorName: employeeMap.get(comment.authorId)
      })),
      approvalWorkflow: task.approvalWorkflow?.map(step => ({
        ...step,
        approverName: employeeMap.get(step.approverId)
      }))
    };

    res.json({
      status: 'success',
      data: { task: enrichedTask }
    });
  } catch (error) {
    logger.error('Error getting task:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const validatedData = taskSchema.parse({
      ...req.body,
      assignerId: req.user.employeeId,
      createdAt: new Date().toISOString()
    });

    // Verify assignee exists
    const assignee = await Employee.findOne({ id: validatedData.assigneeId });
    if (!assignee) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid assignee'
      });
    }

    // Create task
    const task = await Task.create(validatedData);

    // Fetch employee names for response
    const employees = await Employee.find({
      id: { $in: [task.assigneeId, task.assignerId] }
    });
    const employeeMap = new Map(employees.map(emp => [emp.id, emp.name]));

    const enrichedTask = {
      ...task.toObject(),
      assigneeName: employeeMap.get(task.assigneeId),
      assignerName: employeeMap.get(task.assignerId)
    };

    res.status(201).json({
      status: 'success',
      data: { task: enrichedTask }
    });
  } catch (error) {
    logger.error('Error creating task:', error);
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

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const validatedData = taskUpdateSchema.parse(req.body);

    // Check if task exists and user has permission
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only assignee or assigner can update the task
    if (![task.assigneeId, task.assignerId].includes(req.user.employeeId)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this task'
      });
    }

    // If status is being changed to completed, add completedAt
    if (validatedData.status === 'completed' && task.status !== 'completed') {
      validatedData.completedAt = new Date().toISOString();
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true }
    );

    // Fetch employee names for response
    const employeeIds = new Set<number>([
      updatedTask!.assigneeId,
      updatedTask!.assignerId,
      ...(updatedTask!.comments?.map(c => c.authorId) || []),
      ...(updatedTask!.approvalWorkflow?.map(s => s.approverId) || [])
    ]);

    const employees = await Employee.find({ id: { $in: Array.from(employeeIds) } });
    const employeeMap = new Map(employees.map(emp => [emp.id, emp.name]));

    const enrichedTask = {
      ...updatedTask!.toObject(),
      assigneeName: employeeMap.get(updatedTask!.assigneeId),
      assignerName: employeeMap.get(updatedTask!.assignerId),
      comments: updatedTask!.comments?.map(comment => ({
        ...comment,
        authorName: employeeMap.get(comment.authorId)
      })),
      approvalWorkflow: updatedTask!.approvalWorkflow?.map(step => ({
        ...step,
        approverName: employeeMap.get(step.approverId)
      }))
    };

    res.json({
      status: 'success',
      data: { task: enrichedTask }
    });
  } catch (error) {
    logger.error('Error updating task:', error);
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

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    const comment = {
      authorId: req.user.employeeId,
      content: req.body.content,
      timestamp: new Date().toISOString()
    };

    task.comments = [...(task.comments || []), comment];
    await task.save();

    // Fetch author name
    const author = await Employee.findOne({ id: comment.authorId });

    const enrichedComment = {
      ...comment,
      authorName: author?.name
    };

    res.json({
      status: 'success',
      data: { comment: enrichedComment }
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Only task assigner can delete it
    if (task.assignerId !== req.user.employeeId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the task creator can delete it'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};