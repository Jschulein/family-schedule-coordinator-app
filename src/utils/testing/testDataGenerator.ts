
/**
 * Utilities for generating consistent test data
 * 
 * These utilities help create predictable test data for both automated
 * testing and manual verification of application functionality.
 */

/**
 * Generate a unique timestamp-based identifier
 * Useful for creating unique test values
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Generate a unique email for test accounts
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}.${timestamp}@example.com`;
};

/**
 * Generate a test family name with timestamp
 */
export const generateFamilyName = (prefix: string = 'Test Family'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  return `${prefix} ${timestamp}`;
};

/**
 * Generate test family member data
 */
export const generateTestFamilyMember = (overrides?: Partial<{
  name: string;
  email: string;
  role: 'admin' | 'member';
}>) => {
  return {
    name: overrides?.name || `Test Member ${generateUniqueId()}`,
    email: overrides?.email || generateTestEmail('member'),
    role: overrides?.role || 'member' as const,
  };
};

/**
 * Generate an array of test family members
 */
export const generateTestFamilyMembers = (count: number = 2) => {
  return Array.from({ length: count }, (_, index) => 
    generateTestFamilyMember({
      name: `Test Member ${index + 1}`,
      email: generateTestEmail(`member${index + 1}`),
      role: index === 0 ? 'admin' : 'member'
    })
  );
};

/**
 * Generate a test event with unique identifiers
 */
export const generateTestEvent = (familyId?: string) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  
  return {
    title: `Test Event ${generateUniqueId()}`,
    description: "This is a test event description",
    startDate: now.toISOString(),
    endDate: tomorrow.toISOString(),
    allDay: false,
    familyId: familyId || 'test-family-id',
    createdBy: 'test-user-id'
  };
};
