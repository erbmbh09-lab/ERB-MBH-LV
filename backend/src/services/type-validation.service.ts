import { z } from 'zod';
import {
  EntityType,
  RelationType,
  ClientClassification,
  EntityStatus,
  LegalPersonType,
  LegalEntity,
  Client,
  Opponent,
  PotentialClient
} from '../interfaces/legal-definitions';
import { logger } from '../utils/logger';

// Base validation schema for all legal entities
const contactInfoSchema = z.object({
  primaryPhone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'رقم الهاتف غير صالح'),
  secondaryPhone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'رقم الهاتف غير صالح')
    .optional(),
  email: z.string()
    .email('البريد الإلكتروني غير صالح')
    .optional(),
  fax: z.string()
    .optional(),
  website: z.string()
    .url('رابط الموقع غير صالح')
    .optional(),
  preferredContact: z.enum(['phone', 'email', 'fax'])
});

const addressInfoSchema = z.object({
  country: z.string()
    .min(2, 'اسم الدولة يجب أن يكون حرفين على الأقل'),
  city: z.string()
    .min(2, 'اسم المدينة يجب أن يكون حرفين على الأقل'),
  district: z.string().optional(),
  street: z.string().optional(),
  buildingNo: z.string().optional(),
  postalCode: z.string().optional(),
  additionalInfo: z.string().optional()
});

const baseLegalEntitySchema = z.object({
  id: z.string(),
  type: z.nativeEnum(EntityType),
  personType: z.nativeEnum(LegalPersonType),
  nameAr: z.string()
    .min(3, 'الاسم بالعربية يجب أن يكون 3 أحرف على الأقل'),
  nameEn: z.string()
    .min(3, 'الاسم بالإنجليزية يجب أن يكون 3 أحرف على الأقل')
    .optional(),
  identifier: z.string(),
  identifierType: z.string(),
  status: z.nativeEnum(EntityStatus),
  classification: z.nativeEnum(ClientClassification),
  nationality: z.string(),
  contact: contactInfoSchema,
  address: addressInfoSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

// Client specific validation
const clientSchema = baseLegalEntitySchema.extend({
  type: z.literal(EntityType.CLIENT),
  category: z.enum(['regular', 'vip', 'strategic']),
  riskLevel: z.enum(['low', 'medium', 'high']),
  assignedLawyer: z.string(),
  contractDetails: z.object({
    contractId: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    terms: z.array(z.string())
  }),
  billingInfo: z.object({
    method: z.enum(['hourly', 'fixed', 'retainer']),
    currency: z.string(),
    rate: z.number().optional(),
    billingCycle: z.enum(['monthly', 'quarterly', 'project'])
  })
});

// Opponent specific validation
const opponentSchema = baseLegalEntitySchema.extend({
  type: z.literal(EntityType.OPPONENT),
  opposingCounsel: z.object({
    name: z.string(),
    firm: z.string(),
    contact: contactInfoSchema
  }).optional(),
  risk: z.object({
    level: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string())
  }),
  history: z.object({
    previousCases: z.array(z.string()),
    settlementAttempts: z.boolean(),
    notes: z.string()
  })
});

// Potential client specific validation
const potentialClientSchema = baseLegalEntitySchema.extend({
  type: z.literal(EntityType.POTENTIAL_CLIENT),
  source: z.string(),
  probability: z.enum(['low', 'medium', 'high']),
  estimatedValue: z.number(),
  nextFollowUp: z.string(),
  requirements: z.array(z.string()),
  notes: z.string()
});

// Relationship validation
const relationshipSchema = z.object({
  id: z.string(),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  relationType: z.nativeEnum(RelationType),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'expired']),
  documents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['power_of_attorney', 'contract', 'court_order', 'other']),
    issueDate: z.string(),
    expiryDate: z.string().optional(),
    issuer: z.string(),
    fileUrl: z.string(),
    verified: z.boolean()
  })),
  notes: z.string().optional()
});

export class TypeValidationService {
  /**
   * Validate a legal entity based on its type
   */
  static validateEntity(entity: any): LegalEntity {
    try {
      switch (entity.type) {
        case EntityType.CLIENT:
          return clientSchema.parse(entity) as Client;
        case EntityType.OPPONENT:
          return opponentSchema.parse(entity) as Opponent;
        case EntityType.POTENTIAL_CLIENT:
          return potentialClientSchema.parse(entity) as PotentialClient;
        default:
          return baseLegalEntitySchema.parse(entity);
      }
    } catch (error) {
      logger.error('Entity validation error:', error);
      throw error;
    }
  }

  /**
   * Validate a relationship
   */
  static validateRelationship(relationship: any) {
    try {
      return relationshipSchema.parse(relationship);
    } catch (error) {
      logger.error('Relationship validation error:', error);
      throw error;
    }
  }

  /**
   * Validate array of entities
   */
  static validateEntities(entities: any[]): LegalEntity[] {
    return entities.map(entity => this.validateEntity(entity));
  }

  /**
   * Validate array of relationships
   */
  static validateRelationships(relationships: any[]) {
    return relationships.map(rel => this.validateRelationship(rel));
  }
}