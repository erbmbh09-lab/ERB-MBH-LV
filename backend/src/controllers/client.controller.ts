import { Request, Response } from 'express';
import { Client } from '../models/client.model';
import { clientSchema, clientUpdateSchema } from '../schemas/client.schema';
import { logger } from '../utils/logger';

export const getClients = async (req: Request, res: Response) => {
  try {
    const { classification, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query: any = {};
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
    const clients = await Client.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Client.countDocuments(query);

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
  } catch (error) {
    logger.error('Error getting clients:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await Client.findOne({ id: req.params.id });
    
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
  } catch (error) {
    logger.error('Error getting client:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = clientSchema.parse(req.body);
    
    // Check for existing client with same ID or username
    const existingClient = await Client.findOne({
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
    const client = await Client.create(validatedData);

    res.status(201).json({
      status: 'success',
      data: { client }
    });
  } catch (error) {
    logger.error('Error creating client:', error);
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

export const updateClient = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = clientUpdateSchema.parse(req.body);
    
    // Check if client exists
    const client = await Client.findOne({ id: req.params.id });
    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found'
      });
    }

    // If username is being updated, check for uniqueness
    if (validatedData.username && validatedData.username !== client.username) {
      const existingClient = await Client.findOne({ username: validatedData.username });
      if (existingClient) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already taken'
        });
      }
    }

    // Update client
    const updatedClient = await Client.findOneAndUpdate(
      { id: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    res.json({
      status: 'success',
      data: { client: updatedClient }
    });
  } catch (error) {
    logger.error('Error updating client:', error);
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

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findOneAndDelete({ id: req.params.id });
    
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
  } catch (error) {
    logger.error('Error deleting client:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};