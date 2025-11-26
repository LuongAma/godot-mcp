import { spawn } from 'child_process';
import { GodotProcess, ProcessManager } from '../types/index.js';

/**
 * Process management for Godot operations
 */
export class ProcessManagerImpl implements ProcessManager {
  private activeProcess: GodotProcess | null = null;
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
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
   * Spawn a process with proper error handling
   */
  async spawnProcess(command: string, args: string[], options: any = {}): Promise<any> {
    this.logDebug(`Spawning process: ${command} ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, options);

      process.once('spawn', () => {
        this.logDebug(`Process spawned successfully`);
        resolve(process);
      });

      process.once('error', (err: Error) => {
        this.logDebug(`Process spawn error: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Set the active Godot process
   */
  setActiveProcess(process: GodotProcess): void {
    this.activeProcess = process;
  }

  /**
   * Get the active Godot process
   */
  getActiveProcess(): GodotProcess | null {
    return this.activeProcess;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.logDebug('Cleaning up process resources');
    if (this.activeProcess) {
      this.logDebug('Killing active Godot process');
      this.activeProcess.process.kill();
      this.activeProcess = null;
    }
  }
}
