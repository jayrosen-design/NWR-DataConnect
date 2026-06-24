import React, { useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function APITester({ apiBaseUrl, onStudentLinked }) {
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestVerify = async () => {
    if (testCode.length !== 6) {
      setTestResult({
        success: false,
        error: 'Code must be exactly 6 digits',
        code: 400
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(`${apiBaseUrl}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: testCode,
          logicalAccountId: 'TEST_ACCOUNT_12345678'
        })
      });

      const data = await response.json();
      setTestResult({
        status: response.status,
        ...data
      });
      
      // If verification was successful, refresh student list
      if (data.success && onStudentLinked) {
        onStudentLinked();
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: `Network error: ${error.message}`,
        status: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-bold text-lg text-slate-800 mb-4">
        Verification Endpoint Tester
      </h2>
      <p className="text-slate-600 mb-6 text-sm">
        Use this tool to simulate the Unity Client sending a code to the verification endpoint.
      </p>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Enter 6-Digit Code
          </label>
          <input 
            type="text" 
            maxLength={6}
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 839210"
            className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xl tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button 
          onClick={handleTestVerify}
          disabled={isLoading || testCode.length < 6}
          className="w-full bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>Test Verify Code</>
          )}
        </button>

        {/* Test Results */}
        {testResult && (
          <div className={`mt-6 p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className={`font-bold ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success 
                    ? `Success (${testResult.status || 200} OK)` 
                    : `Error (${testResult.status || testResult.code})`
                  }
                </h4>
                <p className={`text-sm mt-1 ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.error || 'Verification successful.'}
                </p>
                {testResult.success && (
                  <div className="mt-3 bg-white/50 p-3 rounded text-xs">
                    <div className="font-mono text-slate-700 space-y-1">
                      <div><span className="font-bold">Student ID:</span> {testResult.studentId}</div>
                      <div><span className="font-bold">Grade Level:</span> {testResult.gradeLevel}</div>
                      <div><span className="font-bold">Student Name:</span> {testResult.studentName}</div>
                    </div>
                  </div>
                )}
                <pre className="mt-3 bg-white/50 p-2 rounded text-xs font-mono overflow-x-auto text-slate-700">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* cURL Example */}
        <div className="mt-6 p-4 bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-400 mb-2">Example cURL command:</div>
          <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`curl -X POST ${apiBaseUrl}/verify-code \\
  -H "Content-Type: application/json" \\
  -d '{"code": "${testCode || '839210'}", "logicalAccountId": "A1B2C3D4"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
