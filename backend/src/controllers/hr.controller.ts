import { Request, Response } from 'express';
import { Employee } from '../models/employee.model';
import { User } from '../models/user.model';
import { employeeSchema, employeeUpdateSchema } from '../schemas/employee.schema';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const {
      role,
      branch,
      department,
      contractType,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = {};
    if (role) query.role = role;
    if (branch) query.branch = branch;
    if (department) query.department = department;
    if (contractType) query.contractType = contractType;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobilePhone: { $regex: search } }
      ];
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const employees = await Employee.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 });

    const total = await Employee.countDocuments(query);

    // Get user login status for each employee
    const employeeIds = employees.map(emp => emp.id);
    const users = await User.find({ employeeId: { $in: employeeIds } });
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
  } catch (error) {
    logger.error('Error getting employees:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    // Get user login information
    const user = await User.findOne({ employeeId: employee.id });
    const enrichedEmployee = {
      ...employee.toObject(),
      hasLoginAccess: !!user,
      loginEnabled: user?.loginEnabled || false
    };

    res.json({
      status: 'success',
      data: { employee: enrichedEmployee }
    });
  } catch (error) {
    logger.error('Error getting employee:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = employeeSchema.parse(req.body);

    // Check for existing employee with same ID
    const existingEmployee = await Employee.findOne({ id: validatedData.id });
    if (existingEmployee) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee with this ID already exists'
      });
    }

    // Create employee
    const employee = await Employee.create(validatedData);

    // Create user account if requested
    if (req.body.createLoginAccount) {
      await User.create({
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
  } catch (error) {
    logger.error('Error creating employee:', error);
    if (error && (error as any).name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: (error as any).errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = employeeUpdateSchema.parse(req.body);

    // Check if employee exists
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    // Update employee
    const updatedEmployee = await Employee.findOneAndUpdate(
      { id: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    // Update user account if exists
    if (req.body.username || req.body.permissions || req.body.loginEnabled !== undefined) {
      const user = await User.findOne({ employeeId: employee.id });
      if (user) {
        if (req.body.username) user.username = req.body.username;
        if (req.body.permissions) user.permissions = req.body.permissions;
        if (req.body.loginEnabled !== undefined) user.loginEnabled = req.body.loginEnabled;
        await user.save();
      }
    }

    // Get updated user information
    const user = await User.findOne({ employeeId: employee.id });
    const enrichedEmployee = {
      ...updatedEmployee!.toObject(),
      hasLoginAccess: !!user,
      loginEnabled: user?.loginEnabled || false
    };

    res.json({
      status: 'success',
      data: { employee: enrichedEmployee }
    });
  } catch (error) {
    logger.error('Error updating employee:', error);
    if (error && (error as any).name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: (error as any).errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }

    // Delete associated user account if exists
    await User.findOneAndDelete({ employeeId: employee.id });

    // Delete employee
    await Employee.findOneAndDelete({ id: req.params.id });

    res.json({
      status: 'success',
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting employee:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};