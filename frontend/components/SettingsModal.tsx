'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { apiKey: string; provider: string; model: string }) => void;
  currentSettings: { apiKey: string; provider: string; model: string };
}

export default function SettingsModal({ isOpen, onClose, onSave, currentSettings }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(currentSettings.apiKey);
  const [provider, setProvider] = useState(currentSettings.provider);
  const [model, setModel] = useState(currentSettings.model);

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentSettings.apiKey);
      setProvider(currentSettings.provider);
      setModel(currentSettings.model);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ apiKey, provider, model });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Settings
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="groq">Groq (Free Default)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {provider !== 'groq' && (
             <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${provider} API Key`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Your key is stored locally in your browser and sent securely to the server only for processing. It is never saved on our servers.
                </p>
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Model (Optional)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={
                provider === 'groq' ? 'llama3-70b-8192' :
                provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o'
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
