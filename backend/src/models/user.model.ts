import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  employeeId?: number;
  clientId?: number;
  username: string;
  password: string;
  userType: 'Employee' | 'Client';
  permissions: string[];
  comparePassword: (password: string) => Promise<boolean>;
  generateToken: () => string;
}

const userSchema = new Schema({
  employeeId: { type: Number },
  clientId: { type: Number },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, required: true, enum: ['Employee', 'Client'] },
  permissions: [{ type: String }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function(): string {
  return jwt.sign(
    { 
      id: this._id,
      userType: this.userType,
      employeeId: this.employeeId,
      clientId: this.clientId
    },
    process.env.JWT_SECRET || 'your-secret-key-here',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const User = model<IUser>('User', userSchema);