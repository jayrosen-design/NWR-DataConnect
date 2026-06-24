/**
 * Express API Server for NWR Mock Data Lagoon
 * Simulates Azure Data Lagoon verification endpoint for development/testing
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as db from '../src/utils/mockDatabase.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/verify-code
 * Verify an access code and return student information
 * 
 * Request body:
 * {
 *   "code": "839210",
 *   "logicalAccountId": "A1B2C3D4E5F6G7H8" // Optional
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "valid": true,
 *   "studentId": "NWR-1001",
 *   "gradeLevel": 3,
 *   "studentName": "Alex Explorer"
 * }
 * 
 * Response (Error):
 * {
 *   "success": false,
 *   "error": "Invalid or expired code",
 *   "code": 404
 * }
 */
app.post('/api/verify-code', (req, res) => {
  const { code, logicalAccountId, firebaseUserId, firebaseDisplayName, isAnonymous } = req.body;
  
  console.log(`[API] Verify code request: code=${code}, accountId=${logicalAccountId?.substring(0, 8)}..., firebaseUser=${firebaseDisplayName || 'N/A'}`);
  
  // Validate input
  if (!code || code.length !== 6) {
    return res.status(400).json({
      success: false,
      error: 'Access code must be exactly 6 digits',
      code: 400
    });
  }
  
  // Prepare Firebase user info
  const firebaseInfo = {
    firebaseUserId: firebaseUserId || logicalAccountId,
    displayName: firebaseDisplayName || 'Unknown User',
    isAnonymous: isAnonymous !== undefined ? isAnonymous : true
  };
  
  // Attempt to link account
  const result = db.linkStudentAccount(code, logicalAccountId, firebaseInfo);
  
  if (result.success) {
    console.log(`[API] ✓ Code verified successfully: ${result.studentId} linked to ${firebaseInfo.displayName}`);
    return res.status(200).json(result);
  } else {
    console.log(`[API] ✗ Verification failed: ${result.error}`);
    return res.status(result.code === 409 ? 409 : 404).json(result);
  }
});

/**
 * GET /api/students
 * Get all students (for dashboard UI)
 */
app.get('/api/students', (req, res) => {
  const students = db.getAllStudents();
  res.json({ success: true, students });
});

/**
 * POST /api/students
 * Create a new student
 */
app.post('/api/students', (req, res) => {
  const { name, grade } = req.body;
  const newStudent = db.addStudent({ name, grade });
  console.log(`[API] Created new student: ${newStudent.id}`);
  res.status(201).json({ success: true, student: newStudent });
});

/**
 * DELETE /api/students/:id
 * Delete a student
 */
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const success = db.deleteStudent(id);
  
  if (success) {
    console.log(`[API] Deleted student: ${id}`);
    res.json({ success: true, message: 'Student deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Student not found' });
  }
});

/**
 * POST /api/students/:id/generate-code
 * Generate access code for a student (doesn't send it)
 */
app.post('/api/students/:id/generate-code', (req, res) => {
  const { id } = req.params;
  const result = db.generateAccessCode(id);
  
  if (result) {
    console.log(`[API] Generated code for ${result.student.name}: ${result.code}`);
    res.json({ 
      success: true, 
      student: result.student,
      code: result.code
    });
  } else {
    res.status(404).json({ success: false, error: 'Student not found' });
  }
});

/**
 * POST /api/students/:id/send-sms
 * Send access code via SMS
 */
app.post('/api/students/:id/send-sms', (req, res) => {
  const { id } = req.params;
  const smsMessage = db.sendCodeViaSMS(id);
  
  if (smsMessage) {
    console.log(`[API] 📱 SMS sent to parent of ${smsMessage.studentName}: ${smsMessage.code}`);
    res.json({ 
      success: true, 
      message: 'SMS sent successfully',
      smsMessage: smsMessage
    });
  } else {
    res.status(404).json({ success: false, error: 'Student not found or no code generated' });
  }
});

/**
 * POST /api/students/:id/send-email
 * Send access code via Email
 */
app.post('/api/students/:id/send-email', (req, res) => {
  const { id } = req.params;
  const emailMessage = db.sendCodeViaEmail(id);
  
  if (emailMessage) {
    console.log(`[API] 📧 Email sent to parent of ${emailMessage.studentName}: ${emailMessage.code}`);
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      emailMessage: emailMessage
    });
  } else {
    res.status(404).json({ success: false, error: 'Student not found or no code generated' });
  }
});

/**
 * GET /api/sms-log
 * Get SMS log
 */
app.get('/api/sms-log', (req, res) => {
  const log = db.getSMSLog();
  res.json({ success: true, log });
});

/**
 * GET /api/email-log
 * Get Email log
 */
app.get('/api/email-log', (req, res) => {
  const log = db.getEmailLog();
  res.json({ success: true, log });
});

/**
 * GET /api/communication-log
 * Get combined communication log (SMS + Email)
 */
app.get('/api/communication-log', (req, res) => {
  const log = db.getCommunicationLog();
  res.json({ success: true, log });
});

/**
 * POST /api/reset
 * Reset database to default state (dev only)
 */
app.post('/api/reset', (req, res) => {
  const result = db.resetDatabase();
  console.log('[API] Database reset to default state');
  res.json(result);
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'NWR Mock Data Lagoon API is running',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

/**
 * GET /
 * Root endpoint - API documentation
 */
app.get('/', (req, res) => {
  res.json({
    name: 'NWR Mock Data Lagoon API',
    version: '1.0.0',
    description: 'Mock Azure Data Lagoon API for testing NWR account linking',
    endpoints: {
      'POST /api/verify-code': 'Verify access code and link student account',
      'GET /api/students': 'Get all students',
      'POST /api/students': 'Create new student',
      'DELETE /api/students/:id': 'Delete student',
      'POST /api/students/:id/generate-code': 'Generate access code for student',
      'GET /api/sms-log': 'Get SMS log',
      'POST /api/reset': 'Reset database to default state',
      'GET /api/health': 'Health check'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 NWR Mock Data Lagoon API Server');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
  console.log(`📱 SMS endpoint: POST /api/students/:id/send-sms`);
  console.log(`📧 Email endpoint: POST /api/students/:id/send-email`);
  console.log('='.repeat(60));
  console.log('Ready to receive Unity requests! 🎮');
  console.log('');
});

export default app;
