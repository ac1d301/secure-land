import crypto from 'crypto';

/**
 * Generate SHA-256 hash for document content
 * @param content - File buffer or string content
 * @returns SHA-256 hash as hex string
 */
export const generateHash = (content: Buffer | string): string => {
  const hash = crypto.createHash('sha256');
  
  if (Buffer.isBuffer(content)) {
    hash.update(content);
  } else {
    hash.update(content, 'utf8');
  }
  
  return hash.digest('hex');
};

/**
 * Verify if content matches the provided hash
 * @param content - File buffer or string content
 * @param hash - Expected hash
 * @returns True if content matches hash
 */
export const verifyHash = (content: Buffer | string, hash: string): boolean => {
  const computedHash = generateHash(content);
  return computedHash === hash;
};

/**
 * Generate a unique property ID
 * @param propertyAddress - Property address
 * @param ownerId - Owner user ID
 * @returns Unique property identifier
 */
export const generatePropertyId = (propertyAddress: string, ownerId: string): string => {
  const combined = `${propertyAddress}-${ownerId}-${Date.now()}`;
  return generateHash(combined).substring(0, 16);
};

/**
 * Generate a unique document ID
 * @param propertyId - Property ID
 * @param fileName - File name
 * @returns Unique document identifier
 */
export const generateDocumentId = (propertyId: string, fileName: string): string => {
  const combined = `${propertyId}-${fileName}-${Date.now()}`;
  return generateHash(combined).substring(0, 16);
};

export default {
  generateHash,
  verifyHash,
  generatePropertyId,
  generateDocumentId
};
