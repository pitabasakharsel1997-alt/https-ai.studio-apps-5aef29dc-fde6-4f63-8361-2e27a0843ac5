import { useState } from 'react';
import { X, User, ShieldCheck, Palette, Sparkles, Plus, Edit2, Check } from 'lucide-react';
import type { CharacterBible, CharacterEntry } from '../types';

interface CharacterBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bible: CharacterBible | null;
  onUpdateBible: (bible: CharacterBible) => void;
}

export function CharacterBibleModal({ isOpen, onClose, bible, onUpdateBible }: CharacterBibleModalProps) {
  if (!isOpen || !bible) return null;

  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const activeChar = bible.characters[activeCharIndex] || bible.characters[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Character Bible &amp; Visual Identity Vault</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Consistency Locked
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                All generated scenes enforce these visual invariants (clothing palette, facial geometry, body proportions)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Character List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Project Cast ({bible.characters.length})
            </div>

            <div className="space-y-2">
              {bible.characters.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCharIndex(i)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    i === activeCharIndex
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                    {c.referenceImageUrl || c.referenceImages?.front ? (
                      <img src={c.referenceImageUrl || c.referenceImages?.front} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-indigo-400">
                        {c.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.age || c.ageCategory} &bull; {c.personality}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Consistency Rules Box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 mt-4">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Invariant Rule</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {bible.visualConsistencyRule || 'Strict costume palette and facial geometry propagated to all scenes.'}
              </p>
            </div>
          </div>

          {/* Right Two Columns: Character Deep Profile */}
          {activeChar ? (
            <div className="md:col-span-2 space-y-4">
              {/* Profile Card Header */}
              <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 shadow-lg">
                  {activeChar.referenceImageUrl || activeChar.referenceImages?.front ? (
                    <img
                      src={activeChar.referenceImageUrl || activeChar.referenceImages?.front}
                      alt={activeChar.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-indigo-400">
                      {activeChar.name[0]}
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-white">{activeChar.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      Age: {activeChar.age || activeChar.ageCategory}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{activeChar.appearance}</p>
                  <p className="text-[11px] text-slate-400">
                    <strong>Personality:</strong> {activeChar.personality}
                  </p>
                </div>
              </div>

              {/* Character Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Attire &amp; Clothing</span>
                  <span className="text-slate-200 mt-1 block">{activeChar.clothing}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Hair &amp; Features</span>
                  <span className="text-slate-200 mt-1 block">{activeChar.hair}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Signature Palette</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    {activeChar.colors.map((clr, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: clr }}
                        />
                        <span className="text-[10px] text-slate-300 font-mono">{clr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Animation Traits</span>
                  <span className="text-slate-200 mt-1 block">
                    {activeChar.animationCharacteristics || 'Fluid dynamic motion, expressive eyeline focus'}
                  </span>
                </div>
              </div>

              {/* Negative Prompt Enforcement */}
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-rose-300 uppercase block">
                  Mandatory Negative Rules Enforced On Generator:
                </span>
                <p className="text-[11px] text-slate-300 font-mono">
                  {bible.negativePromptRules.join(' | ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center justify-center text-slate-500 text-xs">
              No character selected
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Close Character Vault
          </button>
        </div>
      </div>
    </div>
  );
}
