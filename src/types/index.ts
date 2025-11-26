/**
 * Type definitions for the Godot MCP Server
 */

/**
 * Interface representing a running Godot process
 */
export interface GodotProcess {
  process: any;
  output: string[];
  errors: string[];
}

/**
 * Interface for server configuration
 */
export interface GodotServerConfig {
  godotPath?: string;
  debugMode?: boolean;
  godotDebugMode?: boolean;
  strictPathValidation?: boolean;
}

/**
 * Interface for operation parameters
 */
export interface OperationParams {
  [key: string]: any;
}

/**
 * Specific parameter interfaces for better type safety
 */
export interface LaunchEditorParams {
  projectPath: string;
}

export interface RunProjectParams {
  projectPath: string;
  scene?: string;
}

export interface ListProjectsParams {
  directory: string;
  recursive?: boolean;
}

export interface GetProjectInfoParams {
  projectPath: string;
}

export interface CreateSceneParams {
  projectPath: string;
  scenePath: string;
  rootNodeType?: string;
}

export interface AddNodeParams {
  projectPath: string;
  scenePath: string;
  nodeType: string;
  nodeName: string;
  parentNodePath?: string;
  properties?: Record<string, any>;
}

export interface LoadSpriteParams {
  projectPath: string;
  scenePath: string;
  nodePath: string;
  texturePath: string;
}

export interface ExportMeshLibraryParams {
  projectPath: string;
  scenePath: string;
  outputPath: string;
  meshItemNames?: string[];
}

export interface SaveSceneParams {
  projectPath: string;
  scenePath: string;
  newPath?: string;
}

export interface GetUidParams {
  projectPath: string;
  filePath: string;
}

export interface UpdateProjectUidsParams {
  projectPath: string;
}

/**
 * Interface for operation execution result
 */
export interface OperationResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Interface for MCP tool response - compatible with CallToolResult
 */
export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Interface for path detection
 */
export interface PathDetection {
  detectGodotPath(): Promise<void>;
  isValidGodotPath(path: string): Promise<boolean>;
  isValidGodotPathSync(path: string): boolean;
  setGodotPath(path: string): Promise<boolean>;
}

/**
 * Interface for process management
 */
export interface ProcessManager {
  spawnProcess(command: string, args: string[], options?: any): Promise<any>;
  cleanup(): void;
  getActiveProcess(): GodotProcess | null;
}

/**
 * Interface for operation execution
 */
export interface OperationExecutor {
  executeOperation(operation: string, params: OperationParams, projectPath: string): Promise<OperationResult>;
}

/**
 * Interface for parameter mapping
 */
export interface ParameterMapper {
  normalizeParameters(params: OperationParams): OperationParams;
  convertCamelToSnakeCase(params: OperationParams): OperationParams;
}

/**
 * Interface for error handling
 */
export interface ErrorHandler {
  createErrorResponse(message: string, possibleSolutions?: string[]): ToolResponse;
}
