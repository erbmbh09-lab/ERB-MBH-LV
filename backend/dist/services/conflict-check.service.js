"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictCheckService = void 0;
const legal_definitions_1 = require("../interfaces/legal-definitions");
const system_logger_service_1 = require("./system-logger.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class ConflictCheckService {
    /**
     * Check for potential conflicts with a new entity
     */
    static async checkConflicts(newEntity, relatedEntities = []) {
        try {
            const conflicts = [];
            // Direct conflicts (same entity in different roles)
            const directConflicts = await this.checkDirectConflicts(newEntity);
            conflicts.push(...directConflicts);
            // Indirect conflicts (through relationships)
            const indirectConflicts = await this.checkIndirectConflicts(newEntity, relatedEntities);
            conflicts.push(...indirectConflicts);
            // Generate recommendations
            const recommendations = this.generateRecommendations(conflicts);
            const result = {
                hasConflict: conflicts.length > 0,
                type: this.determineConflictType(conflicts),
                details: conflicts,
                recommendations
            };
            // Log conflict check
            await system_logger_service_1.SystemLogger.logActivity({
                userId: 0, // System
                userType: 'Employee',
                action: 'conflict-check',
                module: 'legal',
                details: {
                    entityId: newEntity.id,
                    entityType: newEntity.type,
                    result
                }
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error checking conflicts:', error);
            throw error;
        }
    }
    /**
     * Check for direct conflicts (same entity as different types)
     */
    static async checkDirectConflicts(entity) {
        const conflicts = [];
        // Check identifier matches in other roles
        const matchingEntities = await this.findEntitiesByIdentifier(entity.identifier, entity.identifierType);
        for (const match of matchingEntities) {
            if (match.id !== entity.id) {
                conflicts.push({
                    entityId: match.id,
                    entityName: match.nameAr,
                    relationshipPath: [entity.id, match.id],
                    riskLevel: this.calculateRiskLevel(entity, match),
                    description: `نفس الكيان موجود كـ ${this.translateEntityType(match.type)}`
                });
            }
        }
        return conflicts;
    }
    /**
     * Check for indirect conflicts through relationships
     */
    static async checkIndirectConflicts(entity, relatedEntities) {
        const conflicts = [];
        const relationships = await this.getEntityRelationships([
            entity.id,
            ...relatedEntities
        ]);
        for (const relationship of relationships) {
            const relatedEntity = await this.getEntity(entity.id === relationship.sourceEntityId
                ? relationship.targetEntityId
                : relationship.sourceEntityId);
            if (this.isConflicting(entity, relatedEntity)) {
                conflicts.push({
                    entityId: relatedEntity.id,
                    entityName: relatedEntity.nameAr,
                    relationshipPath: [entity.id, relatedEntity.id],
                    riskLevel: this.calculateRiskLevel(entity, relatedEntity),
                    description: this.generateConflictDescription(entity, relatedEntity, relationship)
                });
            }
        }
        return conflicts;
    }
    /**
     * Calculate risk level between two entities
     */
    static calculateRiskLevel(entity1, entity2) {
        // Direct opponent relationship is high risk
        if ((entity1.type === legal_definitions_1.EntityType.CLIENT && entity2.type === legal_definitions_1.EntityType.OPPONENT) ||
            (entity1.type === legal_definitions_1.EntityType.OPPONENT && entity2.type === legal_definitions_1.EntityType.CLIENT)) {
            return 'high';
        }
        // Related parties with active cases is medium risk
        if (entity1.type === legal_definitions_1.EntityType.RELATED_PARTY || entity2.type === legal_definitions_1.EntityType.RELATED_PARTY) {
            return 'medium';
        }
        // Other relationships are low risk
        return 'low';
    }
    /**
     * Generate conflict description
     */
    static generateConflictDescription(entity1, entity2, relationship) {
        const type1 = this.translateEntityType(entity1.type);
        const type2 = this.translateEntityType(entity2.type);
        const relType = this.translateRelationType(relationship.relationType);
        return `${type1} له علاقة "${relType}" مع ${type2}`;
    }
    /**
     * Generate recommendations based on conflicts
     */
    static generateRecommendations(conflicts) {
        const recommendations = [];
        const highRiskCount = conflicts.filter(c => c.riskLevel === 'high').length;
        const mediumRiskCount = conflicts.filter(c => c.riskLevel === 'medium').length;
        if (highRiskCount > 0) {
            recommendations.push('يجب الحصول على موافقة لجنة الحوكمة قبل المتابعة');
        }
        if (mediumRiskCount > 0) {
            recommendations.push('يجب توثيق الإجراءات المتخذة لتجنب تضارب المصالح');
        }
        if (conflicts.length > 0) {
            recommendations.push('يجب إخطار جميع الأطراف المعنية بالتضارب المحتمل');
        }
        return recommendations;
    }
    /**
     * Helper methods
     */
    static determineConflictType(conflicts) {
        if (conflicts.length === 0)
            return 'none';
        if (conflicts.some(c => c.riskLevel === 'high'))
            return 'direct';
        if (conflicts.some(c => c.riskLevel === 'medium'))
            return 'indirect';
        return 'potential';
    }
    static translateEntityType(type) {
        const translations = {
            [legal_definitions_1.EntityType.CLIENT]: 'عميل',
            [legal_definitions_1.EntityType.POTENTIAL_CLIENT]: 'عميل محتمل',
            [legal_definitions_1.EntityType.OPPONENT]: 'خصم',
            [legal_definitions_1.EntityType.WITNESS]: 'شاهد',
            [legal_definitions_1.EntityType.EXPERT]: 'خبير',
            [legal_definitions_1.EntityType.RELATED_PARTY]: 'طرف ذو علاقة',
            [legal_definitions_1.EntityType.COURT]: 'محكمة',
            [legal_definitions_1.EntityType.AUTHORITY]: 'جهة رسمية',
            [legal_definitions_1.EntityType.OTHER]: 'أخرى'
        };
        return translations[type];
    }
    static translateRelationType(type) {
        const translations = {
            [legal_definitions_1.RelationType.REPRESENTATIVE]: 'ممثل',
            [legal_definitions_1.RelationType.ATTORNEY]: 'وكيل',
            [legal_definitions_1.RelationType.GUARDIAN]: 'وصي',
            [legal_definitions_1.RelationType.HEIR]: 'وريث',
            [legal_definitions_1.RelationType.PARTNER]: 'شريك',
            [legal_definitions_1.RelationType.SUBSIDIARY]: 'شركة تابعة',
            [legal_definitions_1.RelationType.PARENT]: 'شركة أم',
            [legal_definitions_1.RelationType.AFFILIATE]: 'شركة شقيقة',
            [legal_definitions_1.RelationType.OTHER]: 'أخرى'
        };
        return translations[type];
    }
    // Database interaction methods (to be implemented)
    static async findEntitiesByIdentifier(identifier, identifierType) {
        // Implement database query
        return [];
    }
    static async getEntityRelationships(entityIds) {
        // Implement database query
        return [];
    }
    static async getEntity(id) {
        // Implement database query
        throw new errorHandler_1.APIError('Not implemented', 500);
    }
    static isConflicting(entity1, entity2) {
        // Implement conflict logic
        return false;
    }
}
exports.ConflictCheckService = ConflictCheckService;
//# sourceMappingURL=conflict-check.service.js.map