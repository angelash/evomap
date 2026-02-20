import express from 'express';
import { A2AEnvelope, MessageType } from './protocol/envelope.js';
import { handleHello } from './handlers/hello.js';
import { handlePublish } from './handlers/publish.js';
import { handleFetch } from './handlers/fetch.js';
import { EvoMapError, createAuthError } from './errors/index.js';

const app = express();

// Middleware: JSON body parser
app.use(express.json({ limit: '10mb' }));

// Middleware: Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// A2A Protocol Endpoints
app.post('/a2a/hello', async (req, res) => {
  try {
    const envelope = req.body as A2AEnvelope<unknown>;
    await validateEnvelope(envelope, 'hello');
    
    const response = await handleHello(envelope);
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/a2a/publish', async (req, res) => {
  try {
    const envelope = req.body as A2AEnvelope<unknown>;
    await validateEnvelope(envelope, 'publish');
    
    const response = await handlePublish(envelope);
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/a2a/fetch', async (req, res) => {
  try {
    const envelope = req.body as A2AEnvelope<unknown>;
    await validateEnvelope(envelope, 'fetch');
    
    const response = await handleFetch(envelope);
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * Validate A2A envelope structure
 */
async function validateEnvelope(
  envelope: unknown,
  expectedType: MessageType
): Promise<void> {
  if (!envelope || typeof envelope !== 'object') {
    throw new EvoMapError(
      'E_SCHEMA_MISSING_FIELD',
      'Invalid envelope: not an object',
      { expectedType }
    );
  }

  const env = envelope as A2AEnvelope<unknown>;

  if (env.protocol !== 'evomap-a2a') {
    throw new EvoMapError(
      'E_SCHEMA_INVALID_VERSION',
      'Invalid protocol version',
      { protocol: env.protocol }
    );
  }

  if (env.message_type !== expectedType) {
    throw new EvoMapError(
      'E_SCHEMA_MISSING_FIELD',
      `Expected message type: ${expectedType}, got: ${env.message_type}`,
      { expected: expectedType, actual: env.message_type }
    );
  }

  if (!env.message_id || typeof env.message_id !== 'string') {
    throw new EvoMapError(
      'E_SCHEMA_MISSING_FIELD',
      'Missing or invalid message_id',
      { message_id: env.message_id }
    );
  }

  if (!env.sender_id || typeof env.sender_id !== 'string') {
    throw new EvoMapError(
      'E_SCHEMA_MISSING_FIELD',
      'Missing or invalid sender_id',
      { sender_id: env.sender_id }
    );
  }

  if (!env.timestamp_ms || typeof env.timestamp_ms !== 'number') {
    throw new EvoMapError(
      'E_SCHEMA_MISSING_FIELD',
      'Missing or invalid timestamp_ms',
      { timestamp_ms: env.timestamp_ms }
    );
  }
}

/**
 * Handle errors consistently
 */
function handleError(res: express.Response, error: unknown): void {
  console.error('Error:', error);

  if (error instanceof EvoMapError) {
    res.status(400).json({
      error_code: error.code,
      message: error.message,
      context: error.context
    });
  } else {
    res.status(500).json({
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Start the server
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`EvoMap-Lite Hub API listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
