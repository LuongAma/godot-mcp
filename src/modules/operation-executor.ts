import { spawn } from 'child_process';
import { OperationParams, OperationResult, OperationExecutor } from '../types/index.js';
import { ParameterMapperImpl } from './parameter-mapper.js';
import { WindowsCompat } from '../utils/windows-compat.js';

/**
 * Execute Godot operations using the operations script
 */
export class OperationExecutorImpl implements OperationExecutor {
  private operationsScriptPath: string;
  private godotPath: string | null = null;
  private parameterMapper: ParameterMapperImpl;
  private godotDebugMode: boolean;
  private debugMode: boolean;

  constructor(
    operationsScriptPath: string,
    godotPath: string | null,
    godotDebugMode: boolean = true,
    debugMode: boolean = false
  ) {
    this.operationsScriptPath = operationsScriptPath;
    this.godotPath = godotPath;
    this.godotDebugMode = godotDebugMode;
    this.debugMode = debugMode;
    this.parameterMapper = new ParameterMapperImpl();
  }

  /**
   * Set the Godot path
   */
  setGodotPath(path: string): void {
    this.godotPath = path;
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(message: string): void {
    if (this.debugMode) {
      console.debug(`[DEBUG] ${message}`);
    }
  }

  /**
   * Execute a Godot operation using the operations script
   * @param operation The operation to execute
   * @param params The parameters for the operation
   * @param projectPath The path to the Godot project
   * @returns The stdout, stderr, and exit code from the operation
   */
  async executeOperation(
    operation: string,
    params: OperationParams,
    projectPath: string
  ): Promise<OperationResult> {
    this.logDebug(`Executing operation: ${operation} in project: ${projectPath}`);
    this.logDebug(`Original operation params: ${JSON.stringify(params)}`);

    // Convert camelCase parameters to snake_case for Godot script
    const snakeCaseParams = this.parameterMapper.convertCamelToSnakeCase(params);
    this.logDebug(`Converted snake_case params: ${JSON.stringify(snakeCaseParams)}`);

    // Ensure godotPath is set
    if (!this.godotPath) {
      throw new Error('Could not find a valid Godot executable path');
    }

    try {
      // Serialize the snake_case parameters to a valid JSON string
      const paramsJson = JSON.stringify(snakeCaseParams);

      // Add debug arguments if debug mode is enabled
      const debugArgs = this.godotDebugMode ? ['--debug-godot'] : [];

      // Build command arguments array for spawn
      const args = [
        '--headless',
        '--path',
        projectPath,
        '--script',
        this.operationsScriptPath,
        operation,
        paramsJson, // Pass the JSON string as a single argument
        ...debugArgs,
      ];

      this.logDebug(`Command: ${this.godotPath} ${args.join(' ')}`);

      return new Promise((resolve, reject) => {
        const process = spawn(this.godotPath!, args, {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        process.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        process.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        process.on('close', (code: number | null) => {
          resolve({
            stdout,
            stderr,
            exitCode: code || 0
          });
        });

        process.on('error', (error: Error) => {
          reject(error);
        });
      });
    } catch (error: unknown) {
      throw error;
    }
  }
}
