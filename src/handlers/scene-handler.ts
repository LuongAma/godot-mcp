import { existsSync } from 'fs';
import { join } from 'path';
import { ToolResponse } from '../types/index.js';
import { BaseHandler } from './base-handler.js';

/**
 * Handler for scene-related operations
 */
export class SceneHandler extends BaseHandler {
  /**
   * Create a new Godot scene file
   */
  async handleCreateScene(args: any): Promise<ToolResponse> {
    if (!args.projectPath || !args.scenePath) {
      return this.errorHandler.createErrorResponse(
        'Project path and scene path are required',
        ['Provide valid paths for both the project and the scene']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectPath(args.scenePath);
    this.validateProjectDirectory(args.projectPath);

    try {
      // Prepare parameters for the operation
      const params = {
        scenePath: args.scenePath,
        rootNodeType: args.rootNodeType || 'Node2D',
      };

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('create_scene', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to create scene: ${stderr || 'Unknown error'}`,
          [
            'Check if the root node type is valid',
            'Ensure you have write permissions to the scene path',
            'Verify the scene path is valid',
          ]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Scene created successfully at: ${args.scenePath}\n\nOutput: ${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to create scene: ${error?.message || 'Unknown error'}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Add a node to an existing scene
   */
  async handleAddNode(args: any): Promise<ToolResponse> {
    if (!args.projectPath || !args.scenePath || !args.nodeType || !args.nodeName) {
      return this.errorHandler.createErrorResponse(
        'Missing required parameters',
        ['Provide projectPath, scenePath, nodeType, and nodeName']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectPath(args.scenePath);
    this.validateProjectDirectory(args.projectPath);

    // Check if the scene file exists
    const scenePath = join(args.projectPath, args.scenePath);
    this.validateFileExists(scenePath);

    try {
      // Prepare parameters for the operation
      const params: any = {
        scenePath: args.scenePath,
        nodeType: args.nodeType,
        nodeName: args.nodeName,
      };

      // Add optional parameters
      if (args.parentNodePath) {
        params.parentNodePath = args.parentNodePath;
      }

      if (args.properties) {
        params.properties = args.properties;
      }

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('add_node', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to add node: ${stderr || 'Unknown error'}`,
          [
            'Check if the node type is valid',
            'Ensure the parent node path exists',
            'Verify the scene file is valid',
          ]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Node '${args.nodeName}' of type '${args.nodeType}' added successfully to '${args.scenePath}'.\n\nOutput: ${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to add node: ${error?.message || 'Unknown error'}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Save changes to a scene file
   */
  async handleSaveScene(args: any): Promise<ToolResponse> {
    if (!args.projectPath || !args.scenePath) {
      return this.errorHandler.createErrorResponse(
        'Missing required parameters',
        ['Provide projectPath and scenePath']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectPath(args.scenePath);

    // If newPath is provided, validate it
    if (args.newPath && !this.pathValidator.validatePath(args.newPath)) {
      return this.errorHandler.createErrorResponse(
        'Invalid new path',
        ['Provide a valid new path without ".." or other potentially unsafe characters']
      );
    }

    this.validateProjectDirectory(args.projectPath);

    // Check if the scene file exists
    const scenePath = join(args.projectPath, args.scenePath);
    this.validateFileExists(scenePath);

    try {
      // Prepare parameters for the operation
      const params: any = {
        scenePath: args.scenePath,
      };

      // Add optional parameters
      if (args.newPath) {
        params.newPath = args.newPath;
      }

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('save_scene', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to save scene: ${stderr || 'Unknown error'}`,
          [
            'Check if the scene file is valid',
            'Ensure you have write permissions to the output path',
            'Verify the scene can be properly packed',
          ]
        );
      }

      const savePath = args.newPath || args.scenePath;
      return {
        content: [
          {
            type: 'text',
            text: `Scene saved successfully to: ${savePath}\n\nOutput: ${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to save scene: ${error?.message || 'Unknown error'}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Handle method for base class compatibility
   */
  async handle(args: any): Promise<ToolResponse> {
    throw new Error('SceneHandler.handle() must be called with specific method');
  }
}
