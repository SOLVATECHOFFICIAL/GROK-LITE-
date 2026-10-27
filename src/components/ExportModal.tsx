/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  Upload,
  Copy,
  Check,
  X,
  FileCode,
  Sparkles,
  Camera,
} from 'lucide-react';
import { AnimationProject } from '../types/animation';

interface ExportModalProps {
  project: AnimationProject;
  isOpen: boolean;
  onClose: () => void;
  onImportProject: (imported: AnimationProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose,
  onImportProject,
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const jsonString = JSON.stringify(project, null, 2);

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_trove.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        throw new Error('Invalid project structure: Missing scenes array');
      }
      onImportProject(parsed);
      onClose();
    } catch (err: unknown) {
      setImportError(
        err instanceof Error ? err.message : 'Invalid JSON project format.'
      );
    }
  };

  const handleSnapshotDownload = () => {
    const stageEl = document.getElementById('tale-stage-viewport');
    if (!stageEl) return;

    // Use svg foreignObject or direct SVG extraction
    const svgData = new XMLSerializer().serializeToString(stageEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_stage.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="export-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Export & Share</h3>
              <p className="text-xs text-neutral-400">Save, export or load Tale Trove project</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/60 text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] uppercase font-bold text-neutral-500">.JSON</span>
              </div>
              <h4 className="font-semibold text-white text-xs mb-1">Download Project</h4>
              <p className="text-[11px] text-neutral-400">
                Complete animation project with all scenes, rigs, and keyframes.
              </p>
            </button>

            <button
              type="button"
              onClick={handleSnapshotDownload}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-800/60 text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <Camera className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] uppercase font-bold text-neutral-500">.SVG</span>
              </div>
              <h4 className="font-semibold text-white text-xs mb-1">Export Stage Snapshot</h4>
              <p className="text-[11px] text-neutral-400">
                Vector snapshot of the current active frame on the stage.
              </p>
            </button>
          </div>

          {/* Project JSON code block & copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">
                Raw Project Blueprint
              </span>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-400 max-h-36 overflow-y-auto">
              {jsonString}
            </pre>
          </div>

          {/* Import JSON Section */}
          <div className="pt-4 border-t border-neutral-800">
            <h4 className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import Existing Tale Trove Project</span>
            </h4>
            <p className="text-[11px] text-neutral-400 mb-2">
              Paste project JSON below to load:
            </p>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste Tale Trove JSON here..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500 resize-none"
            />
            {importError && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{importError}</p>
            )}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-xs transition"
              >
                Load Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
