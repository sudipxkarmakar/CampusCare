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

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/teacher', teacherRoutes);

// Serve static assets from 'docs' (formerly client)
// The docs folder is one level up from server/src (server/../docs -> ../../docs)
const docsPath = path.join(__dirname, '../../docs');
app.use(express.static(docsPath));

// Fallback to index.html for any other route (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(docsPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
