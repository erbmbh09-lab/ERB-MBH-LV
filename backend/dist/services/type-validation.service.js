"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeValidationService = void 0;
const zod_1 = require("zod");
const legal_definitions_1 = require("../interfaces/legal-definitions");
const logger_1 = require("../utils/logger");
// Base validation schema for all legal entities
const contactInfoSchema = zod_1.z.object({
    primaryPhone: zod_1.z.string()
        .regex(/^\+?[0-9]{10,15}$/, 'رقم الهاتف غير صالح'),
    secondaryPhone: zod_1.z.string()
        .regex(/^\+?[0-9]{10,15}$/, 'رقم الهاتف غير صالح')
        .optional(),
    email: zod_1.z.string()
        .email('البريد الإلكتروني غير صالح')
        .optional(),
    fax: zod_1.z.string()
        .optional(),
    website: zod_1.z.string()
        .url('رابط الموقع غير صالح')
        .optional(),
    preferredContact: zod_1.z.enum(['phone', 'email', 'fax'])
});
const addressInfoSchema = zod_1.z.object({
    country: zod_1.z.string()
        .min(2, 'اسم الدولة يجب أن يكون حرفين على الأقل'),
    city: zod_1.z.string()
        .min(2, 'اسم المدينة يجب أن يكون حرفين على الأقل'),
    district: zod_1.z.string().optional(),
    street: zod_1.z.string().optional(),
    buildingNo: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    additionalInfo: zod_1.z.string().optional()
});
const baseLegalEntitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.nativeEnum(legal_definitions_1.EntityType),
    personType: zod_1.z.nativeEnum(legal_definitions_1.LegalPersonType),
    nameAr: zod_1.z.string()
        .min(3, 'الاسم بالعربية يجب أن يكون 3 أحرف على الأقل'),
    nameEn: zod_1.z.string()
        .min(3, 'الاسم بالإنجليزية يجب أن يكون 3 أحرف على الأقل')
        .optional(),
    identifier: zod_1.z.string(),
    identifierType: zod_1.z.string(),
    status: zod_1.z.nativeEnum(legal_definitions_1.EntityStatus),
    classification: zod_1.z.nativeEnum(legal_definitions_1.ClientClassification),
    nationality: zod_1.z.string(),
    contact: contactInfoSchema,
    address: addressInfoSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string()
});
// Client specific validation
const clientSchema = baseLegalEntitySchema.extend({
    type: zod_1.z.literal(legal_definitions_1.EntityType.CLIENT),
    category: zod_1.z.enum(['regular', 'vip', 'strategic']),
    riskLevel: zod_1.z.enum(['low', 'medium', 'high']),
    assignedLawyer: zod_1.z.string(),
    contractDetails: zod_1.z.object({
        contractId: zod_1.z.string(),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string().optional(),
        terms: zod_1.z.array(zod_1.z.string())
    }),
    billingInfo: zod_1.z.object({
        method: zod_1.z.enum(['hourly', 'fixed', 'retainer']),
        currency: zod_1.z.string(),
        rate: zod_1.z.number().optional(),
        billingCycle: zod_1.z.enum(['monthly', 'quarterly', 'project'])
    })
});
// Opponent specific validation
const opponentSchema = baseLegalEntitySchema.extend({
    type: zod_1.z.literal(legal_definitions_1.EntityType.OPPONENT),
    opposingCounsel: zod_1.z.object({
        name: zod_1.z.string(),
        firm: zod_1.z.string(),
        contact: contactInfoSchema
    }).optional(),
    risk: zod_1.z.object({
        level: zod_1.z.enum(['low', 'medium', 'high']),
        factors: zod_1.z.array(zod_1.z.string())
    }),
    history: zod_1.z.object({
        previousCases: zod_1.z.array(zod_1.z.string()),
        settlementAttempts: zod_1.z.boolean(),
        notes: zod_1.z.string()
    })
});
// Potential client specific validation
const potentialClientSchema = baseLegalEntitySchema.extend({
    type: zod_1.z.literal(legal_definitions_1.EntityType.POTENTIAL_CLIENT),
    source: zod_1.z.string(),
    probability: zod_1.z.enum(['low', 'medium', 'high']),
    estimatedValue: zod_1.z.number(),
    nextFollowUp: zod_1.z.string(),
    requirements: zod_1.z.array(zod_1.z.string()),
    notes: zod_1.z.string()
});
// Relationship validation
const relationshipSchema = zod_1.z.object({
    id: zod_1.z.string(),
    sourceEntityId: zod_1.z.string(),
    targetEntityId: zod_1.z.string(),
    relationType: zod_1.z.nativeEnum(legal_definitions_1.RelationType),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'expired']),
    documents: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        type: zod_1.z.enum(['power_of_attorney', 'contract', 'court_order', 'other']),
        issueDate: zod_1.z.string(),
        expiryDate: zod_1.z.string().optional(),
        issuer: zod_1.z.string(),
        fileUrl: zod_1.z.string(),
        verified: zod_1.z.boolean()
    })),
    notes: zod_1.z.string().optional()
});
class TypeValidationService {
    /**
     * Validate a legal entity based on its type
     */
    static validateEntity(entity) {
        try {
            switch (entity.type) {
                case legal_definitions_1.EntityType.CLIENT:
                    return clientSchema.parse(entity);
                case legal_definitions_1.EntityType.OPPONENT:
                    return opponentSchema.parse(entity);
                case legal_definitions_1.EntityType.POTENTIAL_CLIENT:
                    return potentialClientSchema.parse(entity);
                default:
                    return baseLegalEntitySchema.parse(entity);
            }
        }
        catch (error) {
            logger_1.logger.error('Entity validation error:', error);
            throw error;
        }
    }
    /**
     * Validate a relationship
     */
    static validateRelationship(relationship) {
        try {
            return relationshipSchema.parse(relationship);
        }
        catch (error) {
            logger_1.logger.error('Relationship validation error:', error);
            throw error;
        }
    }
    /**
     * Validate array of entities
     */
    static validateEntities(entities) {
        return entities.map(entity => this.validateEntity(entity));
    }
    /**
     * Validate array of relationships
     */
    static validateRelationships(relationships) {
        return relationships.map(rel => this.validateRelationship(rel));
    }
}
exports.TypeValidationService = TypeValidationService;
//# sourceMappingURL=type-validation.service.js.map