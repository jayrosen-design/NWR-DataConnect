import React from 'react';
import { Code, CheckCircle, AlertTriangle } from 'lucide-react';

export default function IntegrationGuide() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
        <Code className="w-5 h-5" />
        Unity Integration Guide
      </h2>

      <div className="space-y-6 text-sm">
        
        {/* Quick Setup */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Quick Setup
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Open the <code className="bg-slate-100 px-1 rounded">NWR Test Scene</code> in Unity</li>
            <li>Locate the <code className="bg-slate-100 px-1 rounded">NWRAccountLinker</code> component</li>
            <li>Enable <strong>Development Mode</strong></li>
            <li>Set Mock Server URL to: <code className="bg-slate-100 px-1 rounded">http://localhost:3001/api/verify-code</code></li>
            <li>Run this dashboard (npm run dev)</li>
            <li>Test in Unity Play mode</li>
          </ol>
        </div>

        {/* Configuration */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">NWRAccountLinker Configuration</h4>
          <div className="space-y-1 text-blue-800 text-xs font-mono">
            <div><span className="text-blue-600">isDevelopmentMode:</span> true</div>
            <div><span className="text-blue-600">mockServerUrl:</span> "http://localhost:3001/api/verify-code"</div>
            <div><span className="text-blue-600">cloudFunctionName:</span> "claimStudentProfile"</div>
            <div><span className="text-blue-600">enableDebugLogging:</span> true</div>
          </div>
        </div>

        {/* Testing Flow */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2">Testing Flow</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Go to <strong>Database Manager</strong> tab in this dashboard</li>
            <li>Click <strong>Generate Code</strong> for a student (e.g., Alex Explorer)</li>
            <li>Copy the 6-digit code from the table</li>
            <li>In Unity, enter the code in the NWR Test Scene</li>
            <li>Click <strong>Link Account</strong></li>
            <li>Verify the account is linked successfully</li>
          </ol>
        </div>

        {/* API Endpoints */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2">API Endpoints</h3>
          <div className="space-y-2">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-mono text-xs">
                <span className="text-green-600 font-bold">POST</span>{' '}
                <span className="text-slate-700">http://localhost:3001/api/verify-code</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">Verify access code and link account</div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-mono text-xs">
                <span className="text-blue-600 font-bold">GET</span>{' '}
                <span className="text-slate-700">http://localhost:3001/api/health</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">Check if server is running</div>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-1">Development Only</h4>
              <p className="text-yellow-800 text-xs">
                This mock server is for testing only. In production, Unity will call Firebase Cloud Functions instead, which will then communicate with the real Azure Data Lagoon.
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2">Troubleshooting</h3>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-bold text-slate-700 mb-1">Unity can't connect to server</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Verify this dashboard is running (npm run dev)</li>
                <li>Check console for "Server running on: http://localhost:3001"</li>
                <li>Test endpoint: <code className="bg-white px-1">curl http://localhost:3001/api/health</code></li>
                <li>Ensure firewall allows localhost connections</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-bold text-slate-700 mb-1">Code already claimed error</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Each code can only be used once</li>
                <li>Generate a new code for the same student</li>
                <li>Or click "Reset Database" to start fresh</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-bold text-slate-700 mb-1">Invalid code error</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Verify the code was generated in this dashboard</li>
                <li>Check that you copied all 6 digits correctly</li>
                <li>Codes are case-sensitive and numeric only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Production Notes */}
        <div className="bg-slate-100 p-4 rounded-lg">
          <h4 className="font-bold text-slate-800 mb-2">Production Deployment Notes</h4>
          <p className="text-slate-600 text-xs mb-2">
            When deploying to production, follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
            <li>Deploy Firebase Cloud Function <code className="bg-white px-1">claimStudentProfile</code></li>
            <li>Configure Firebase Function with Azure API credentials</li>
            <li>In Unity, set <code className="bg-white px-1">isDevelopmentMode = false</code></li>
            <li>Test with Firebase Test Lab before release</li>
            <li>Monitor Firebase Console for errors</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
