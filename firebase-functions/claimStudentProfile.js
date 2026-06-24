/**
 * Firebase Cloud Function: claimStudentProfile
 * 
 * Purpose: Link a game account to a New Worlds Reading student profile via access code
 * 
 * This is a TEMPLATE for the actual Cloud Function to be deployed to Firebase.
 * When ready to deploy, move this file to your Firebase Functions directory.
 * 
 * Deployment Steps:
 * 1. Initialize Firebase Functions: firebase init functions
 * 2. Copy this file to functions/index.js (or create as a separate function)
 * 3. Install dependencies: npm install axios
 * 4. Deploy: firebase deploy --only functions:claimStudentProfile
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK (only once)
// admin.initializeApp();

/**
 * Claim Student Profile - Link game account to NWR student ID
 * 
 * @param {Object} data - Request data from Unity client
 * @param {string} data.code - 6-digit access code
 * @param {string} data.logicalAccountId - Firebase account ID to link
 * @param {Object} context - Firebase Functions context (contains auth info)
 * 
 * @returns {Object} Result with student information or error
 */
exports.claimStudentProfile = functions.https.onCall(async (data, context) => {
  // --- VALIDATION ---
  
  // Check authentication (require user to be signed in)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to link account'
    );
  }

  const { code, logicalAccountId } = data;
  const authUid = context.auth.uid;

  // Validate input
  if (!code || typeof code !== 'string' || code.length !== 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Access code must be exactly 6 digits'
    );
  }

  if (!logicalAccountId || typeof logicalAccountId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Logical account ID is required'
    );
  }

  // --- RATE LIMITING ---
  
  const db = admin.firestore();
  const rateLimitRef = db.collection('rate_limits').doc(authUid);
  
  try {
    const rateLimitDoc = await rateLimitRef.get();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxAttempts = 5; // Max 5 attempts per minute

    if (rateLimitDoc.exists) {
      const data = rateLimitDoc.data();
      const attempts = data.attempts || [];
      
      // Filter attempts within the time window
      const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
      
      if (recentAttempts.length >= maxAttempts) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many verification attempts. Please wait a minute and try again.'
        );
      }
      
      // Update rate limit document
      await rateLimitRef.update({
        attempts: [...recentAttempts, now]
      });
    } else {
      // Create rate limit document
      await rateLimitRef.set({
        attempts: [now],
        userId: authUid
      });
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw rate limit errors
    }
    // Log other errors but don't fail the request
    console.error('Rate limiting error:', error);
  }

  // --- CHECK IF ALREADY LINKED ---
  
  const userProfileRef = db.collection('users').doc(authUid)
                          .collection('profiles').doc(logicalAccountId);
  
  const profileDoc = await userProfileRef.get();
  
  if (profileDoc.exists && profileDoc.data().linkedStudentId) {
    throw new functions.https.HttpsError(
      'already-exists',
      'This account is already linked to a student profile'
    );
  }

  // --- VERIFY CODE WITH EXTERNAL API ---
  
  // Determine which API to call based on environment
  const environment = functions.config().nwr?.environment || 'dev';
  let apiUrl, apiKey;
  
  if (environment === 'dev' || environment === 'development') {
    // Development mode - use mock server
    apiUrl = functions.config().nwr?.mock_api_url || 'http://localhost:3001/api/verify-code';
    apiKey = 'dev-key'; // No real auth for mock server
    
    console.log('[DEV MODE] Using mock server:', apiUrl);
  } else {
    // Production mode - use Azure Data Lagoon
    apiUrl = functions.config().nwr?.azure_api_url;
    apiKey = functions.config().nwr?.azure_api_key;
    
    if (!apiUrl || !apiKey) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Azure API credentials not configured'
      );
    }
    
    console.log('[PROD MODE] Using Azure Data Lagoon');
  }

  let verificationResult;
  
  try {
    const response = await axios.post(apiUrl, {
      code: code,
      logicalAccountId: logicalAccountId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      timeout: 10000 // 10 second timeout
    });

    verificationResult = response.data;
    
    // Check if verification was successful
    if (!verificationResult.success || !verificationResult.valid) {
      throw new functions.https.HttpsError(
        'not-found',
        verificationResult.error || 'Invalid or expired access code'
      );
    }

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Handle axios errors
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      throw new functions.https.HttpsError(
        'internal',
        errorData.error || 'Failed to verify access code',
        { statusCode: error.response.status }
      );
    } else if (error.request) {
      // Request was made but no response
      throw new functions.https.HttpsError(
        'unavailable',
        'Could not reach verification service. Please try again later.'
      );
    } else {
      // Other errors
      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred during verification'
      );
    }
  }

  // --- UPDATE FIRESTORE ---
  
  const studentId = verificationResult.studentId;
  const gradeLevel = verificationResult.gradeLevel;
  const studentName = verificationResult.studentName;

  try {
    // Update user profile with linked student ID
    await userProfileRef.set({
      linkedStudentId: studentId,
      linkedStudentName: studentName, // Optional: for display purposes
      gradeLevel: gradeLevel,
      linkedDate: admin.firestore.FieldValue.serverTimestamp(),
      logicalAccountId: logicalAccountId,
      authUid: authUid
    }, { merge: true });

    // Also update the main user document
    await db.collection('users').doc(authUid).set({
      lastLinkedProfile: logicalAccountId,
      lastLinkedStudent: studentId,
      lastUpdateDate: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Successfully linked account ${logicalAccountId} to student ${studentId}`);

  } catch (error) {
    console.error('Firestore update error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to save link information. Please try again.'
    );
  }

  // --- LOG TO ANALYTICS ---
  
  // Note: Firebase Analytics events are automatically logged for Cloud Functions
  // You can also manually log custom events if needed

  // --- RETURN SUCCESS ---
  
  return {
    success: true,
    studentId: studentId,
    gradeLevel: gradeLevel,
    studentName: studentName,
    linkedDate: new Date().toISOString()
  };
});

/**
 * Configuration Required:
 * 
 * Run these commands to set configuration:
 * 
 * Development:
 * firebase functions:config:set nwr.environment="dev"
 * firebase functions:config:set nwr.mock_api_url="http://localhost:3001/api/verify-code"
 * 
 * Production:
 * firebase functions:config:set nwr.environment="prod"
 * firebase functions:config:set nwr.azure_api_url="https://your-azure-endpoint/api/verify-code"
 * firebase functions:config:set nwr.azure_api_key="your-secure-api-key"
 * 
 * View current config:
 * firebase functions:config:get
 */

/**
 * Testing this function locally:
 * 
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize functions: firebase init functions
 * 4. Copy this file to functions/ directory
 * 5. Run locally: firebase emulators:start
 * 6. Test from Unity with emulator URL
 */
