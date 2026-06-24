/**
 * Mock in-memory database for student records and access codes
 * Used for testing the NWR account linking flow
 */

// Generate random 6-digit code
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate NWR student ID
export const generateNWRId = () => {
  return `NWR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

// In-memory student database
let students = [
  { 
    id: 'NWR-1001', 
    name: 'Alex Explorer', 
    grade: 3, 
    code: '839210', 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1002', 
    name: 'Sam Scientist', 
    grade: 4, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1003', 
    name: 'Jordan Navigator', 
    grade: 2, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1004', 
    name: 'Casey Discoverer', 
    grade: 5, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1005', 
    name: 'Morgan Adventurer', 
    grade: 3, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1006', 
    name: 'Riley Reader', 
    grade: 4, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1007', 
    name: 'Taylor Thinker', 
    grade: 2, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1008', 
    name: 'Avery Scholar', 
    grade: 5, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1009', 
    name: 'Blake Learner', 
    grade: 3, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  },
  { 
    id: 'NWR-1010', 
    name: 'Quinn Questor', 
    grade: 4, 
    code: null, 
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  }
];

// Communication logs for simulated messages
let smsLog = [];
let emailLog = [];
let communicationLog = [];

/**
 * Get all students
 */
export const getAllStudents = () => {
  return students;
};

/**
 * Get student by ID
 */
export const getStudentById = (id) => {
  return students.find(s => s.id === id);
};

/**
 * Get student by access code
 */
export const getStudentByCode = (code) => {
  return students.find(s => s.code === code);
};

/**
 * Add a new student
 */
export const addStudent = (student) => {
  const newStudent = {
    id: student.id || generateNWRId(),
    name: student.name || `Student ${students.length + 1}`,
    grade: student.grade || Math.floor(Math.random() * 5) + 1,
    code: null,
    linked: false,
    linkedAccountId: null,
    linkedDate: null
  };
  
  students.push(newStudent);
  return newStudent;
};

/**
 * Update a student
 */
export const updateStudent = (id, updates) => {
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    return students[index];
  }
  return null;
};

/**
 * Delete a student
 */
export const deleteStudent = (id) => {
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students.splice(index, 1);
    return true;
  }
  return false;
};

/**
 * Generate access code for a student
 */
export const generateAccessCode = (studentId) => {
  const student = getStudentById(studentId);
  if (!student) return null;
  
  const newCode = generateCode();
  student.code = newCode;
  student.linked = false;
  student.linkedAccountId = null;
  student.linkedDate = null;
  
  return { student, code: newCode };
};

/**
 * Send access code via SMS
 */
export const sendCodeViaSMS = (studentId) => {
  const student = getStudentById(studentId);
  if (!student || !student.code) return null;
  
  const smsMessage = {
    time: new Date().toISOString(),
    studentId: student.id,
    studentName: student.name,
    code: student.code,
    deliveryMethod: 'SMS',
    phoneNumber: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`, // Mock phone
    message: `Download AR Expeditions app from App Store (https://apps.apple.com/ar-expeditions) or Google Play (https://play.google.com/ar-expeditions), and enter code ${student.code} to connect your New Worlds Reading account.`
  };
  
  smsLog.unshift(smsMessage);
  communicationLog.unshift(smsMessage);
  
  // Keep only last 50 messages
  if (smsLog.length > 50) {
    smsLog = smsLog.slice(0, 50);
  }
  if (communicationLog.length > 50) {
    communicationLog = communicationLog.slice(0, 50);
  }
  
  return smsMessage;
};

/**
 * Send access code via Email
 */
export const sendCodeViaEmail = (studentId) => {
  const student = getStudentById(studentId);
  if (!student || !student.code) return null;
  
  const emailMessage = {
    time: new Date().toISOString(),
    studentId: student.id,
    studentName: student.name,
    code: student.code,
    deliveryMethod: 'Email',
    emailAddress: `parent.${student.id.toLowerCase()}@example.com`, // Mock email
    subject: 'AR Expeditions - Connect Your New Worlds Reading Account',
    message: `Dear Parent/Guardian,

Welcome to AR Expeditions! To connect ${student.name}'s New Worlds Reading account to the AR Expeditions app, please follow these steps:

1. Download the AR Expeditions app:
   • App Store (iOS): https://apps.apple.com/ar-expeditions
   • Google Play (Android): https://play.google.com/ar-expeditions

2. Open the app and enter your access code when prompted

3. Your New Worlds Reading account will be automatically connected!

--------------------------------------------------
Your Access Code: ${student.code}
--------------------------------------------------

This code connects ${student.name}'s progress and reading achievements to the AR experience.

Questions? Contact New Worlds Reading support at support@newworldsreading.org

Best regards,
The New Worlds Reading Team`
  };
  
  emailLog.unshift(emailMessage);
  communicationLog.unshift(emailMessage);
  
  // Keep only last 50 messages
  if (emailLog.length > 50) {
    emailLog = emailLog.slice(0, 50);
  }
  if (communicationLog.length > 50) {
    communicationLog = communicationLog.slice(0, 50);
  }
  
  return emailMessage;
};

/**
 * Link student account (mark code as used)
 */
export const linkStudentAccount = (code, accountId, firebaseInfo = {}) => {
  const student = getStudentByCode(code);
  if (!student) {
    return { success: false, error: 'Invalid or expired code', code: 404 };
  }
  
  if (student.linked) {
    return { success: false, error: 'Code already claimed', code: 409 };
  }
  
  // Mark as linked
  student.linked = true;
  student.linkedAccountId = accountId;
  student.linkedDate = new Date().toISOString();
  
  // Create claim notification
  const claimMessage = {
    time: new Date().toISOString(),
    studentId: student.id,
    studentName: student.name,
    code: student.code,
    deliveryMethod: 'Claim',
    firebaseUserId: firebaseInfo.firebaseUserId || accountId,
    displayName: firebaseInfo.displayName || 'Unknown User',
    isAnonymous: firebaseInfo.isAnonymous !== undefined ? firebaseInfo.isAnonymous : true,
    message: `Account successfully linked!

Student: ${student.name}
NWR ID: ${student.id}
Grade: ${student.grade}

Firebase User: ${firebaseInfo.displayName || 'Unknown User'}
User ID: ${firebaseInfo.firebaseUserId || accountId}
Account Type: ${firebaseInfo.isAnonymous ? 'Anonymous' : 'Authenticated'}`
  };
  
  // Add to communication log
  communicationLog.unshift(claimMessage);
  
  // Keep only last 50 messages
  if (communicationLog.length > 50) {
    communicationLog = communicationLog.slice(0, 50);
  }
  
  return {
    success: true,
    valid: true,
    studentId: student.id,
    gradeLevel: student.grade,
    studentName: student.name
  };
};

/**
 * Get SMS log
 */
export const getSMSLog = () => {
  return smsLog;
};

/**
 * Get Email log
 */
export const getEmailLog = () => {
  return emailLog;
};

/**
 * Get combined communication log
 */
export const getCommunicationLog = () => {
  // Return the unified communication log (includes SMS, Email, and Claim messages)
  return communicationLog.sort((a, b) => new Date(b.time) - new Date(a.time));
};

/**
 * Clear SMS log
 */
export const clearSMSLog = () => {
  smsLog = [];
};

/**
 * Clear Email log
 */
export const clearEmailLog = () => {
  emailLog = [];
};

/**
 * Clear all communication logs
 */
export const clearAllLogs = () => {
  smsLog = [];
  emailLog = [];
  communicationLog = [];
};

/**
 * Reset database to default state
 */
export const resetDatabase = () => {
  students = [
    { 
      id: 'NWR-1001', 
      name: 'Alex Explorer', 
      grade: 3, 
      code: '839210', 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1002', 
      name: 'Sam Scientist', 
      grade: 4, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1003', 
      name: 'Jordan Navigator', 
      grade: 2, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1004', 
      name: 'Casey Discoverer', 
      grade: 5, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1005', 
      name: 'Morgan Adventurer', 
      grade: 3, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1006', 
      name: 'Riley Reader', 
      grade: 4, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1007', 
      name: 'Taylor Thinker', 
      grade: 2, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1008', 
      name: 'Avery Scholar', 
      grade: 5, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1009', 
      name: 'Blake Learner', 
      grade: 3, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    },
    { 
      id: 'NWR-1010', 
      name: 'Quinn Questor', 
      grade: 4, 
      code: null, 
      linked: false,
      linkedAccountId: null,
      linkedDate: null
    }
  ];
  smsLog = [];
  emailLog = [];
  communicationLog = [];
  return { success: true, message: 'Database reset to default state' };
};
