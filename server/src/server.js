import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

// ... imports

dotenv.config({ path: path.join(__dirname, '../.env') });

const startServer = async () => {
  await connectDB();

  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // Request logger (Disabled to reduce noise)
  // app.use((req, res, next) => {
  //   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  //   next();
  // });

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
  const uploadsPath = path.join(__dirname, '../../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Fallback to index.html for any other route (SPA behavior)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(docsPath, 'index.html'));
  });

  const PORT = process.env.PORT || 5000;
  const ENV = process.env.NODE_ENV || 'development';

  app.listen(PORT, () => {
    console.log(`Server running in ${ENV} mode on port ${PORT}`);
  });
};

startServer();
