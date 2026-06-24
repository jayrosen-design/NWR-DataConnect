# NWR Data Connect

Integration toolkit for linking **New Worlds Reading (NWR)** student profiles to the **AR Expeditions** Unity mobile app via 6-digit access codes.

This repository provides a local development environment (mock Data Lagoon web app and API) and a Firebase Cloud Function template for production. Unity game scripts live in the separate **AR Expeditions** Unity project — this repo documents how to connect them.

**Audience:** Developers, QA engineers, and NWR integration partners.

---

## Table of Contents

1. [What This Repo Contains](#what-this-repo-contains)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Using the Mock Dashboard](#using-the-mock-dashboard)
5. [AR Expeditions Integration](#ar-expeditions-integration)
6. [API Reference](#api-reference)
7. [Firebase Cloud Function](#firebase-cloud-function)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Project Structure](#project-structure)
11. [Further Reference](#further-reference)

---

## What This Repo Contains

| Component | Path | Role |
|-----------|------|------|
| Mock Data Lagoon (web app + API) | [`mock-dashboard/`](mock-dashboard/) | Dev/test substitute for Azure Data Lagoon |
| Firebase Cloud Function template | [`firebase-functions/`](firebase-functions/) | Production verification bridge between Unity and NWR |
| Planning docs (pre-web-app) | [`resources/`](resources/) | Architecture, TRD, risk assessment — historical reference |

### What lives elsewhere

The AR Expeditions Unity project contains the client-side integration:

| Component | Unity path | Purpose |
|-----------|------------|---------|
| `NWRAccountLinker.cs` | `Assets/Ocean AR/Scripts/` | Core linking logic, dev/prod mode switching |
| `NWRTestUI.cs` | `Assets/Ocean AR/Scripts/` | Test UI for device and editor testing |
| `FirebaseManager.cs` | `Assets/Ocean AR/Scripts/` | Auth and Firestore sync; stores `linkedStudentId` |
| `GameSaveManager.cs` | `Assets/Ocean AR/Scripts/` | Local save data with NWR linking fields |
| NWR Test Scene | `Assets/Ocean AR/Scenes/NWR_TestScene.unity` | Dedicated scene for integration testing |

### How linking works (summary)

1. NWR generates a unique 6-digit code mapped to a student record.
2. The code is delivered to a parent/guardian (SMS or email).
3. The parent opens AR Expeditions and enters the code on the account linking screen.
4. The app verifies the code against NWR (mock server in dev, Firebase + Azure in prod).
5. On success, the game account is linked to the NWR student ID; progress can sync to Firebase and the Data Lagoon.

---

## Architecture

### System overview

```mermaid
flowchart TB
    subgraph nwr [NWR_DataLagoon]
        CodeGen[GenerateAccessCode]
        StudentDB[(StudentRecords)]
        SMSGateway[SMS_Email_Gateway]
        CodeGen --> StudentDB
        StudentDB --> SMSGateway
    end

    subgraph dataconnect [NWR_DataConnect_ThisRepo]
        MockDash[MockDashboard]
        MockAPI[ExpressAPI]
        CloudFunc[claimStudentProfile]
        MockDash --> MockAPI
    end

    subgraph firebase [Firebase_Production]
        FBAuth[FirebaseAuth]
        Firestore[(Firestore)]
        CloudFunc --> FBAuth
        CloudFunc --> Firestore
    end

    subgraph game [AR_Expeditions_Unity]
        AppUI[AccountLinkingUI]
        Linker[NWRAccountLinker]
        GameSave[GameSaveManager]
        AppUI --> Linker
        Linker --> GameSave
    end

    Parent[ParentGuardian]
    SMSGateway -.->|code delivery| Parent
    Parent --> AppUI
    Linker -->|dev mode| MockAPI
    Linker -->|prod mode| CloudFunc
    MockAPI --> StudentDB
    CloudFunc -->|prod verify| StudentDB
```

In **development**, the mock Express API replaces Azure. In **production**, Unity calls the `claimStudentProfile` Cloud Function, which verifies codes against the real Azure Data Lagoon API.

### Development flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Dash as MockDashboard
    participant API as ExpressAPI_port3001
    participant Unity as AR_Expeditions_Unity
    participant Log as CommunicationLog

    Dev->>Dash: Generate code for student
    Dev->>Dash: Send SMS or Email
    Dash->>API: POST generate-code / send-sms
    API->>Log: Record simulated message
    Dev->>Log: Copy 6-digit code
    Dev->>Unity: Enter code in NWR Test Scene
    Unity->>API: POST /api/verify-code
    API->>API: Validate code in memory DB
    API-->>Unity: studentId, gradeLevel, studentName
    API->>Log: Record Claim entry
    Unity->>Unity: Update GameSaveManager
```

**Ports:**
- React dashboard: `http://localhost:3000` (Vite; proxies `/api` to port 3001)
- Express API: `http://localhost:3001`

### Production flow

```mermaid
sequenceDiagram
    participant Parent as ParentGuardian
    participant Azure as Azure_DataLagoon
    participant SMS as SMS_Gateway
    participant Unity as AR_Expeditions_Unity
    participant CF as claimStudentProfile
    participant FS as Firestore

    Azure->>SMS: Send access code
    SMS->>Parent: SMS or email with code
    Parent->>Unity: Enter code in app
    Unity->>CF: Callable function with Firebase auth token
    CF->>CF: Rate limit check
    CF->>Azure: POST /verify-code with API key
    Azure-->>CF: studentId, gradeLevel, studentName
    CF->>FS: Write linkedStudentId to user profile
    CF-->>Unity: success response
    Unity->>Unity: Update local save and unlock content
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- AR Expeditions Unity project (for end-to-end testing)
- Firebase project (for production deployment only)

### Start the mock dashboard

```bash
cd mock-dashboard
npm install
npm run dev
```

This starts:
- Vite dev server at `http://localhost:3000` (opens in browser)
- Express API at `http://localhost:3001`

Verify the API is running:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "NWR Mock Data Lagoon API is running",
  "timestamp": "...",
  "environment": "development"
}
```

### Run API server only

```bash
cd mock-dashboard
npm run server
```

Use this when testing Unity against the API without the React UI.

### 2-minute smoke test

1. Open `http://localhost:3000`
2. In **Database Manager**, find **Alex Explorer** (pre-loaded code: `839210`)
3. Go to **API Tester**, enter `839210`, click **Test Verify Code**
4. Confirm success response and a **Claim** entry in the Communication Log

---

## Using the Mock Dashboard

The mock dashboard simulates the Azure Data Lagoon for local development. It runs two processes: a React UI (port 3000) and an Express API (port 3001) that implements the same verification contract as production.

### Dashboard tabs

| Tab | Purpose | Key actions |
|-----|---------|-------------|
| **Database Manager** | Student CRUD, code generation, delivery | Add/delete students, Generate code, Send SMS, Send Email |
| **API Tester** | Browser-based verification test | Enter 6-digit code, view JSON response |
| **Integration Guide** | In-app quick reference | Unity `NWRAccountLinker` configuration values |

### Database Manager workflow

1. **Add Student** — creates a mock NWR student record with a generated ID (e.g. `NWR-1042`).
2. **Generate Code** (refresh icon) — assigns a random 6-digit access code to the student. Does not send it.
3. **Send SMS** — simulates a text message to a mock phone number; logs the message with the code.
4. **Send Email** — simulates an email to a mock parent address with full instructions and the code.
5. **Delete** — removes a student from the in-memory database.
6. **Reset Database** (header) — restores the default 10 students and clears all logs.

### Communication Log

The left panel shows all simulated outbound messages and successful claim events:

| Border color | Type | Meaning |
|--------------|------|---------|
| Green | SMS | Simulated text message to parent |
| Purple | Email | Simulated email with download links and code |
| Blue | Claim | Code verified and account linked (from API or Unity) |

The log auto-refreshes every 3 seconds.

### Default test data

On startup (and after reset), the database includes 10 students. **Alex Explorer** (`NWR-1001`, grade 3) ships with access code **`839210`** for immediate testing.

### API Tester

Simulates what the Unity client does when a user submits a code:

- Sends `POST /api/verify-code` with a test `logicalAccountId`
- Displays HTTP status and full JSON response
- On success, marks the student as linked in the Database Manager

---

## AR Expeditions Integration

### Unity configuration — Development mode

In the AR Expeditions Unity project, open the NWR Test Scene and configure the **NWRAccountLinker** component:

```
isDevelopmentMode:     true
mockServerUrl:         http://localhost:3001/api/verify-code
cloudFunctionName:     claimStudentProfile
enableDebugLogging:    true
```

> **Physical device testing:** A phone cannot reach `localhost` on your PC. Use your machine's LAN IP (e.g. `http://192.168.1.100:3001/api/verify-code`) and ensure the device is on the same network. The mock server binds to all interfaces by default.

### Unity configuration — Production mode

```
isDevelopmentMode:     false
cloudFunctionName:     claimStudentProfile
enableDebugLogging:    false
```

Unity calls the deployed `claimStudentProfile` Firebase Callable function. The function verifies the code with Azure and writes the link to Firestore.

### End-to-end developer test flow

1. Start the mock dashboard: `cd mock-dashboard && npm run dev`
2. Open `http://localhost:3000` → **Database Manager**
3. Click **Generate Code** for a student (or use Alex Explorer's `839210`)
4. Optionally click **Send SMS** or **Send Email** and copy the code from the Communication Log
5. In Unity, open the NWR Test Scene and enter Play mode
6. Enter the 6-digit code and click **Verify Code** / **Link Account**
7. Confirm:
   - Unity debug log shows successful link with student ID and grade
   - Dashboard student row shows **Linked**
   - Communication Log shows a blue **Claim** entry

Expected Unity log output:

```
[NWRAccountLinker] Attempting to link account with code: 839210
[NWRAccountLinker] Calling mock server at http://localhost:3001/api/verify-code
[NWRAccountLinker] Mock server response: {"success":true,"valid":true,...}
[NWRAccountLinker] Successfully linked account to student NWR-1001 (Grade 3)
```

### Parent / user flow (production)

1. NWR generates a code for the student's record in Azure Data Lagoon.
2. Parent receives SMS or email with the code and AR Expeditions download links.
3. Parent downloads AR Expeditions (iOS/Android), creates or loads a game profile.
4. Parent or student enters the code on the account linking screen.
5. App verifies via Firebase Cloud Function → Azure API.
6. Linked content unlocks; gameplay progress syncs through Firebase.

Simulated message content (dev) matches production intent — see `mock-dashboard/src/utils/mockDatabase.js` for SMS and email templates.

### Unity data fields after linking

**FirebaseManager / AccountInfo:**

```csharp
public string linkedStudentId = "";
public bool isNWRLinked = false;
```

**GameSaveManager / GameSaveData:**

```csharp
public string nwrUserId = "";
public bool isNWRLinked = false;
public DateTime nwrLinkDate = DateTime.MinValue;
public DateTime lastNWRSync = DateTime.MinValue;
```

---

## API Reference

The mock API implements the verification contract that Azure Data Lagoon must provide in production. Base URL: `http://localhost:3001`

### POST /api/verify-code

Verify an access code and link it to a game account. Called by Unity (dev mode) or by the Cloud Function (dev/prod).

**Request:**

```json
{
  "code": "839210",
  "logicalAccountId": "A1B2C3D4E5F6G7H8",
  "firebaseUserId": "optional-firebase-uid",
  "firebaseDisplayName": "optional-display-name",
  "isAnonymous": true
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `code` | Yes | Exactly 6 numeric digits |
| `logicalAccountId` | No | Game account ID to associate with the link |
| `firebaseUserId` | No | Firebase UID (logged in Communication Log on claim) |
| `firebaseDisplayName` | No | Display name for claim log entry |
| `isAnonymous` | No | Whether the Firebase account is anonymous (default: `true`) |

**Success (200):**

```json
{
  "success": true,
  "valid": true,
  "studentId": "NWR-1001",
  "gradeLevel": 3,
  "studentName": "Alex Explorer"
}
```

**Errors:**

| Status | Body `error` | Cause |
|--------|--------------|-------|
| 400 | `Access code must be exactly 6 digits` | Invalid code format |
| 404 | `Invalid or expired code` | Code not found |
| 409 | `Code already claimed` | Code was already used |

### Dashboard management endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/students` | List all students |
| `POST` | `/api/students` | Create student `{ "name": "...", "grade": 3 }` |
| `DELETE` | `/api/students/:id` | Delete student by NWR ID |
| `POST` | `/api/students/:id/generate-code` | Generate 6-digit code for student |
| `POST` | `/api/students/:id/send-sms` | Simulate SMS delivery |
| `POST` | `/api/students/:id/send-email` | Simulate email delivery |
| `GET` | `/api/communication-log` | Combined SMS, email, and claim log |
| `GET` | `/api/sms-log` | SMS log only |
| `GET` | `/api/email-log` | Email log only |
| `POST` | `/api/reset` | Reset database to defaults |

### Example: verify with cURL

```bash
curl -X POST http://localhost:3001/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"code":"839210","logicalAccountId":"TEST_ACCOUNT_12345678"}'
```

---

## Firebase Cloud Function

Template location: [`firebase-functions/claimStudentProfile.js`](firebase-functions/claimStudentProfile.js)

### claimStudentProfile

**Type:** HTTPS Callable (invoked from Unity via Firebase SDK)

**Authentication:** Required — caller must be signed in to Firebase.

**Inputs:**

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | 6-digit access code |
| `logicalAccountId` | string | Game profile ID to link |

**Process:**

1. Validate auth and input
2. Rate limit: max 5 attempts per minute per user
3. Reject if profile already has `linkedStudentId`
4. Call external API (mock in dev, Azure in prod)
5. Write link data to Firestore
6. Return student info to Unity

**Success response:**

```json
{
  "success": true,
  "studentId": "NWR-1001",
  "gradeLevel": 3,
  "studentName": "Alex Explorer",
  "linkedDate": "2026-01-13T12:00:00.000Z"
}
```

**Error codes:**

| Code | Meaning |
|------|---------|
| `unauthenticated` | User not signed in |
| `invalid-argument` | Bad code or missing account ID |
| `resource-exhausted` | Rate limit exceeded |
| `already-exists` | Account already linked |
| `not-found` | Invalid or expired code |
| `unavailable` | External API unreachable |
| `internal` | Unexpected error |

### Firestore structure after linking

```
users/
  {authUid}/
    profiles/
      {logicalAccountId}/
        linkedStudentId: "NWR-1001"
        linkedStudentName: "Alex Explorer"
        gradeLevel: 3
        linkedDate: {timestamp}
        logicalAccountId: "..."
        authUid: "..."
```

### Setup and deployment

```bash
cd firebase-functions
npm install

# Development config
firebase functions:config:set nwr.environment="dev"
firebase functions:config:set nwr.mock_api_url="http://localhost:3001/api/verify-code"

# Production config
firebase functions:config:set nwr.environment="prod"
firebase functions:config:set nwr.azure_api_url="https://your-azure-endpoint/api/verify-code"
firebase functions:config:set nwr.azure_api_key="your-secure-api-key"

# Deploy
firebase deploy --only functions:claimStudentProfile
```

### Test with cURL (production endpoint)

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/claimStudentProfile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{"data":{"code":"839210","logicalAccountId":"A1B2C3D4E5F6G7H8"}}'
```

### Local emulator

```bash
firebase emulators:start --only functions
```

Emulator runs at `http://localhost:5001`.

---

## Testing Checklist

Condensed from the full scenario document in [`resources/archive/TESTING_SCENARIOS.md`](resources/archive/TESTING_SCENARIOS.md).

**Before testing:** mock dashboard running (`npm run dev`), Unity NWR Test Scene open, `NWRAccountLinker` in Development Mode, at least one game account created.

| # | Scenario | Steps | Expected result |
|---|----------|-------|-----------------|
| 1 | Happy path — valid code | Generate code → enter in Unity → Verify | Link success; student shows Linked; Claim in log |
| 2 | Invalid code format | Enter 5 or 7 digits | Validation error before API call |
| 3 | Invalid code (not found) | Enter `999999` | 404 `Invalid or expired code` |
| 4 | Code already used | Link once, retry same code | 409 `Code already claimed` |
| 5 | Network unavailable | Stop mock server, verify in Unity | Connection error in Unity log |
| 6 | Multiple accounts | Link two accounts to two different codes | Each account has distinct `nwrUserId` |
| 7 | Account persistence | Link, exit Play mode, re-enter | Link status and student ID persist |
| 8 | Rate limiting | 6+ failed attempts in 1 min (prod/CF) | `resource-exhausted` error |
| 9 | Offline queueing | Disconnect network, enter code, reconnect | Queued request processes when online |
| 10 | Server timeout | Simulate slow API (>10s) | Timeout error returned to client |
| 11 | Account switch | Link account A, switch to B, verify status | Each account shows correct link state |
| 12 | Unlink and re-link | Unlink in dev UI, generate new code, re-link | Successful re-link with new code |

### Quick 2-minute test

- [ ] `curl http://localhost:3001/api/health` returns success
- [ ] Generate code for a student in Database Manager
- [ ] Send SMS — green entry appears in Communication Log
- [ ] Send Email — purple entry appears in Communication Log
- [ ] Enter code in Unity NWR Test Scene
- [ ] Verify link success in Unity log and dashboard

---

## Troubleshooting

### Port already in use (`EADDRINUSE`)

Port 3001 is used by the Express API.

```powershell
# Windows — find process on port 3001
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /F /PID <PID>

# Restart
cd mock-dashboard
npm run dev
```

### React dashboard not loading

- Confirm Vite started on port 3000 (check terminal output)
- Try `http://localhost:3000` directly
- Clear browser cache

### Unity cannot connect to mock server

- Verify API health: `http://localhost:3001/api/health`
- Confirm `mockServerUrl` matches the running API URL
- **Physical device:** use LAN IP, not `localhost`
- Check firewall allows inbound connections on port 3001
- Ensure mock dashboard is running (`npm run dev` starts both Vite and Express)

### API returns 409 (code already claimed)

Codes are single-use. Generate a new code for the student in Database Manager, or click **Reset Database** to restore defaults.

### CORS errors in browser

CORS is enabled on the Express server. If testing from a non-proxied origin, ensure requests go to port 3001 directly or through the Vite proxy at port 3000 (`/api/*`).

### Firebase Cloud Function errors

- `unauthenticated` — ensure Unity user is signed in before calling
- `failed-precondition` — Azure API URL/key not configured in prod
- `unavailable` — Azure endpoint unreachable; check URL and network
- View logs: `firebase functions:log --only claimStudentProfile`

### Student data disappeared

The mock database is in-memory. Data resets when the Express server restarts. Use **Reset Database** to restore the default 10 students.

---

## Project Structure

```
NWR_DataConnect/
├── README.md                      # This document
├── mock-dashboard/                # React + Express mock Data Lagoon
│   ├── src/
│   │   ├── App.jsx                # Main dashboard (tabs, polling)
│   │   ├── components/
│   │   │   ├── StudentTable.jsx   # Student management UI
│   │   │   ├── SMSLog.jsx         # Communication log panel
│   │   │   ├── APITester.jsx      # Verification endpoint tester
│   │   │   └── IntegrationGuide.jsx
│   │   └── utils/
│   │       └── mockDatabase.js    # In-memory student database
│   ├── server/
│   │   └── api.js                 # Express API (port 3001)
│   ├── vite.config.js             # Vite proxy: /api → 3001
│   └── package.json
├── firebase-functions/
│   ├── claimStudentProfile.js     # Cloud Function template
│   └── package.json
└── resources/                     # Pre-build planning documents
    ├── archive/                   # Superseded detailed guides
    ├── TRD1.2.md
    ├── nwr-dataflow.md
    ├── mock-server-integration.md
    └── comprehensive-architecture-diagram.md
```

---

## Further Reference

The [`resources/`](resources/) folder contains planning documents created before the web app was built. They provide additional architectural depth:

| Document | Contents |
|----------|----------|
| [`resources/TRD1.2.md`](resources/TRD1.2.md) | Technical requirements document |
| [`resources/nwr-dataflow.md`](resources/nwr-dataflow.md) | Ticket claim flow and nightly research data sync |
| [`resources/mock-server-integration.md`](resources/mock-server-integration.md) | Detailed dev vs prod integration architecture |
| [`resources/comprehensive-architecture-diagram.md`](resources/comprehensive-architecture-diagram.md) | Security boundaries, risk levels, compliance notes |
| [`resources/risk-assessment-architecture.md`](resources/risk-assessment-architecture.md) | Risk assessment detail |
| [`resources/archive/INTEGRATION_GUIDE.md`](resources/archive/INTEGRATION_GUIDE.md) | Full integration guide (archived) |
| [`resources/archive/TESTING_SCENARIOS.md`](resources/archive/TESTING_SCENARIOS.md) | Detailed 12-scenario QA document (archived) |

---

**Status:** Development environment ready for integration testing  
**Last updated:** June 2026
