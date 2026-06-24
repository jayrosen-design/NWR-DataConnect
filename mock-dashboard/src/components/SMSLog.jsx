import React from 'react';
import { Smartphone, Mail, MessageSquare, Gamepad2 } from 'lucide-react';

export default function SMSLog({ communicationLog }) {
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString();
    } catch {
      return isoString;
    }
  };

  const getMessageIcon = (type) => {
    switch(type) {
      case 'SMS':
        return <Smartphone className="w-3 h-3" />;
      case 'Email':
        return <Mail className="w-3 h-3" />;
      case 'Claim':
        return <Gamepad2 className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getBorderColor = (type) => {
    switch(type) {
      case 'SMS':
        return 'border-green-500';
      case 'Email':
        return 'border-purple-500';
      case 'Claim':
        return 'border-blue-500';
      default:
        return 'border-slate-500';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'SMS':
        return 'text-green-400';
      case 'Email':
        return 'text-purple-400';
      case 'Claim':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 text-slate-200 p-3 text-sm font-medium flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Communication Log (SMS, Email & Claims)
      </div>
      <div className="h-[calc(100vh-12rem)] overflow-y-auto p-4 space-y-3 bg-slate-900">
        {communicationLog.length === 0 ? (
          <div className="text-slate-500 text-xs text-center italic mt-10">
            No messages sent yet. Generate a code and send via SMS or Email.
          </div>
        ) : (
          communicationLog.map((log, i) => (
            <div key={i} className={`bg-slate-800 border-l-4 ${getBorderColor(log.deliveryMethod)} p-3 rounded-r text-xs`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`flex items-center gap-1 ${getTypeColor(log.deliveryMethod)} font-bold`}>
                  {getMessageIcon(log.deliveryMethod)}
                  {log.deliveryMethod}
                </span>
                <span className="text-slate-400">{formatTime(log.time)}</span>
              </div>
              <div className="text-slate-300 mb-1">
                <span className="font-bold">{log.deliveryMethod === 'Claim' ? 'Student:' : 'To:'}</span> {log.studentName}
              </div>
              {log.deliveryMethod === 'SMS' && log.phoneNumber && (
                <div className="text-slate-400 text-xs mb-1">
                  Phone: {log.phoneNumber}
                </div>
              )}
              {log.deliveryMethod === 'Email' && log.emailAddress && (
                <div className="text-slate-400 text-xs mb-1">
                  Email: {log.emailAddress}
                </div>
              )}
              {log.deliveryMethod === 'Claim' && log.firebaseUserId && (
                <>
                  <div className="text-slate-400 text-xs mb-1">
                    Firebase User: {log.displayName || 'Unknown User'}
                  </div>
                  <div className="text-slate-400 text-xs mb-1 font-mono">
                    User ID: {log.firebaseUserId.substring(0, 16)}...
                  </div>
                  <div className="text-slate-400 text-xs mb-1">
                    Account Type: {log.isAnonymous ? 'Anonymous' : 'Authenticated'}
                  </div>
                </>
              )}
              {log.subject && (
                <div className="text-slate-300 font-bold mb-1">
                  Subject: {log.subject}
                </div>
              )}
              <div className="text-white mt-2 bg-slate-900 p-2 rounded whitespace-pre-wrap">
                {log.message}
              </div>
              {log.code && (
                <div className={`font-mono font-bold mt-2 text-center text-base bg-slate-900 p-2 rounded ${
                  log.deliveryMethod === 'Claim' ? 'text-blue-400' : 'text-green-400'
                }`}>
                  Access Code: {log.code}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
