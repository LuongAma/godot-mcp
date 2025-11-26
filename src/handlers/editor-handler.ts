import { spawn } from 'child_process';
import { ToolResponse } from '../types/index.js';
import { BaseHandler } from './base-handler.js';

/**
 * Handler for editor-related operations
 */
export class EditorHandler extends BaseHandler {
  /**
   * Launch Godot editor for a specific project
   */
  async handleLaunchEditor(args: any): Promise<ToolResponse> {
    if (!args.projectPath) {
      return this.errorHandler.createErrorResponse(
        'Project path is required',
        ['Provide a valid path to a Godot project directory']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectDirectory(args.projectPath);

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

    try {
      return new Promise((resolve, reject) => {
        const process = spawn(godotPath, ['-e', '--path', args.projectPath], {
          stdio: 'ignore',
          detached: true
        });

        process.once('spawn', () => {
          process.unref();
          resolve({
            content: [
              {
                type: 'text',
                text: `Godot editor launched successfully for project at ${args.projectPath}.`,
              },
            ],
          });
        });

        process.once('error', (err: Error) => {
          reject(this.errorHandler.createErrorResponse(
            `Failed to launch Godot editor: ${err.message}`,
            [
              'Ensure Godot is installed correctly',
              'Check if the GODOT_PATH environment variable is set correctly',
              'Verify the project path is accessible',
            ]
          ));
        });
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.errorHandler.createErrorResponse(
        `Failed to launch Godot editor: ${errorMessage}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Get the installed Godot version
   */
  async handleGetGodotVersion(): Promise<ToolResponse> {
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

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`"${godotPath}" --version`);
      return {
        content: [
          {
            type: 'text',
            text: stdout.trim(),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.errorHandler.createErrorResponse(
        `Failed to get Godot version: ${errorMessage}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
        ]
      );
    }
  }

  /**
   * Handle method for base class compatibility
   */
  async handle(args: any): Promise<ToolResponse> {
    throw new Error('EditorHandler.handle() must be called with specific method');
  }
}
