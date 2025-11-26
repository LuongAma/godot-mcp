/**
 * Windows compatibility utilities
 */
export class WindowsCompat {
  /**
   * Escape Windows paths that contain spaces
   */
  static escapeWindowsPath(path: string): string {
    // Handle paths with spaces
    if (path.includes(' ') && !path.startsWith('"')) {
      return `"${path}"`;
    }
    return path;
  }

  /**
   * Build command for cross-platform execution
   */
  static buildCommand(executable: string, args: string[]): string | null {
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // Use spawn với args array thay vì exec với string concatenation
      return null; // Signal to use spawn instead
    }
    // For non-Windows, can still use string
    return [executable, ...args].join(' ');
  }

  /**
   * Check if running on Windows
   */
  static isWindows(): boolean {
    return process.platform === 'win32';
  }
}
