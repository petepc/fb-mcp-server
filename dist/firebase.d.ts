import * as admin from 'firebase-admin';
import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare function initializeFirebase(serviceAccountPath?: string, serviceAccountJson?: string): admin.app.App;
export declare const firebaseTools: Tool[];
export declare function handleFirebaseTool(request: CallToolRequest): Promise<CallToolResult>;
