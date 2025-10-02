import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model';
import { logger } from '../utils/logger';

interface LoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

export const login = async (req: LoginRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = user.generateToken();

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          userType: user.userType,
          employeeId: user.employeeId,
          clientId: user.clientId
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  // In a token-based auth system, the frontend just needs to remove the token
  res.json({
    status: 'success',
    message: 'Successfully logged out'
  });
};

export const getProfile = async (req: Request & { user?: IUser }, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          userType: user.userType,
          employeeId: user.employeeId,
          clientId: user.clientId
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

interface ChangePasswordRequest extends Request {
  body: {
    currentPassword: string;
    newPassword: string;
  };
  user?: IUser;
}

export const changePassword = async (req: ChangePasswordRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};