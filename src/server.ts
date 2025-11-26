#!/usr/bin/env node
/**
 * Godot MCP Server - Refactored Main Server Class
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import modules
import { PathDetectionImpl } from './modules/path-detection.js';
import { ProcessManagerImpl } from './modules/process-manager.js';
import { OperationExecutorImpl } from './modules/operation-executor.js';
import { ErrorHandler } from './utils/error-handler.js';

// Import handlers
import { EditorHandler } from './handlers/editor-handler.js';
import { ProjectHandler } from './handlers/project-handler.js';
import { InfoHandler } from './handlers/info-handler.js';
import { SceneHandler } from './handlers/scene-handler.js';
import { ResourceHandler } from './handlers/resource-handler.js';
import { UidHandler } from './handlers/uid-handler.js';

// Import types
import { GodotServerConfig, GodotProcess, ToolResponse } from './types/index.js';

// Derive __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main server class for the Godot MCP server - Refactored
 */
export class GodotServer {
  private server: Server;
  private activeProcess: GodotProcess | null = null;
  private operationsScriptPath: string;
  private strictPathValidation: boolean = false;
  private debugMode: boolean;
  private godotDebugMode: boolean;

  // Modules
  private pathDetector: PathDetectionImpl;
  private processManager: ProcessManagerImpl;
  private operationExecutor: OperationExecutorImpl;
  private errorHandler: ErrorHandler;

  // Handlers
  private editorHandler: EditorHandler;
  private projectHandler: ProjectHandler;
  private infoHandler: InfoHandler;
  private sceneHandler: SceneHandler;
  private resourceHandler: ResourceHandler;
  private uidHandler: UidHandler;

  constructor(config?: GodotServerConfig) {
    // Set debug modes from config or environment
    this.debugMode = config?.debugMode ?? (process.env.DEBUG === 'true');
    this.godotDebugMode = config?.godotDebugMode ?? true;

    if (config) {
      if (config.strictPathValidation !== undefined) {
        this.strictPathValidation = config.strictPathValidation;
      }
    }

    // Set the path to the operations script
    this.operationsScriptPath = join(__dirname, 'scripts', 'godot_operations.gd');
    if (this.debugMode) console.debug(`[DEBUG] Operations script path: ${this.operationsScriptPath}`);

    // Initialize modules
    this.pathDetector = new PathDetectionImpl(this.debugMode);
    this.processManager = new ProcessManagerImpl(this.debugMode);
    this.operationExecutor = new OperationExecutorImpl(
      this.operationsScriptPath,
      null, // Will be set after path detection
      this.godotDebugMode,
      this.debugMode
    );
    this.errorHandler = new ErrorHandler();

    // Initialize handlers
    this.editorHandler = new EditorHandler(this.pathDetector, this.operationExecutor, this.errorHandler);
    this.projectHandler = new ProjectHandler(this.pathDetector, this.operationExecutor, this.errorHandler);
    this.infoHandler = new InfoHandler(this.pathDetector, this.operationExecutor, this.errorHandler);
    this.sceneHandler = new SceneHandler(this.pathDetector, this.operationExecutor, this.errorHandler);
    this.resourceHandler = new ResourceHandler(this.pathDetector, this.operationExecutor, this.errorHandler);
    this.uidHandler = new UidHandler(this.pathDetector, this.operationExecutor, this.errorHandler);

    // Initialize the MCP server
    this.server = new Server(
      {
        name: 'godot-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up tool handlers
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);

    // Cleanup on exit
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
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
   * Clean up resources when shutting down
   */
  private async cleanup() {
    this.logDebug('Cleaning up resources');
    this.processManager.cleanup();
    await this.server.close();
  }

  /**
   * Set up the tool handlers for the MCP server
   */
  private setupToolHandlers() {
    // Define available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'launch_editor',
          description: 'Launch Godot editor for a specific project',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
            },
            required: ['projectPath'],
          },
        },
        {
          name: 'run_project',
          description: 'Run the Godot project and capture output',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              scene: {
                type: 'string',
                description: 'Optional: Specific scene to run',
              },
            },
            required: ['projectPath'],
          },
        },
        {
          name: 'get_debug_output',
          description: 'Get the current debug output and errors',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'stop_project',
          description: 'Stop the currently running Godot project',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_godot_version',
          description: 'Get the installed Godot version',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'list_projects',
          description: 'List Godot projects in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory to search for Godot projects',
              },
              recursive: {
                type: 'boolean',
                description: 'Whether to search recursively (default: false)',
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'get_project_info',
          description: 'Retrieve metadata about a Godot project',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
            },
            required: ['projectPath'],
          },
        },
        {
          name: 'create_scene',
          description: 'Create a new Godot scene file',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              scenePath: {
                type: 'string',
                description: 'Path where the scene file will be saved (relative to project)',
              },
              rootNodeType: {
                type: 'string',
                description: 'Type of the root node (e.g., Node2D, Node3D)',
                default: 'Node2D',
              },
            },
            required: ['projectPath', 'scenePath'],
          },
        },
        {
          name: 'add_node',
          description: 'Add a node to an existing scene',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              scenePath: {
                type: 'string',
                description: 'Path to the scene file (relative to project)',
              },
              parentNodePath: {
                type: 'string',
                description: 'Path to the parent node (e.g., "root" or "root/Player")',
                default: 'root',
              },
              nodeType: {
                type: 'string',
                description: 'Type of node to add (e.g., Sprite2D, CollisionShape2D)',
              },
              nodeName: {
                type: 'string',
                description: 'Name for the new node',
              },
              properties: {
                type: 'object',
                description: 'Optional properties to set on the node',
              },
            },
            required: ['projectPath', 'scenePath', 'nodeType', 'nodeName'],
          },
        },
        {
          name: 'load_sprite',
          description: 'Load a sprite into a Sprite2D node',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              scenePath: {
                type: 'string',
                description: 'Path to the scene file (relative to project)',
              },
              nodePath: {
                type: 'string',
                description: 'Path to the Sprite2D node (e.g., "root/Player/Sprite2D")',
              },
              texturePath: {
                type: 'string',
                description: 'Path to the texture file (relative to project)',
              },
            },
            required: ['projectPath', 'scenePath', 'nodePath', 'texturePath'],
          },
        },
        {
          name: 'export_mesh_library',
          description: 'Export a scene as a MeshLibrary resource',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              scenePath: {
                type: 'string',
                description: 'Path to the scene file (.tscn) to export',
              },
              outputPath: {
                type: 'string',
                description: 'Path where the mesh library (.res) will be saved',
              },
              meshItemNames: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Optional: Names of specific mesh items to include (defaults to all)',
              },
            },
            required: ['projectPath', 'scenePath', 'outputPath'],
          },
        },
        {
          name: 'save_scene',
          description: 'Save changes to a scene file',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              scenePath: {
                type: 'string',
                description: 'Path to the scene file (relative to project)',
              },
              newPath: {
                type: 'string',
                description: 'Optional: New path to save the scene to (for creating variants)',
              },
            },
            required: ['projectPath', 'scenePath'],
          },
        },
        {
          name: 'get_uid',
          description: 'Get the UID for a specific file in a Godot project (for Godot 4.4+)',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
              filePath: {
                type: 'string',
                description: 'Path to the file (relative to project) for which to get the UID',
              },
            },
            required: ['projectPath', 'filePath'],
          },
        },
        {
          name: 'update_project_uids',
          description: 'Update UID references in a Godot project by resaving resources (for Godot 4.4+)',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the Godot project directory',
              },
            },
            required: ['projectPath'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      this.logDebug(`Handling tool request: ${request.params.name}`);
      
      try {
        let result: ToolResponse;
        switch (request.params.name) {
          case 'launch_editor':
            result = await this.editorHandler.handleLaunchEditor(request.params.arguments);
            break;
          case 'get_godot_version':
            result = await this.editorHandler.handleGetGodotVersion();
            break;
          case 'run_project':
            result = await this.projectHandler.handleRunProject(request.params.arguments);
            break;
          case 'get_debug_output':
            result = await this.projectHandler.handleGetDebugOutput();
            break;
          case 'stop_project':
            result = await this.projectHandler.handleStopProject();
            break;
          case 'list_projects':
            result = await this.infoHandler.handleListProjects(request.params.arguments);
            break;
          case 'get_project_info':
            result = await this.infoHandler.handleGetProjectInfo(request.params.arguments);
            break;
          case 'create_scene':
            result = await this.sceneHandler.handleCreateScene(request.params.arguments);
            break;
          case 'add_node':
            result = await this.sceneHandler.handleAddNode(request.params.arguments);
            break;
          case 'save_scene':
            result = await this.sceneHandler.handleSaveScene(request.params.arguments);
            break;
          case 'load_sprite':
            result = await this.resourceHandler.handleLoadSprite(request.params.arguments);
            break;
          case 'export_mesh_library':
            result = await this.resourceHandler.handleExportMeshLibrary(request.params.arguments);
            break;
          case 'get_uid':
            result = await this.uidHandler.handleGetUid(request.params.arguments);
            break;
          case 'update_project_uids':
            result = await this.uidHandler.handleUpdateProjectUids(request.params.arguments);
            break;
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
        return result as CallToolResult;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorResult = this.errorHandler.createErrorResponse(
          `Tool execution failed: ${errorMessage}`,
          ['Check the tool parameters and try again']
        );
        return errorResult as CallToolResult;
      }
    });
  }

  /**
   * Run the MCP server
   */
  async run() {
    try {
      // Detect Godot path before starting the server
      await this.pathDetector.detectGodotPath();
      
      const godotPath = this.pathDetector.getGodotPath();
      if (!godotPath) {
        console.error('[SERVER] Failed to find a valid Godot executable path');
        console.error('[SERVER] Please set GODOT_PATH environment variable or provide a valid path');
        process.exit(1);
      }

      // Set the Godot path in the operation executor
      this.operationExecutor.setGodotPath(godotPath);

      // Check if the path is valid
      const isValid = await this.pathDetector.isValidGodotPath(godotPath);

      if (!isValid) {
        if (this.strictPathValidation) {
          // In strict mode, exit if the path is invalid
          console.error(`[SERVER] Invalid Godot path: ${godotPath}`);
          console.error('[SERVER] Please set a valid GODOT_PATH environment variable or provide a valid path');
          process.exit(1);
        } else {
          // In compatibility mode, warn but continue with the default path
          console.warn(`[SERVER] Warning: Using potentially invalid Godot path: ${godotPath}`);
          console.warn('[SERVER] This may cause issues when executing Godot commands');
        }
      }

      console.log(`[SERVER] Using Godot at: ${godotPath}`);

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Godot MCP server running on stdio');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SERVER] Failed to start:', errorMessage);
      process.exit(1);
    }
  }
}
