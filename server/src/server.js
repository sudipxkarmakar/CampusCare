import './config/env.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import alumniRoutes from './routes/alumniRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import academicLeaderRoutes from './routes/academicLeaderRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import routineRoutes from './routes/routineRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import deanRoutes from './routes/deanRoutes.js';
import marMoocRoutes from './routes/marMoocRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import wardenRoutes from './routes/wardenRoutes.js';
import principalRoutes from './routes/principalRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { requestCorrelation } from './middleware/requestCorrelation.js';
import { globalErrorBoundary } from './middleware/errorBoundary.js';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import RedisManager from './services/ai/state/RedisManager.js';
import { watchdog } from './services/ai/state/WorkflowWatchdog.js';

const startServer = async () => {
  await connectDB();

  const app = express();

  // 1. Trust Proxy (Environment-Aware)
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // 2. Helmet Integration (Report-Only / Relaxed for Static Frontend)
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'"], // Relaxed temporarily for Netlify
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https:"]
      }
    }
  }));

  // 3. Compression
  app.use(compression());

  // 4. Strict CORS
  const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://your-netlify-site.netlify.app'] // Replace with actual Netlify URL
      : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5000'];

  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-request-id']
  }));

  // 5. Body Size Limits
  app.use(express.json({ limit: '100kb' }));
  
  // Inject Correlation ID
  app.use(requestCorrelation);

  // Request logger
  app.use((req, res, next) => {
    // Skip logging health checks to prevent log spam
    if (req.url === '/health' || req.url === '/ready') {
      return next();
    }
    console.log(`[${new Date().toISOString()}] [${req.requestId}] ${req.method} ${req.url}`);
    next();
  });

  // Mount Deployment Gates at root
  app.use('/', healthRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/notices', noticeRoutes);
  app.use('/api/mar-moocs', marMoocRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/hostel', hostelRoutes);
  app.use('/api/dean', deanRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/alumni', alumniRoutes);
  app.use('/api/teacher', teacherRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/academic-leaders', academicLeaderRoutes);
  app.use('/api/subjects', subjectRoutes);
  app.use('/api/routine', routineRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/hod', hodRoutes);
  app.use('/api/warden', wardenRoutes);
  app.use('/api/principal', principalRoutes);
  app.use('/api/notes', noteRoutes);

  // Serve static assets from 'docs' (formerly client)
  // The docs folder is one level up from server/src (server/../docs -> ../../docs)
  const docsPath = path.join(__dirname, '../../docs');
  app.use(express.static(docsPath));

  // Serve uploads directory
  const uploadsPath = path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Fallback to index.html for any other route (SPA behavior)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(docsPath, 'index.html'));
  });

  const PORT = process.env.PORT || 5000;
  const ENV = process.env.NODE_ENV || 'development';

  // 6. Global Production Error Boundary
  app.use(globalErrorBoundary);

  const server = app.listen(PORT, () => {
    // 15. Structured Deployment Metadata Logging
    console.log(JSON.stringify({
      version: "1.0.3",
      gitCommit: process.env.RENDER_GIT_COMMIT || "local",
      nodeEnv: ENV,
      watchdog: process.env.WORKFLOW_WATCHDOG_ENABLED === 'true',
      port: PORT,
      message: "Orchestration engine started"
    }, null, 2));
  });

  // 11. Connection Tracking & Socket Draining
  const connections = new Set();
  server.on("connection", socket => {
    connections.add(socket);
    socket.on("close", () => {
      connections.delete(socket);
    });
  });

  // 7. Graceful Shutdown Hooks
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Shutdown] Received ${signal}. Draining requests...`);
    
    // Destroy keep-alive sockets
    for (const socket of connections) {
        socket.destroy();
    }
    console.log(`[Shutdown] Destroyed ${connections.size} keep-alive sockets.`);
    
    server.close(async () => {
        console.log('[Shutdown] HTTP server closed.');
        
        try {
            console.log('[Shutdown] Stopping Watchdog...');
            watchdog.stop();
            
            console.log('[Shutdown] Closing Redis...');
            await RedisManager.client.quit();
            
            console.log('[Shutdown] Closing MongoDB...');
            await mongoose.connection.close();
            
            console.log('[Shutdown] Graceful exit complete.');
            process.exit(0);
        } catch (err) {
            console.error('[Shutdown] Error during cleanup:', err);
            process.exit(1);
        }
    });
    
    // Force exit if drain takes too long
    setTimeout(() => {
        console.error('[Shutdown] Forcefully exiting after 10s timeout.');
        process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
