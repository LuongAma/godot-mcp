import { spawn } from 'child_process';
import { ToolResponse, GodotProcess } from '../types/index.js';
import { BaseHandler } from './base-handler.js';

/**
 * Handler for project execution operations
 */
export class ProjectHandler extends BaseHandler {
  private activeProcess: GodotProcess | null = null;

  /**
   * Run the Godot project and capture output
   */
  async handleRunProject(args: any): Promise<ToolResponse> {
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
      // Kill any existing process
      if (this.activeProcess) {
        this.activeProcess.process.kill();
      }

      const cmdArgs = ['-d', '--path', args.projectPath];
      if (args.scene && this.pathValidator.validatePath(args.scene)) {
        cmdArgs.push(args.scene);
      }

      return new Promise((resolve, reject) => {
        const process = spawn(godotPath, cmdArgs, { stdio: 'pipe' });
        const output: string[] = [];
        const errors: string[] = [];

        process.stdout?.on('data', (data: Buffer) => {
          const lines = data.toString().split('\n');
          output.push(...lines);
        });

        process.stderr?.on('data', (data: Buffer) => {
          const lines = data.toString().split('\n');
          errors.push(...lines);
        });

        process.on('exit', (code: number | null) => {
          if (this.activeProcess && this.activeProcess.process === process) {
            this.activeProcess = null;
          }
        });

        process.once('spawn', () => {
          this.activeProcess = { process, output, errors };
          resolve({
            content: [
              {
                type: 'text',
                text: `Godot project started in debug mode. Use get_debug_output to see output.`,
              },
            ],
          });
        });

        process.once('error', (err: Error) => {
          if (this.activeProcess && this.activeProcess.process === process) {
            this.activeProcess = null;
          }
          reject(this.errorHandler.createErrorResponse(
            `Failed to run Godot project: ${err.message}`,
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
        `Failed to run Godot project: ${errorMessage}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Get the current debug output and errors
   */
  async handleGetDebugOutput(): Promise<ToolResponse> {
    if (!this.activeProcess) {
      return this.errorHandler.createErrorResponse(
        'No active Godot process.',
        [
          'Use run_project to start a Godot project first',
          'Check if the Godot process crashed unexpectedly',
        ]
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              output: this.activeProcess.output,
              errors: this.activeProcess.errors,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Stop the currently running Godot project
   */
  async handleStopProject(): Promise<ToolResponse> {
    if (!this.activeProcess) {
      return this.errorHandler.createErrorResponse(
        'No active Godot process to stop.',
        [
          'Use run_project to start a Godot project first',
          'The process may have already terminated',
        ]
      );
    }

    this.activeProcess.process.kill();
    const output = this.activeProcess.output;
    const errors = this.activeProcess.errors;
    this.activeProcess = null;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: 'Godot project stopped',
              finalOutput: output,
              finalErrors: errors,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handle method for base class compatibility
   */
  async handle(args: any): Promise<ToolResponse> {
    throw new Error('ProjectHandler.handle() must be called with specific method');
  }
}
