import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import StudentTable from './components/StudentTable';
import SMSLog from './components/SMSLog';
import APITester from './components/APITester';
import IntegrationGuide from './components/IntegrationGuide';

// Use relative path for API calls - Vite will proxy to Express server
const API_BASE_URL = '/api';

export default function App() {
  const [students, setStudents] = useState([]);
  const [communicationLog, setCommunicationLog] = useState([]);
  const [activeTab, setActiveTab] = useState('database'); // 'database', 'tester', 'guide'
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    loadStudents();
    loadCommunicationLog();
    
    // Poll for updates every 3 seconds (both students and communication log)
    const interval = setInterval(() => {
      loadStudents();
      loadCommunicationLog();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunicationLog = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/communication-log`);
      const data = await response.json();
      if (data.success) {
        setCommunicationLog(data.log);
      }
    } catch (error) {
      console.error('Failed to load communication log:', error);
    }
  };

  const handleAddStudent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Student ${students.length + 1}`,
          grade: Math.floor(Math.random() * 5) + 1
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadStudents();
      }
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        await loadStudents();
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  const handleGenerateCode = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/generate-code`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        await loadStudents();
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
    }
  };

  const handleSendSMS = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/send-sms`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        await loadCommunicationLog();
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  };

  const handleSendEmail = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/send-email`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        await loadCommunicationLog();
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Reset database to default state? This will clear all students and SMS logs.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/reset`, {
          method: 'POST'
        });
        
        const data = await response.json();
        if (data.success) {
          await loadStudents();
          await loadCommunicationLog();
        }
      } catch (error) {
        console.error('Failed to reset database:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 border-b border-blue-800">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-300" />
              <h1 className="text-xl font-bold">Data Lagoon Mock Server</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-blue-200 bg-blue-800 px-3 py-1 rounded-full">
                Environment: Test / Dev
              </div>
              <button
                onClick={handleResetDatabase}
                className="text-xs text-blue-200 hover:text-white underline"
              >
                Reset Database
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 px-4 py-2">
            <button 
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === 'database' 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              Database Manager
            </button>
            <button 
              onClick={() => setActiveTab('tester')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === 'tester' 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              API Tester
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === 'guide' 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              Integration Guide
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Communication Log */}
        <div>
          <SMSLog communicationLog={communicationLog} />
        </div>

        {/* RIGHT COLUMN: Content Area */}
        <div className="lg:col-span-3">
          
          {/* TAB: DATABASE MANAGER */}
          {activeTab === 'database' && (
            <StudentTable
              students={students}
              isLoading={isLoading}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
              onGenerateCode={handleGenerateCode}
              onSendSMS={handleSendSMS}
              onSendEmail={handleSendEmail}
            />
          )}

          {/* TAB: API TESTER */}
          {activeTab === 'tester' && (
            <APITester apiBaseUrl={API_BASE_URL} onStudentLinked={loadStudents} />
          )}

          {/* TAB: INTEGRATION GUIDE */}
          {activeTab === 'guide' && (
            <IntegrationGuide />
          )}

        </div>
      </main>
    </div>
  );
}
