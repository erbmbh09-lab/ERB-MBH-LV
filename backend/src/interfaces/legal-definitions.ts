/**
 * Core entity types and relationships for the legal system
 */

// Entity Types
export enum EntityType {
  CLIENT = 'client',                  // عميل
  POTENTIAL_CLIENT = 'potential',     // عميل محتمل
  OPPONENT = 'opponent',              // خصم
  WITNESS = 'witness',                // شاهد
  EXPERT = 'expert',                  // خبير
  RELATED_PARTY = 'related',          // طرف ذو علاقة
  COURT = 'court',                    // محكمة
  AUTHORITY = 'authority',            // جهة رسمية
  OTHER = 'other'                     // أخرى
}

// Relationship Types
export enum RelationType {
  REPRESENTATIVE = 'representative',   // ممثل
  ATTORNEY = 'attorney',              // وكيل
  GUARDIAN = 'guardian',              // وصي
  HEIR = 'heir',                      // وريث
  PARTNER = 'partner',                // شريك
  SUBSIDIARY = 'subsidiary',          // شركة تابعة
  PARENT = 'parent',                  // شركة أم
  AFFILIATE = 'affiliate',            // شركة شقيقة
  OTHER = 'other'                     // أخرى
}

// Client Classifications
export enum ClientClassification {
  INDIVIDUAL = 'individual',          // فرد
  COMPANY = 'company',                // شركة
  GOVERNMENT = 'government',          // حكومي
  NON_PROFIT = 'non_profit',         // غير ربحي
  OTHER = 'other'                     // أخرى
}

// Entity Status
export enum EntityStatus {
  ACTIVE = 'active',                  // نشط
  INACTIVE = 'inactive',              // غير نشط
  PENDING = 'pending',                // معلق
  BLOCKED = 'blocked',                // محظور
  ARCHIVED = 'archived'               // مؤرشف
}

// Legal Person Types
export enum LegalPersonType {
  NATURAL = 'natural',                // شخص طبيعي
  JURIDICAL = 'juridical'             // شخص اعتباري
}

// Base interface for all legal entities
export interface LegalEntity {
  id: string;
  type: EntityType;
  personType: LegalPersonType;
  nameAr: string;                     // الاسم بالعربية
  nameEn?: string;                    // الاسم بالإنجليزية
  identifier: string;                 // رقم الهوية/السجل
  identifierType: string;             // نوع الهوية/السجل
  status: EntityStatus;
  classification: ClientClassification;
  nationality: string;
  contact: ContactInfo;
  address: AddressInfo;
  createdAt: string;
  updatedAt: string;
}

// Contact information
export interface ContactInfo {
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  fax?: string;
  website?: string;
  preferredContact: 'phone' | 'email' | 'fax';
}

// Address information
export interface AddressInfo {
  country: string;
  city: string;
  district?: string;
  street?: string;
  buildingNo?: string;
  postalCode?: string;
  additionalInfo?: string;
}

// Relationship between entities
export interface EntityRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationType;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'expired';
  documents: RelationshipDocument[];
  notes?: string;
}

// Documents proving relationship
export interface RelationshipDocument {
  id: string;
  title: string;
  type: 'power_of_attorney' | 'contract' | 'court_order' | 'other';
  issueDate: string;
  expiryDate?: string;
  issuer: string;
  fileUrl: string;
  verified: boolean;
}

// Client specific interface
export interface Client extends LegalEntity {
  type: EntityType.CLIENT;
  category: 'regular' | 'vip' | 'strategic';
  riskLevel: 'low' | 'medium' | 'high';
  assignedLawyer: string;
  contractDetails: {
    contractId: string;
    startDate: string;
    endDate?: string;
    terms: string[];
  };
  billingInfo: {
    method: 'hourly' | 'fixed' | 'retainer';
    currency: string;
    rate?: number;
    billingCycle: 'monthly' | 'quarterly' | 'project';
  };
}

// Opponent specific interface
export interface Opponent extends LegalEntity {
  type: EntityType.OPPONENT;
  opposingCounsel?: {
    name: string;
    firm: string;
    contact: ContactInfo;
  };
  risk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  history: {
    previousCases: string[];
    settlementAttempts: boolean;
    notes: string;
  };
}

// Potential client specific interface
export interface PotentialClient extends LegalEntity {
  type: EntityType.POTENTIAL_CLIENT;
  source: string;
  probability: 'low' | 'medium' | 'high';
  estimatedValue: number;
  nextFollowUp: string;
  requirements: string[];
  notes: string;
}

// Type guards for entity types
export const isClient = (entity: LegalEntity): entity is Client => {
  return entity.type === EntityType.CLIENT;
};

export const isOpponent = (entity: LegalEntity): entity is Opponent => {
  return entity.type === EntityType.OPPONENT;
};

export const isPotentialClient = (entity: LegalEntity): entity is PotentialClient => {
  return entity.type === EntityType.POTENTIAL_CLIENT;
};

// Conflict check types
export interface ConflictCheckResult {
  hasConflict: boolean;
  type: 'direct' | 'indirect' | 'potential' | 'none';
  details: {
    entityId: string;
    entityName: string;
    relationshipPath: string[];
    riskLevel: 'low' | 'medium' | 'high';
    description: string;
  }[];
  recommendations: string[];
}