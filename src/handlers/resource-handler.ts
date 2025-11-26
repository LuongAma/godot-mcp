import { existsSync } from 'fs';
import { join } from 'path';
import { ToolResponse } from '../types/index.js';
import { BaseHandler } from './base-handler.js';

/**
 * Handler for resource-related operations
 */
export class ResourceHandler extends BaseHandler {
  /**
   * Load a sprite into a Sprite2D node
   */
  async handleLoadSprite(args: any): Promise<ToolResponse> {
    if (!args.projectPath || !args.scenePath || !args.nodePath || !args.texturePath) {
      return this.errorHandler.createErrorResponse(
        'Missing required parameters',
        ['Provide projectPath, scenePath, nodePath, and texturePath']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectPath(args.scenePath);
    this.validateProjectPath(args.nodePath);
    this.validateProjectPath(args.texturePath);
    this.validateProjectDirectory(args.projectPath);

    // Check if the scene file exists
    const scenePath = join(args.projectPath, args.scenePath);
    this.validateFileExists(scenePath);

    // Check if the texture file exists
    const texturePath = join(args.projectPath, args.texturePath);
    this.validateFileExists(texturePath);

    try {
      // Prepare parameters for the operation
      const params = {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        texturePath: args.texturePath,
      };

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('load_sprite', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to load sprite: ${stderr || 'Unknown error'}`,
          [
            'Check if the node path is correct',
            'Ensure the node is a Sprite2D, Sprite3D, or TextureRect',
            'Verify the texture file is a valid image format',
          ]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Sprite loaded successfully with texture: ${args.texturePath}\n\nOutput: ${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to load sprite: ${error?.message || 'Unknown error'}`,
        [
          'Ensure Godot is installed correctly',
          'Check if the GODOT_PATH environment variable is set correctly',
          'Verify the project path is accessible',
        ]
      );
    }
  }

  /**
   * Export a scene as a MeshLibrary resource
   */
  async handleExportMeshLibrary(args: any): Promise<ToolResponse> {
    if (!args.projectPath || !args.scenePath || !args.outputPath) {
      return this.errorHandler.createErrorResponse(
        'Missing required parameters',
        ['Provide projectPath, scenePath, and outputPath']
      );
    }

    this.validateProjectPath(args.projectPath);
    this.validateProjectPath(args.scenePath);
    this.validateProjectPath(args.outputPath);
    this.validateProjectDirectory(args.projectPath);

    // Check if the scene file exists
    const scenePath = join(args.projectPath, args.scenePath);
    this.validateFileExists(scenePath);

    try {
      // Prepare parameters for the operation
      const params: any = {
        scenePath: args.scenePath,
        outputPath: args.outputPath,
      };

      // Add optional parameters
      if (args.meshItemNames && Array.isArray(args.meshItemNames)) {
        params.meshItemNames = args.meshItemNames;
      }

      // Execute the operation
      const { stdout, stderr, exitCode } = await this.operationExecutor.executeOperation('export_mesh_library', params, args.projectPath);

      if (exitCode !== 0 || stderr) {
        return this.errorHandler.createErrorResponse(
          `Failed to export mesh library: ${stderr || 'Unknown error'}`,
          [
            'Check if the scene contains valid 3D meshes',
            'Ensure the output path is valid',
            'Verify the scene file is valid',
          ]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `MeshLibrary exported successfully to: ${args.outputPath}\n\nOutput: ${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return this.errorHandler.createErrorResponse(
        `Failed to export mesh library: ${error?.message || 'Unknown error'}`,
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
    throw new Error('ResourceHandler.handle() must be called with specific method');
  }
}
