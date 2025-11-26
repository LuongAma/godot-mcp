import { existsSync } from 'fs';
import { join } from 'path';
import { ToolResponse } from '../types/index.js';
import { PathDetection } from '../types/index.js';
import { OperationExecutor } from '../types/index.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { PathValidator } from '../utils/path-validator.js';

/**
 * Base handler class for all tool handlers
 */
export abstract class BaseHandler {
  protected pathValidator: PathValidator;

  constructor(
    protected pathDetector: PathDetection,
    protected operationExecutor: OperationExecutor,
    protected errorHandler: ErrorHandler
  ) {
    this.pathValidator = new PathValidator();
  }

  /**
   * Abstract method that each handler must implement
   */
  abstract handle(args: any): Promise<ToolResponse>;

  /**
   * Validate project path
   */
  protected validateProjectPath(path: string): void {
    if (!this.pathValidator.validatePath(path)) {
      throw new Error('Invalid project path - contains potentially unsafe characters');
    }
  }

  /**
   * Check if a project directory exists and contains a project.godot file
   */
  protected validateProjectDirectory(projectPath: string): void {
    const projectFile = join(projectPath, 'project.godot');
    if (!existsSync(projectFile)) {
      throw new Error(`Not a valid Godot project: ${projectPath}`);
    }
  }

  /**
   * Check if a file exists
   */
  protected validateFileExists(filePath: string): void {
    if (!existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
  }
}
