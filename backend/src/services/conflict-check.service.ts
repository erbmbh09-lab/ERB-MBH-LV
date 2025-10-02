import { 
  LegalEntity, 
  EntityType, 
  RelationType,
  EntityRelationship,
  ConflictCheckResult,
  Client,
  Opponent,
  PotentialClient
} from '../interfaces/legal-definitions';
import { SystemLogger } from './system-logger.service';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ConflictCheckService {
  /**
   * Check for potential conflicts with a new entity
   */
  static async checkConflicts(
    newEntity: LegalEntity,
    relatedEntities: string[] = []
  ): Promise<ConflictCheckResult> {
    try {
      const conflicts: ConflictCheckResult['details'] = [];
      
      // Direct conflicts (same entity in different roles)
      const directConflicts = await this.checkDirectConflicts(newEntity);
      conflicts.push(...directConflicts);

      // Indirect conflicts (through relationships)
      const indirectConflicts = await this.checkIndirectConflicts(newEntity, relatedEntities);
      conflicts.push(...indirectConflicts);

      // Generate recommendations
      const recommendations = this.generateRecommendations(conflicts);

      const result: ConflictCheckResult = {
        hasConflict: conflicts.length > 0,
        type: this.determineConflictType(conflicts),
        details: conflicts,
        recommendations
      };

      // Log conflict check
      await SystemLogger.logActivity({
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
    } catch (error) {
      logger.error('Error checking conflicts:', error);
      throw error;
    }
  }

  /**
   * Check for direct conflicts (same entity as different types)
   */
  private static async checkDirectConflicts(
    entity: LegalEntity
  ): Promise<ConflictCheckResult['details']> {
    const conflicts: ConflictCheckResult['details'] = [];

    // Check identifier matches in other roles
    const matchingEntities = await this.findEntitiesByIdentifier(
      entity.identifier,
      entity.identifierType
    );

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
  private static async checkIndirectConflicts(
    entity: LegalEntity,
    relatedEntities: string[]
  ): Promise<ConflictCheckResult['details']> {
    const conflicts: ConflictCheckResult['details'] = [];
    const relationships = await this.getEntityRelationships([
      entity.id,
      ...relatedEntities
    ]);

    for (const relationship of relationships) {
      const relatedEntity = await this.getEntity(
        entity.id === relationship.sourceEntityId
          ? relationship.targetEntityId
          : relationship.sourceEntityId
      );

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
  private static calculateRiskLevel(
    entity1: LegalEntity,
    entity2: LegalEntity
  ): 'low' | 'medium' | 'high' {
    // Direct opponent relationship is high risk
    if (
      (entity1.type === EntityType.CLIENT && entity2.type === EntityType.OPPONENT) ||
      (entity1.type === EntityType.OPPONENT && entity2.type === EntityType.CLIENT)
    ) {
      return 'high';
    }

    // Related parties with active cases is medium risk
    if (entity1.type === EntityType.RELATED_PARTY || entity2.type === EntityType.RELATED_PARTY) {
      return 'medium';
    }

    // Other relationships are low risk
    return 'low';
  }

  /**
   * Generate conflict description
   */
  private static generateConflictDescription(
    entity1: LegalEntity,
    entity2: LegalEntity,
    relationship: EntityRelationship
  ): string {
    const type1 = this.translateEntityType(entity1.type);
    const type2 = this.translateEntityType(entity2.type);
    const relType = this.translateRelationType(relationship.relationType);

    return `${type1} له علاقة "${relType}" مع ${type2}`;
  }

  /**
   * Generate recommendations based on conflicts
   */
  private static generateRecommendations(
    conflicts: ConflictCheckResult['details']
  ): string[] {
    const recommendations: string[] = [];

    const highRiskCount = conflicts.filter(c => c.riskLevel === 'high').length;
    const mediumRiskCount = conflicts.filter(c => c.riskLevel === 'medium').length;

    if (highRiskCount > 0) {
      recommendations.push(
        'يجب الحصول على موافقة لجنة الحوكمة قبل المتابعة'
      );
    }

    if (mediumRiskCount > 0) {
      recommendations.push(
        'يجب توثيق الإجراءات المتخذة لتجنب تضارب المصالح'
      );
    }

    if (conflicts.length > 0) {
      recommendations.push(
        'يجب إخطار جميع الأطراف المعنية بالتضارب المحتمل'
      );
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private static determineConflictType(
    conflicts: ConflictCheckResult['details']
  ): 'direct' | 'indirect' | 'potential' | 'none' {
    if (conflicts.length === 0) return 'none';
    if (conflicts.some(c => c.riskLevel === 'high')) return 'direct';
    if (conflicts.some(c => c.riskLevel === 'medium')) return 'indirect';
    return 'potential';
  }

  private static translateEntityType(type: EntityType): string {
    const translations: Record<EntityType, string> = {
      [EntityType.CLIENT]: 'عميل',
      [EntityType.POTENTIAL_CLIENT]: 'عميل محتمل',
      [EntityType.OPPONENT]: 'خصم',
      [EntityType.WITNESS]: 'شاهد',
      [EntityType.EXPERT]: 'خبير',
      [EntityType.RELATED_PARTY]: 'طرف ذو علاقة',
      [EntityType.COURT]: 'محكمة',
      [EntityType.AUTHORITY]: 'جهة رسمية',
      [EntityType.OTHER]: 'أخرى'
    };
    return translations[type];
  }

  private static translateRelationType(type: RelationType): string {
    const translations: Record<RelationType, string> = {
      [RelationType.REPRESENTATIVE]: 'ممثل',
      [RelationType.ATTORNEY]: 'وكيل',
      [RelationType.GUARDIAN]: 'وصي',
      [RelationType.HEIR]: 'وريث',
      [RelationType.PARTNER]: 'شريك',
      [RelationType.SUBSIDIARY]: 'شركة تابعة',
      [RelationType.PARENT]: 'شركة أم',
      [RelationType.AFFILIATE]: 'شركة شقيقة',
      [RelationType.OTHER]: 'أخرى'
    };
    return translations[type];
  }

  // Database interaction methods (to be implemented)
  private static async findEntitiesByIdentifier(
    identifier: string,
    identifierType: string
  ): Promise<LegalEntity[]> {
    // Implement database query
    return [];
  }

  private static async getEntityRelationships(
    entityIds: string[]
  ): Promise<EntityRelationship[]> {
    // Implement database query
    return [];
  }

  private static async getEntity(id: string): Promise<LegalEntity> {
    // Implement database query
    throw new APIError('Not implemented', 500);
  }

  private static isConflicting(
    entity1: LegalEntity,
    entity2: LegalEntity
  ): boolean {
    // Implement conflict logic
    return false;
  }
}