import { initializeApp, credential, auth, firestore, app } from 'firebase-admin';
import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

let firebaseApp: app.App | null = null;

export function initializeFirebase(serviceAccountPath?: string, serviceAccountJson?: string) {
  if (firebaseApp) return firebaseApp;
  
  try {
    console.log('Initializing Firebase...');
    console.log('credential object:', typeof credential);
    console.log('credential.cert:', typeof credential.cert);
    
    if (serviceAccountJson) {
      // Parse JSON from environment variable (for Railway deployment)
      console.log('Using service account JSON');
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = initializeApp({
        credential: credential.cert(serviceAccount)
      });
    } else if (serviceAccountPath) {
      // Use file path (for local development)
      console.log('Using service account file path');
      firebaseApp = initializeApp({
        credential: credential.cert(serviceAccountPath)
      });
    } else {
      // Use Application Default Credentials
      console.log('Using application default credentials');
      firebaseApp = initializeApp({
        credential: credential.applicationDefault()
      });
    }
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Failed to initialize Firebase. Check your service account configuration.');
  }
  
  return firebaseApp;
}

export const firebaseTools: Tool[] = [
  {
    name: 'firebase_get_user',
    description: 'Get a Firebase user by UID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'User UID' }
      },
      required: ['uid']
    }
  },
  {
    name: 'firebase_create_user',
    description: 'Create a new Firebase user',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        password: { type: 'string', description: 'User password' },
        displayName: { type: 'string', description: 'Display name' }
      },
      required: ['email', 'password']
    }
  },
  {
    name: 'firebase_list_users',
    description: 'List Firebase users',
    inputSchema: {
      type: 'object',
      properties: {
        maxResults: { type: 'number', description: 'Maximum results to return', default: 100 }
      }
    }
  },
  {
    name: 'firebase_delete_user',
    description: 'Delete a Firebase user',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'User UID to delete' }
      },
      required: ['uid']
    }
  },
  {
    name: 'firebase_get_document',
    description: 'Get a Firestore document',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        documentId: { type: 'string', description: 'Document ID' }
      },
      required: ['collection', 'documentId']
    }
  },
  {
    name: 'firebase_set_document',
    description: 'Set/create a Firestore document',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        documentId: { type: 'string', description: 'Document ID' },
        data: { type: 'object', description: 'Document data' }
      },
      required: ['collection', 'documentId', 'data']
    }
  },
  {
    name: 'firebase_update_document',
    description: 'Update a Firestore document',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        documentId: { type: 'string', description: 'Document ID' },
        data: { type: 'object', description: 'Fields to update' }
      },
      required: ['collection', 'documentId', 'data']
    }
  },
  {
    name: 'firebase_delete_document',
    description: 'Delete a Firestore document',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        documentId: { type: 'string', description: 'Document ID' }
      },
      required: ['collection', 'documentId']
    }
  },
  {
    name: 'firebase_query_collection',
    description: 'Query a Firestore collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        where: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              operator: { type: 'string', enum: ['==', '!=', '<', '<=', '>', '>=', 'array-contains', 'in', 'array-contains-any'] },
              value: {}
            },
            required: ['field', 'operator', 'value']
          },
          description: 'Where conditions'
        },
        orderBy: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            direction: { type: 'string', enum: ['asc', 'desc'] }
          }
        },
        limit: { type: 'number', description: 'Limit results' }
      },
      required: ['collection']
    }
  }
];

export async function handleFirebaseTool(request: CallToolRequest): Promise<CallToolResult> {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Please check your service account configuration.');
  }

  const { name, arguments: args } = request.params;
  
  if (!args || typeof args !== 'object') {
    throw new Error('Invalid arguments provided');
  }

  try {
    switch (name) {
      case 'firebase_get_user': {
        const user = await auth().getUser((args as any).uid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              disabled: user.disabled,
              metadata: user.metadata
            }, null, 2)
          }]
        };
      }

      case 'firebase_create_user': {
        const user = await auth().createUser({
          email: (args as any).email,
          password: (args as any).password,
          displayName: (args as any).displayName
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ uid: user.uid, email: user.email }, null, 2)
          }]
        };
      }

      case 'firebase_list_users': {
        const listResult = await auth().listUsers((args as any).maxResults || 100);
        const users = listResult.users.map(u => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName
        }));
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(users, null, 2)
          }]
        };
      }

      case 'firebase_delete_user': {
        await auth().deleteUser((args as any).uid);
        return {
          content: [{
            type: 'text',
            text: `User ${(args as any).uid} deleted successfully`
          }]
        };
      }

      case 'firebase_get_document': {
        const doc = await firestore()
          .collection((args as any).collection)
          .doc((args as any).documentId)
          .get();
        
        if (!doc.exists) {
          return {
            content: [{
              type: 'text',
              text: 'Document not found'
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(doc.data(), null, 2)
          }]
        };
      }

      case 'firebase_set_document': {
        await firestore()
          .collection((args as any).collection)
          .doc((args as any).documentId)
          .set((args as any).data);
        
        return {
          content: [{
            type: 'text',
            text: `Document ${(args as any).documentId} created/updated in ${(args as any).collection}`
          }]
        };
      }

      case 'firebase_update_document': {
        await firestore()
          .collection((args as any).collection)
          .doc((args as any).documentId)
          .update((args as any).data);
        
        return {
          content: [{
            type: 'text',
            text: `Document ${(args as any).documentId} updated in ${(args as any).collection}`
          }]
        };
      }

      case 'firebase_delete_document': {
        await firestore()
          .collection((args as any).collection)
          .doc((args as any).documentId)
          .delete();
        
        return {
          content: [{
            type: 'text',
            text: `Document ${(args as any).documentId} deleted from ${(args as any).collection}`
          }]
        };
      }

      case 'firebase_query_collection': {
        let query: any = firestore().collection((args as any).collection);

        if ((args as any).where) {
          for (const condition of (args as any).where) {
            query = query.where(condition.field, condition.operator, condition.value);
          }
        }

        if ((args as any).orderBy) {
          query = query.orderBy((args as any).orderBy.field, (args as any).orderBy.direction || 'asc');
        }

        if ((args as any).limit) {
          query = query.limit((args as any).limit);
        }

        const snapshot = await query.get();
        const results = snapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          data: doc.data()
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}