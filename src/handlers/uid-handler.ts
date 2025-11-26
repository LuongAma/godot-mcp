import { existsSync } from 'fs';
import { join } from 'path';
import { ToolResponse } from '../types/index.js';
import { BaseHandler } from './base-handler.js';

/**
 * Handler for UID-related operations
 */
export class UidHandler extends BaseHandler {
  /**
   * Get the UID for a specific file in a Godot project (for Godot 4.4+)
   */
  async handleGetUid(args: any): Promise<ToolResponse> {
    if (!args.projectPath || !args.filePath) {
      return this.errorHandler.createErrorResponse(
        'Missing required parameters',
        ['Provide projectPath and filePath']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectPath(args.filePath);
    this.validateProjectDirectory(args.projectPath);

    // Check if the file exists
    const filePath = join(args.projectPath, args.filePath);
    this.validateFileExists(filePath);

    try {
      // Get Godot version to check if UIDs are supported
      const godotPath = (this.pathDetector as any).getGodotPath();
      if (!godotPath) {
        return this.errorHandler.createErrorResponse(
          'Could not find a valid Godot executable path',
          [
            'Ensure Godot is installed correctly',
            'Set GODOT_PATH environment variable to specify the correct path',
          ]
        );
      }

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout: versionOutput } = await execAsync(`"${godotPath}" --version`);
      const version = versionOutput.trim();

      if (!this.isGodot44OrLater(version)) {
        return this.errorHandler.createErrorResponse(
          `UIDs are only supported in Godot 4.4 or later. Current version: ${version}`,
          [
            'Upgrade to Godot 4.4 or later to use UIDs',
            'Use resource paths instead of UIDs for this version of Godot',
          ]
        );
      }

      // Prepare parameters for the operation
      const params = {
        filePath: args.filePath,
      };

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('get_uid', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to get UID: ${stderr || 'Unknown error'}`,
          [
            'Check if the file is a valid Godot resource',
            'Ensure the file path is correct',
          ]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `UID for ${args.filePath}: ${stdout.trim()}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to get UID: ${error?.message || 'Unknown error'}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Update UID references in a Godot project by resaving resources (for Godot 4.4+)
   */
  async handleUpdateProjectUids(args: any): Promise<ToolResponse> {
    if (!args.projectPath) {
      return this.errorHandler.createErrorResponse(
        'Project path is required',
        ['Provide a valid path to a Godot project directory']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectDirectory(args.projectPath);

    try {
      // Get Godot version to check if UIDs are supported
      const godotPath = (this.pathDetector as any).getGodotPath();
      if (!godotPath) {
        return this.errorHandler.createErrorResponse(
          'Could not find a valid Godot executable path',
          [
            'Ensure Godot is installed correctly',
            'Set GODOT_PATH environment variable to specify the correct path',
          ]
        );
      }

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout: versionOutput } = await execAsync(`"${godotPath}" --version`);
      const version = versionOutput.trim();

      if (!this.isGodot44OrLater(version)) {
        return this.errorHandler.createErrorResponse(
          `UIDs are only supported in Godot 4.4 or later. Current version: ${version}`,
          [
            'Upgrade to Godot 4.4 or later to use UIDs',
            'Use resource paths instead of UIDs for this version of Godot',
          ]
        );
      }

      // Prepare parameters for the operation
      const params = {
        projectPath: args.projectPath,
      };

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('resave_resources', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to update project UIDs: ${stderr || 'Unknown error'}`,
          [
            'Check if the project is valid',
            'Ensure you have write permissions to the project directory',
          ]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Project UIDs updated successfully.\n\nOutput: ${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to update project UIDs: ${error?.message || 'Unknown error'}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Check if the Godot version is 4.4 or later
   */
  private isGodot44OrLater(version: string): boolean {
    const match = version.match(/^(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      return major > 4 || (major === 4 && minor >= 4);
    }
    return false;
  }

  /**
   * Handle method for base class compatibility
   */
  async handle(args: any): Promise<ToolResponse> {
    throw new Error('UidHandler.handle() must be called with specific method');
  }
}
