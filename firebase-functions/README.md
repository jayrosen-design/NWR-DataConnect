# Firebase Cloud Functions

Firebase Cloud Function templates for NWR Data Connect.

Full setup, deployment, API contract, and troubleshooting documentation is in the project root README:

**[../README.md#firebase-cloud-function](../README.md#firebase-cloud-function)**

Quick start:

```bash
cd firebase-functions
npm install
firebase deploy --only functions:claimStudentProfile
```

Main function: `claimStudentProfile` — see [`claimStudentProfile.js`](claimStudentProfile.js).
