import keytar from 'keytar';

const SERVICE_NAME = 'AnswerMotion';

// Key names for storing credentials
export const KEY_NAMES = {
  ANTHROPIC_API_KEY: 'anthropic-api-key',
  GEMINI_API_KEY: 'gemini-api-key',
} as const;

export type KeyName = (typeof KEY_NAMES)[keyof typeof KEY_NAMES];

/**
 * Get a stored credential from the system keychain
 */
export async function getCredential(keyName: string): Promise<string | null> {
  try {
    const password = await keytar.getPassword(SERVICE_NAME, keyName);
    return password;
  } catch (error) {
    console.error(`Failed to get credential ${keyName}:`, error);
    return null;
  }
}

/**
 * Store a credential in the system keychain
 */
export async function setCredential(keyName: string, value: string): Promise<boolean> {
  try {
    await keytar.setPassword(SERVICE_NAME, keyName, value);
    return true;
  } catch (error) {
    console.error(`Failed to set credential ${keyName}:`, error);
    return false;
  }
}

/**
 * Delete a credential from the system keychain
 */
export async function deleteCredential(keyName: string): Promise<boolean> {
  try {
    const deleted = await keytar.deletePassword(SERVICE_NAME, keyName);
    return deleted;
  } catch (error) {
    console.error(`Failed to delete credential ${keyName}:`, error);
    return false;
  }
}

/**
 * Get all stored credentials (returns key names only, not values)
 */
export async function listCredentials(): Promise<string[]> {
  try {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    return credentials.map((cred) => cred.account);
  } catch (error) {
    console.error('Failed to list credentials:', error);
    return [];
  }
}
