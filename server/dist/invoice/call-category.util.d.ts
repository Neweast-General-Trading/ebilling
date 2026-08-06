export type CallCategory = 'mobile' | 'landline' | 'international';
export type CallTypeFilter = 'all' | 'internal' | 'external' | 'internal_mobile' | 'internal_landline' | 'internal_international' | 'external_mobile' | 'external_landline' | 'external_international';
export declare function classifyCalleePhone(phone: string): CallCategory;
export declare function normalizeStoredCategory(category: string): CallCategory;
export declare function normalizedCategorySql(column?: string): string;
export declare function buildCallTypeFilterSql(filter: CallTypeFilter | undefined, alias?: string): string;
