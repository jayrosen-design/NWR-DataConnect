import React from 'react';
import { Plus, Trash2, RefreshCw, Link, Loader2, Smartphone, Mail } from 'lucide-react';

export default function StudentTable({ students, isLoading, onAddStudent, onDeleteStudent, onGenerateCode, onSendSMS, onSendEmail }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800">
          Mock Students (Azure Lagoon)
        </h2>
        <button 
          onClick={onAddStudent}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3 font-medium whitespace-nowrap">NWR ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium text-center">Grade</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Access Code</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No students yet. Click "Add Student" to create one.
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{student.id}</td>
                  <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{student.name}</td>
                  <td className="p-3 text-slate-700 text-center">{student.grade}</td>
                  <td className="p-3 whitespace-nowrap">
                    {student.linked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        <Link className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                        Unlinked
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {student.code ? (
                      <div className="font-mono font-bold text-base tracking-wider text-blue-600 whitespace-nowrap">
                        {student.code}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No code</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                      {!student.linked && (
                        <>
                          <button 
                            onClick={() => onGenerateCode(student.id)}
                            className="px-3 py-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                            title={student.code ? "Regenerate Code" : "Generate New Code"}
                          >
                            <RefreshCw className="w-3 h-3" />
                            {student.code ? "New Code" : "Generate"}
                          </button>
                          {student.code && (
                            <>
                              <button 
                                onClick={() => onSendSMS(student.id)}
                                className="px-3 py-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                                title="Send Code via SMS"
                              >
                                <Smartphone className="w-3 h-3" />
                                SMS
                              </button>
                              <button 
                                onClick={() => onSendEmail(student.id)}
                                className="px-3 py-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                                title="Send Code via Email"
                              >
                                <Mail className="w-3 h-3" />
                                Email
                              </button>
                            </>
                          )}
                        </>
                      )}
                      <button 
                        onClick={() => onDeleteStudent(student.id)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
