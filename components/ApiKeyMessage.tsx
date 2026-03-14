
import React, { useState, useEffect } from 'react';
import { setApiKey, testApiKey, getApiKey, setGeminiApiKey, getGeminiApiKey } from '../services/youtubeService';
import { EyeIcon, EyeOffIcon } from './icons';

interface ApiKeyMessageProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySubmit: () => void;
}

const ApiKeyMessage: React.FC<ApiKeyMessageProps> = ({ isOpen, onClose, onKeySubmit }) => {
  const [keyValue, setKeyValue] = useState('');
  const [geminiKeyValue, setGeminiKeyValue] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isGeminiKeyVisible, setIsGeminiKeyVisible] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedKey = getApiKey();
      if (storedKey) {
        setKeyValue(storedKey);
      } else {
        setKeyValue('');
      }
      
      const storedGeminiKey = getGeminiApiKey();
      if (storedGeminiKey) {
        setGeminiKeyValue(storedGeminiKey);
      } else {
        setGeminiKeyValue('');
      }
      setTestStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!keyValue.trim()) {
      setTestStatus('error');
      setTestMessage('먼저 YouTube API 키를 입력해주세요.');
      return;
    }
    setTestStatus('testing');
    setTestMessage('YouTube API 키를 확인하는 중입니다...');
    
    const result = await testApiKey(keyValue.trim());

    if (result.success) {
      setTestStatus('success');
      setTestMessage('YouTube API 키가 유효합니다! 이제 저장하고 시작할 수 있습니다.');
    } else {
      setTestStatus('error');
      setTestMessage(result.error?.message || '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyValue.trim() && geminiKeyValue.trim()) {
      setApiKey(keyValue.trim());
      setGeminiApiKey(geminiKeyValue.trim());
      onKeySubmit();
      setTestStatus('idle');
    } else {
      setTestStatus('error');
      setTestMessage('두 API 키를 모두 입력해주세요.');
    }
  };
  
  const statusColors = {
      idle: 'text-slate-500',
      testing: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      error: 'text-red-600 dark:text-red-400',
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
    >
      <div 
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-2xl w-full text-center border-t-4 border-blue-500 relative animate-fade-in-up"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out' }}
      >
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="닫기"
        >
          &times;
        </button>
        <div className="text-blue-500 mb-4">
          <i className="fas fa-key fa-3x"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">API 키 설정</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          이 애플리케이션을 사용하려면 YouTube Data API v3 키와 Gemini API 키가 필요합니다. 입력된 키는 브라우저에 암호화되어 안전하게 저장되며, 다음 방문 시에도 유지됩니다.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">YouTube Data API v3 키</label>
            <div className="relative">
              <input
                type={isKeyVisible ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => {
                    setKeyValue(e.target.value);
                    setTestStatus('idle');
                }}
                placeholder="YouTube API 키 입력"
                className="w-full pl-4 pr-12 py-3 text-base bg-white dark:bg-slate-700 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                  type="button"
                  onClick={() => setIsKeyVisible(!isKeyVisible)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={isKeyVisible ? "API 키 숨기기" : "API 키 보이기"}
              >
                  {isKeyVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gemini API 키</label>
            <div className="relative">
              <input
                type={isGeminiKeyVisible ? 'text' : 'password'}
                value={geminiKeyValue}
                onChange={(e) => {
                    setGeminiKeyValue(e.target.value);
                    setTestStatus('idle');
                }}
                placeholder="Gemini API 키 입력"
                className="w-full pl-4 pr-12 py-3 text-base bg-white dark:bg-slate-700 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                  type="button"
                  onClick={() => setIsGeminiKeyVisible(!isGeminiKeyVisible)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={isGeminiKeyVisible ? "API 키 숨기기" : "API 키 보이기"}
              >
                  {isGeminiKeyVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          
          {testStatus !== 'idle' && (
            <div className={`text-sm text-left p-3 rounded-lg ${statusColors[testStatus].replace('text-', 'bg-').replace('-600', '-50').replace('-400', '-900/30')} ${statusColors[testStatus].replace('text-', 'border-').replace('-600', '-200').replace('-400', '-500/30')} border`}>
                <p className={`font-semibold ${statusColors[testStatus]}`}>{testMessage}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
             <button
                type="button"
                onClick={handleTestKey}
                className="w-full sm:w-auto flex-1 bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
                disabled={!keyValue.trim() || testStatus === 'testing'}
            >
                {testStatus === 'testing' ? '확인 중...' : 'YouTube 키 테스트'}
            </button>
            <button
                type="submit"
                className="w-full sm:w-auto flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 dark:disabled:bg-blue-800"
                disabled={!keyValue.trim() || !geminiKeyValue.trim()}
            >
                저장하고 시작하기
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="https://developers.google.com/youtube/v3/getting-started" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              YouTube API 키 발급 방법
            </a>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Gemini API 키 발급 방법
            </a>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ApiKeyMessage;