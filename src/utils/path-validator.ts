/**
 * Path validation utilities
 */
export class PathValidator {
  /**
   * Validate a path to prevent path traversal attacks
   */
  validatePath(path: string): boolean {
    // Basic validation to prevent path traversal
    if (!path || path.includes('..')) {
      return false;
    }

    // Add more validation as needed
    return true;
  }
}
