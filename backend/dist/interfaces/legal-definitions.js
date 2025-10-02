"use strict";
/**
 * Core entity types and relationships for the legal system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPotentialClient = exports.isOpponent = exports.isClient = exports.LegalPersonType = exports.EntityStatus = exports.ClientClassification = exports.RelationType = exports.EntityType = void 0;
// Entity Types
var EntityType;
(function (EntityType) {
    EntityType["CLIENT"] = "client";
    EntityType["POTENTIAL_CLIENT"] = "potential";
    EntityType["OPPONENT"] = "opponent";
    EntityType["WITNESS"] = "witness";
    EntityType["EXPERT"] = "expert";
    EntityType["RELATED_PARTY"] = "related";
    EntityType["COURT"] = "court";
    EntityType["AUTHORITY"] = "authority";
    EntityType["OTHER"] = "other"; // أخرى
})(EntityType || (exports.EntityType = EntityType = {}));
// Relationship Types
var RelationType;
(function (RelationType) {
    RelationType["REPRESENTATIVE"] = "representative";
    RelationType["ATTORNEY"] = "attorney";
    RelationType["GUARDIAN"] = "guardian";
    RelationType["HEIR"] = "heir";
    RelationType["PARTNER"] = "partner";
    RelationType["SUBSIDIARY"] = "subsidiary";
    RelationType["PARENT"] = "parent";
    RelationType["AFFILIATE"] = "affiliate";
    RelationType["OTHER"] = "other"; // أخرى
})(RelationType || (exports.RelationType = RelationType = {}));
// Client Classifications
var ClientClassification;
(function (ClientClassification) {
    ClientClassification["INDIVIDUAL"] = "individual";
    ClientClassification["COMPANY"] = "company";
    ClientClassification["GOVERNMENT"] = "government";
    ClientClassification["NON_PROFIT"] = "non_profit";
    ClientClassification["OTHER"] = "other"; // أخرى
})(ClientClassification || (exports.ClientClassification = ClientClassification = {}));
// Entity Status
var EntityStatus;
(function (EntityStatus) {
    EntityStatus["ACTIVE"] = "active";
    EntityStatus["INACTIVE"] = "inactive";
    EntityStatus["PENDING"] = "pending";
    EntityStatus["BLOCKED"] = "blocked";
    EntityStatus["ARCHIVED"] = "archived"; // مؤرشف
})(EntityStatus || (exports.EntityStatus = EntityStatus = {}));
// Legal Person Types
var LegalPersonType;
(function (LegalPersonType) {
    LegalPersonType["NATURAL"] = "natural";
    LegalPersonType["JURIDICAL"] = "juridical"; // شخص اعتباري
})(LegalPersonType || (exports.LegalPersonType = LegalPersonType = {}));
// Type guards for entity types
const isClient = (entity) => {
    return entity.type === EntityType.CLIENT;
};
exports.isClient = isClient;
const isOpponent = (entity) => {
    return entity.type === EntityType.OPPONENT;
};
exports.isOpponent = isOpponent;
const isPotentialClient = (entity) => {
    return entity.type === EntityType.POTENTIAL_CLIENT;
};
exports.isPotentialClient = isPotentialClient;
//# sourceMappingURL=legal-definitions.js.map