#!/usr/bin/env node
import { Command } from 'commander';
import { execSync } from 'child_process';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const program = new Command();
const API_BASE = 'http://localhost:3000/api';
const CONFIG_FILE = path.join(process.cwd(), '.continuum.json');

program
  .name('cnt')
  .description('CONTINUUM CLI - Memory that outlives the session')
  .version('1.0.0');
  
// Command: cnt init
program
  .command('init')
  .description('Initialize a new Continuum project in this directory')
  .action(async () => {
    const projectId = crypto.randomUUID();
    const config = { project_id: projectId, owner_id: "demo_user_123" };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    try {
      await axios.post(`${API_BASE}/projects`, {
        _id: projectId,
        owner_id: config.owner_id,
        name: path.basename(process.cwd()),
        instrumentation_enabled: true,
        created_at: new Date()
      });
      console.log(`Initialized Continuum project: ${projectId}`);
    } catch (err: any) {
      console.error('Failed to register project with API:', err.message);
    }
  });

// Command: cnt run <command>
program
  .command('run <cmd...>')
  .allowUnknownOption()
  .description('Wrap a command and log its execution')
  .action(async (cmdArray) => {
    if (!fs.existsSync(CONFIG_FILE)) {
      return console.error('No .continuum.json found. Run "cnt init" first.');
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const fullCommand = cmdArray.join(' ');
    const runId = crypto.randomUUID();

    console.log(`[Continuum] Starting run: ${fullCommand}`);
    
    // Log Run Start
    await axios.post(`${API_BASE}/runs`, {
      _id: runId,
      project_id: config.project_id,
      source: "human",
      triggered_by: config.owner_id,
      status: "running",
      started_at: new Date()
    });

    try {
      // Execute human command
      execSync(fullCommand, { stdio: 'inherit' });
      
      // Log Success Event
      await axios.post(`${API_BASE}/events`, {
        _id: crypto.randomUUID(),
        run_id: runId,
        type: "command_run",
        payload: { command: fullCommand, status: "success" },
        timestamp: new Date()
      });
    } catch (err: any) {
      // Log Failure Event
      await axios.post(`${API_BASE}/events`, {
        _id: crypto.randomUUID(),
        run_id: runId,
        type: "error",
        payload: { command: fullCommand },
        error_message: err.message,
        timestamp: new Date()
      });
    }
  });

program.parse();