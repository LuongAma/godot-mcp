#!/usr/bin/env node
/**
 * Godot MCP Server - Main Entry Point
 */

import { GodotServer } from './server.js';

const server = new GodotServer();
server.run().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to run server:', errorMessage);
  process.exit(1);
});