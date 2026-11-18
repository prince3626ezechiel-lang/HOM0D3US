import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Lock,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useConsole } from '../context/ConsoleContext';
import {
  CONSTRAINTS,
  type MemoryCategory,
  type MemoryClassification,
  type VaultMemoryRecord,
} from '../types/console';

const CATEGORIES: Array<'Toutes' | MemoryCategory> = [
  'Toutes',
  'Protocole',
  'Mémoire',
  'Stratégie',
  'Technique',
  'Abidjan',
];

const CLASSIFICATIONS: MemoryClassification[] = [
  'Souverain',
  'Confidentiel',
  'Opérationnel',
];

interface MemoryVaultViewProps {
  initialSelected?: VaultMemoryRecord | null;
}

export const MemoryVaultView: React.FC<MemoryVaultViewProps> = ({ initialSelected }) => {
  const {
    memories,
    loadingData,
    createMemory,
    updateMemory,
    togglePinMemory,
    deleteMemory,
  } = useConsole();

  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelected?.id ?? memories[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Toutes' | MemoryCategory>('Toutes');
  const [onlyPinned, setOnlyPinned] = useState(false);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<VaultMemoryRecord | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MemoryCategory>('Protocole');
  const [formClassification, setFormClassification] =
    useState<MemoryClassification>('Souverain');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formSource, setFormSource] = useState('Console Abidjan');
  const [formPinned, setFormPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return memories.filter((mem) => {
      if (activeCategory !== 'Toutes' && mem.category !== activeCategory) return false;
      if (onlyPinned && !mem.pinned) return false;
      if (!q) return true;
      return (
        mem.title.toLowerCase().includes(q) ||
        mem.content.toLowerCase().includes(q) ||
        mem.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, memories, onlyPinned, searchQuery]);

  const selectedMemory = useMemo(() => {
    return (
      filteredMemories.find((m) => m.id === selectedId) ??
      filteredMemories[0] ??
      null
    );
  }, [filteredMemories, selectedId]);

  const openCreateForm = () => {
    setEditingMemory(null);
    setFormTitle('');
    setFormCategory('Protocole');
    setFormClassification('Souverain');
    setFormContent('');
    setFormTags('abidjan, razante');
    setFormSource('Console Abidjan');
    setFormPinned(false);
    setIsComposerOpen(true);
  };

  const openEditForm = (mem: VaultMemoryRecord) => {
    setEditingMemory(mem);
    setFormTitle(mem.title);
    setFormCategory(mem.category);
    setFormClassification(mem.classification);
    setFormContent(mem.content);
    setFormTags(mem.tags.join(', '));
    setFormSource(mem.source);
    setFormPinned(mem.pinned);
    setIsComposerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formTitle.trim().length < CONSTRAINTS.MEMORY_TITLE_MIN ||
      formContent.trim().length < CONSTRAINTS.MEMORY_CONTENT_MIN
    ) {
      return;
    }

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, CONSTRAINTS.MEMORY_TAGS_MAX);

    setSubmitting(true);
    try {
      if (editingMemory) {
        await updateMemory(editingMemory.id, {
          title: formTitle.trim(),
          category: formCategory,
          classification: formClassification,
          content: formContent.trim(),
          tags: parsedTags,
          pinned: formPinned,
          source: formSource.trim() || 'Console Abidjan',
        });
        setSelectedId(editingMemory.id);
      } else {
        const created = await createMemory({
          title: formTitle.trim(),
          category: formCategory,
          classification: formClassification,
          content: formContent.trim(),
          tags: parsedTags,
          pinned: formPinned,
          source: formSource.trim() || 'Console Abidjan',
        });
        setSelectedId(created.id);
      }
      setIsComposerOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMemory(id);
    setConfirmDeleteId(null);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#E6EDF5] tracking-tight">
            Coffre-fort Mémoire
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Archives stratégiques, protocoles d’armure et notes locales synchronisées
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter une mémoire
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0D131D] border border-slate-800/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#162235] text-[#38BDF8] border border-[#38BDF8]/35'
                    : 'text-slate-400 hover:text-[#E6EDF5] border border-transparent'
                }`}
              >
                {cat}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOnlyPinned((p) => !p)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              onlyPinned
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-[#E6EDF5] border border-transparent'
            }`}
          >
            <Pin className="w-3 h-3" />
            Épinglées
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans le coffre..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#070A0F] border border-slate-800 rounded-md text-[#E6EDF5] placeholder:text-slate-500 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
      </div>

      {/* Two-pane Memory Viewer */}
      {loadingData && memories.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#0D131D] border border-slate-800/70 animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-7 h-72 bg-[#0D131D] border border-slate-800/70 animate-pulse" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="bg-[#0D131D] border border-slate-800/80 p-12 text-center space-y-4">
          <Lock className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-[#E6EDF5]">
              Aucune entrée correspondante
            </h2>
            <p className="text-xs text-slate-400">
              Ajustez vos filtres ou enregistrez une nouvelle entrée dans le coffre-fort.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une première mémoire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List column */}
          <div className="lg:col-span-5 bg-[#0D131D] border border-slate-800/80 divide-y divide-slate-800/70">
            {filteredMemories.map((mem) => {
              const isSelected = selectedMemory?.id === mem.id;
              return (
                <button
                  key={mem.id}
                  type="button"
                  onClick={() => setSelectedId(mem.id)}
                  className={`w-full text-left p-4 transition-colors space-y-1.5 ${
                    isSelected
                      ? 'bg-[#131D2D] border-r-2 border-r-[#38BDF8]'
                      : 'hover:bg-slate-800/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#E6EDF5] leading-snug line-clamp-2">
                      {mem.title}
                    </h3>
                    {mem.pinned && <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {mem.content}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <span className="text-slate-300">{mem.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{mem.classification}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(mem.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail Inspector column */}
          {selectedMemory && (
            <article className="lg:col-span-7 hud-frame p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="text-[#38BDF8] font-medium">{selectedMemory.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">{selectedMemory.classification}</span>
                    <span aria-hidden="true">·</span>
                    <span>Source : {selectedMemory.source}</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#E6EDF5] text-balance">
                    {selectedMemory.title}
                  </h2>
                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    Mis à jour le{' '}
                    {new Date(selectedMemory.updatedAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePinMemory(selectedMemory.id)}
                    aria-label={selectedMemory.pinned ? 'Désépingler' : 'Épingler'}
                    className={`p-2 rounded border transition-colors ${
                      selectedMemory.pinned
                        ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                        : 'bg-[#070A0F] border-slate-800 text-slate-400 hover:text-[#E6EDF5]'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditForm(selectedMemory)}
                    aria-label="Modifier l'entrée"
                    className="p-2 rounded bg-[#070A0F] border border-slate-800 text-slate-400 hover:text-[#38BDF8] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {confirmDeleteId === selectedMemory.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedMemory.id)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors"
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-[#E6EDF5]"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedMemory.id)}
                      aria-label="Supprimer l'entrée"
                      className="p-2 rounded bg-[#070A0F] border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap max-w-[68ch]">
                {selectedMemory.content}
              </div>

              {selectedMemory.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-800/70 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-slate-500">Mots-clés :</span>
                  {selectedMemory.tags.map((tag, idx) => (
                    <React.Fragment key={tag}>
                      <span className="text-slate-300">#{tag}</span>
                      {idx < selectedMemory.tags.length - 1 && (
                        <span aria-hidden="true" className="text-slate-600">·</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
      )}

      {/* Composer / Editor Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="hud-frame w-full max-w-xl p-6 sm:p-8 space-y-5 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="font-display text-lg font-semibold text-[#E6EDF5]">
                {editingMemory ? 'Modifier l’entrée mémoire' : 'Nouvelle entrée mémoire'}
              </h2>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                aria-label="Fermer"
                className="p-1.5 text-slate-400 hover:text-[#E6EDF5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="mem-title" className="block text-xs text-slate-400 mb-1">
                  Titre ({formTitle.length}/{CONSTRAINTS.MEMORY_TITLE_MAX})
                </label>
                <input
                  id="mem-title"
                  type="text"
                  required
                  minLength={CONSTRAINTS.MEMORY_TITLE_MIN}
                  maxLength={CONSTRAINTS.MEMORY_TITLE_MAX}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex : Protocole de continuité Cocody"
                  className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mem-cat" className="block text-xs text-slate-400 mb-1">
                    Catégorie
                  </label>
                  <select
                    id="mem-cat"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                    className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                  >
                    {CATEGORIES.filter((c) => c !== 'Toutes').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mem-class" className="block text-xs text-slate-400 mb-1">
                    Classification
                  </label>
                  <select
                    id="mem-class"
                    value={formClassification}
                    onChange={(e) =>
                      setFormClassification(e.target.value as MemoryClassification)
                    }
                    className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                  >
                    {CLASSIFICATIONS.map((cl) => (
                      <option key={cl} value={cl}>
                        {cl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="mem-content" className="block text-xs text-slate-400 mb-1">
                  Contenu ({formContent.length}/{CONSTRAINTS.MEMORY_CONTENT_MAX})
                </label>
                <textarea
                  id="mem-content"
                  required
                  rows={5}
                  minLength={CONSTRAINTS.MEMORY_CONTENT_MIN}
                  maxLength={CONSTRAINTS.MEMORY_CONTENT_MAX}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Consignez la note stratégique, le protocole ou la référence technique..."
                  className="w-full px-3 py-2 text-sm bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mem-tags" className="block text-xs text-slate-400 mb-1">
                    Mots-clés (séparés par virgule, max {CONSTRAINTS.MEMORY_TAGS_MAX})
                  </label>
                  <input
                    id="mem-tags"
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="abidjan, protocole, sync"
                    className="w-full px-3 py-2 text-xs bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div>
                  <label htmlFor="mem-source" className="block text-xs text-slate-400 mb-1">
                    Source
                  </label>
                  <input
                    id="mem-source"
                    type="text"
                    maxLength={CONSTRAINTS.MEMORY_SOURCE_MAX}
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A0F] border border-slate-700 rounded-md text-[#E6EDF5] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="rounded border-slate-700 bg-[#070A0F] text-[#38BDF8]"
                />
                Épingler sur l’écran d’accueil
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/70 rounded-md hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#38BDF8] text-[#070A0F] rounded-md hover:bg-[#7DD3FC] disabled:opacity-50 transition-colors"
                >
                  {submitting
                    ? 'Enregistrement...'
                    : editingMemory
                    ? 'Enregistrer les modifications'
                    : 'Archiver dans le coffre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
