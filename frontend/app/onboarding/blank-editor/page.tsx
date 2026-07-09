"use client";

import { Suspense, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Undo2, Redo2, Monitor, Tablet, Smartphone, Eye,
  Columns2, Layers, SlidersHorizontal, AlignLeft, LayoutTemplate,
  Video, List, Type, Image as ImageIcon, Music, MousePointerClick,
  ChevronDown, Plus, Trash2, Copy, Move, Settings2, Code2, Download,
  GripVertical, PanelBottom
} from 'lucide-react';

// ────────── Types ──────────
type ColumnCount = 1 | 2 | 3 | 4;
type ElementType = 'titulo' | 'texto' | 'imagen' | 'video' | 'boton' | 'separador' | 'audio';

interface CanvasElement {
  id: string;
  type: ElementType;
  content?: string;
}

interface CanvasColumn {
  id: string;
  elements: CanvasElement[];
  flex: number;
}

interface CanvasRow {
  id: string;
  columns: CanvasColumn[];
  paddingTop: number;
  paddingBottom: number;
  tabletLayout: number[] | null;  // null = inherit desktop
  mobileLayout: number[] | null;  // null = stack (1 col each)
}

// ────────── Sidebar data ──────────
const SIDEBAR_SECTIONS = [
  {
    label: 'ESTRUCTURA',
    items: [
      { icon: Columns2, label: 'Fila', type: 'row' },
      { icon: Layers, label: 'Pestaña', type: 'tab' },
      { icon: SlidersHorizontal, label: 'Deslizador', type: 'slider' },
      { icon: AlignLeft, label: 'Acordeón', type: 'accordion' },
      { icon: LayoutTemplate, label: 'Bandera', type: 'banner' },
      { icon: Video, label: 'Banner De Video', type: 'video-banner' },
      { icon: List, label: 'Mesa', type: 'table' },
    ],
  },
  {
    label: 'CONTENIDO',
    items: [
      { icon: Type, label: 'Título', type: 'titulo' },
      { icon: AlignLeft, label: 'Texto', type: 'texto' },
      { icon: ImageIcon, label: 'Imagen', type: 'imagen' },
      { icon: Video, label: 'Video', type: 'video' },
      { icon: Music, label: 'Audio', type: 'audio' },
      { icon: MousePointerClick, label: 'Botón', type: 'boton' },
      { icon: PanelBottom, label: 'Separador', type: 'separador' },
    ],
  },
];

// Layout presets for a row (column widths as fractions)
const LAYOUT_PRESETS: { cols: number[]; label: string }[] = [
  { cols: [1], label: '1 col' },
  { cols: [1, 1], label: '2 iguales' },
  { cols: [1, 2], label: '1/3 + 2/3' },
  { cols: [2, 1], label: '2/3 + 1/3' },
  { cols: [1, 1, 1], label: '3 iguales' },
  { cols: [1, 1, 1, 1], label: '4 iguales' },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function makeRow(flexes: number[] = [1, 1]): CanvasRow {
  return {
    id: uid(),
    columns: flexes.map(f => ({ id: uid(), elements: [], flex: f })),
    paddingTop: 32,
    paddingBottom: 32,
    tabletLayout: null,
    mobileLayout: null,
  };
}

// ────────── Element renderer inside a column ──────────
function ElementBlock({ el, onDelete }: { el: CanvasElement; onDelete: () => void }) {
  return (
    <div className="group relative border border-dashed border-gray-200 rounded-md p-3 bg-white hover:border-[#6366f1] transition-colors">
      <button onClick={onDelete} className="absolute top-1 right-1 h-5 w-5 rounded bg-red-50 text-red-400 hover:bg-red-100 items-center justify-center hidden group-hover:flex transition-all">
        <Trash2 size={10} />
      </button>
      {el.type === 'titulo' && <h2 className="text-lg font-bold text-gray-800">Título de ejemplo</h2>}
      {el.type === 'texto' && <p className="text-sm text-gray-500">Escribe aquí tu texto...</p>}
      {el.type === 'imagen' && (
        <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs gap-2">
          <ImageIcon size={18} /> Imagen
        </div>
      )}
      {el.type === 'video' && (
        <div className="h-24 bg-gray-900 rounded flex items-center justify-center text-gray-400 text-xs gap-2">
          <Video size={18} /> Video
        </div>
      )}
      {el.type === 'boton' && (
        <button className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#6366f1' }}>Botón</button>
      )}
      {el.type === 'separador' && <hr className="border-gray-200 my-1" />}
      {el.type === 'audio' && (
        <div className="h-10 bg-gray-100 rounded flex items-center px-3 gap-2 text-gray-400 text-xs">
          <Music size={14} /> Audio
        </div>
      )}
    </div>
  );
}

// ────────── Main component ──────────
function BlankEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageName = searchParams.get('name') || 'Nueva Página';
  const targetUserId = searchParams.get('targetUserId');

  const [rows, setRows] = useState<CanvasRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ ESTRUCTURA: true, CONTENIDO: true });
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // resize state
  const resizing = useRef<{ rowId: string; edge: 'top' | 'bottom'; startY: number; startVal: number } | null>(null);
  const [resizeIndicator, setResizeIndicator] = useState<{ rowId: string; edge: 'top' | 'bottom'; value: number } | null>(null);

  const startResize = useCallback((e: React.MouseEvent, rowId: string, edge: 'top' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const startVal = edge === 'top' ? row.paddingTop : row.paddingBottom;
    resizing.current = { rowId, edge, startY: e.clientY, startVal };
    setResizeIndicator({ rowId, edge, value: startVal });

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = ev.clientY - resizing.current.startY;
      const dir = resizing.current.edge === 'top' ? -1 : 1;
      const newVal = Math.max(0, Math.round((resizing.current.startVal + delta * dir) / 4) * 4);
      setResizeIndicator({ rowId: resizing.current.rowId, edge: resizing.current.edge, value: newVal });
      setRows(prev => prev.map(r => r.id !== resizing.current!.rowId ? r : {
        ...r,
        paddingTop: resizing.current!.edge === 'top' ? newVal : r.paddingTop,
        paddingBottom: resizing.current!.edge === 'bottom' ? newVal : r.paddingBottom,
      }));
    };
    const onUp = () => {
      resizing.current = null;
      setResizeIndicator(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [rows]);

  // drag state
  const draggingItem = useRef<{ type: string } | null>(null);
  const draggingOverRow = useRef<string | null>(null);
  const draggingOverCol = useRef<string | null>(null);
  const [dropHighlight, setDropHighlight] = useState<{ rowId: string; colId: string } | null>(null);
  const [canvasDropActive, setCanvasDropActive] = useState(false);

  const toggleSection = (label: string) => setOpenSections(p => ({ ...p, [label]: !p[label] }));

  const selectedRow = rows.find(r => r.id === selectedRowId) || null;

  // ── drag handlers (sidebar → canvas) ──
  function handleSidebarDragStart(type: string) {
    draggingItem.current = { type };
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
    setCanvasDropActive(true);
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCanvasDropActive(false);
    if (!draggingItem.current) return;
    const type = draggingItem.current.type;
    if (type === 'row') {
      const newRow = makeRow([1, 1]);
      setRows(r => [...r, newRow]);
      setSelectedRowId(newRow.id);
    }
    draggingItem.current = null;
  }

  function handleColDragOver(e: React.DragEvent, rowId: string, colId: string) {
    e.preventDefault();
    e.stopPropagation();
    draggingOverRow.current = rowId;
    draggingOverCol.current = colId;
    setDropHighlight({ rowId, colId });
  }

  function handleColDrop(e: React.DragEvent, rowId: string, colId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDropHighlight(null);
    if (!draggingItem.current) return;
    const type = draggingItem.current.type;
    // Only content elements go into columns
    const contentTypes: ElementType[] = ['titulo', 'texto', 'imagen', 'video', 'boton', 'separador', 'audio' as any];
    if (contentTypes.includes(type as ElementType)) {
      setRows(prev => prev.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id !== colId) return col;
            return { ...col, elements: [...col.elements, { id: uid(), type: type as ElementType }] };
          }),
        };
      }));
    }
    draggingItem.current = null;
  }

  function handleColDragLeave() {
    setDropHighlight(null);
  }

  function deleteElement(rowId: string, colId: string, elId: string) {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      return { ...row, columns: row.columns.map(col => col.id !== colId ? col : { ...col, elements: col.elements.filter(e => e.id !== elId) }) };
    }));
  }

  function deleteRow(rowId: string) {
    setRows(prev => prev.filter(r => r.id !== rowId));
    if (selectedRowId === rowId) setSelectedRowId(null);
  }

  function duplicateRow(rowId: string) {
    const idx = rows.findIndex(r => r.id === rowId);
    if (idx === -1) return;
    const copy: CanvasRow = { id: uid(), paddingTop: rows[idx].paddingTop, paddingBottom: rows[idx].paddingBottom, tabletLayout: rows[idx].tabletLayout, mobileLayout: rows[idx].mobileLayout, columns: rows[idx].columns.map(col => ({ id: uid(), flex: col.flex, elements: col.elements.map(e => ({ ...e, id: uid() })) })) };
    const next = [...rows];
    next.splice(idx + 1, 0, copy);
    setRows(next);
  }

  function changeRowLayout(rowId: string, flexes: number[]) {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const existing = row.columns;
      const newCols: CanvasColumn[] = flexes.map((f, i) => ({
        ...(existing[i] || { id: uid(), elements: [] }),
        flex: f,
      }));
      return { ...row, columns: newCols };
    }));
  }

  const canvasWidth = device === 'mobile' ? 390 : device === 'tablet' ? 768 : '100%';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: '#0f0f1a' }}>
      {/* ── Top bar ── */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 shrink-0" style={{ background: '#111827' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition-colors">
            <span className="text-[#6366f1] font-medium">Páginas de inicio</span>
            <span className="text-gray-600 mx-1">›</span>
            <span className="text-gray-300 font-medium">{pageName}</span>
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"><Undo2 size={14} /></button>
          <button className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"><Redo2 size={14} /></button>
        </div>

        <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1">
          {([
            { key: 'desktop', icon: Monitor, label: '1734 PX / 100%' },
            { key: 'tablet', icon: Tablet },
            { key: 'mobile', icon: Smartphone },
          ] as const).map(d => (
            <button
              key={d.key}
              onClick={() => setDevice(d.key)}
              className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] transition-colors ${device === d.key ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <d.icon size={14} />
              {'label' in d && device === 'desktop' && <span className="text-gray-400 text-[10px]">{d.label}</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-lg text-[12px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5">
            <Eye size={13} /> Avance
          </button>
          <button className="h-8 px-5 rounded-lg text-[12px] font-bold text-white transition-colors" style={{ background: '#6366f1' }}>
            Ahorrar
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-44 bg-[#111827] border-r border-white/10 overflow-y-auto shrink-0 select-none">
          <div className="flex border-b border-white/10">
            <button className="flex-1 py-2.5 text-[11px] font-semibold text-[#6366f1] border-b-2 border-[#6366f1]">Elementos</button>
            <button className="flex-1 py-2.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1">
              Página <Plus size={10} />
            </button>
          </div>

          {SIDEBAR_SECTIONS.map(section => (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-bold tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
              >
                {section.label}
                <ChevronDown size={11} className={`transition-transform ${openSections[section.label] ? '' : '-rotate-90'}`} />
              </button>
              {openSections[section.label] && (
                <div className="grid grid-cols-2 gap-1.5 px-2 pb-3">
                  {section.items.map(item => (
                    <div
                      key={item.label}
                      draggable
                      onDragStart={() => handleSidebarDragStart(item.type)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#6366f1]/40 transition-all cursor-grab active:cursor-grabbing active:opacity-60"
                    >
                      <item.icon size={18} className="text-gray-400" />
                      <span className="text-[8px] text-gray-500 text-center leading-tight px-1">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="flex-1 overflow-auto flex flex-col items-center py-8 px-6 transition-colors"
          style={{ background: canvasDropActive ? '#1a1a3e' : '#0f0f1a' }}
          onDragOver={handleCanvasDragOver}
          onDragLeave={() => setCanvasDropActive(false)}
          onDrop={handleCanvasDrop}
        >
          <div
            className="bg-white shadow-2xl transition-all"
            style={{ width: canvasWidth, minHeight: 600 }}
            onClick={() => setSelectedRowId(null)}
          >
            {/* Rows */}
            {rows.map(row => (
              <div
                key={row.id}
                className={`group relative border-2 transition-all ${selectedRowId === row.id ? 'border-[#6366f1]' : 'border-transparent hover:border-[#6366f1]/30'}`}
                onClick={e => { e.stopPropagation(); setSelectedRowId(row.id); }}
              >
                {/* Row toolbar */}
                {selectedRowId === row.id && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg z-20" style={{ background: '#6366f1' }}>
                    <span className="text-[10px] text-white font-semibold flex items-center gap-1"><GripVertical size={10} /> Fila</span>
                    <div className="w-px h-4 bg-white/30 mx-1" />
                    <button className="h-5 w-5 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"><Code2 size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); duplicateRow(row.id); }} className="h-5 w-5 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"><Copy size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteRow(row.id); }} className="h-5 w-5 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-red-400/50 transition-colors"><Trash2 size={10} /></button>
                  </div>
                )}

                {/* TOP resize handle */}
                {selectedRowId === row.id && (
                  <div
                    className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
                    style={{ height: 10, cursor: 'ns-resize', marginTop: -5 }}
                    onMouseDown={e => startResize(e, row.id, 'top')}
                  >
                    <div className="w-full h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#6366f1' }} />
                    {resizeIndicator?.rowId === row.id && resizeIndicator.edge === 'top' && (
                      <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold text-white z-30 whitespace-nowrap pointer-events-none" style={{ background: '#4ade80', color: '#14532d', top: -2 }}>
                        {resizeIndicator.value} píxeles
                      </div>
                    )}
                  </div>
                )}

                {/* Padding indicator top */}
                {selectedRowId === row.id && row.paddingTop > 0 && (
                  <div
                    className="relative flex items-center justify-center text-[10px] font-semibold border border-dashed border-green-300"
                    style={{ height: row.paddingTop, background: 'rgba(134,239,172,0.15)', color: '#16a34a', cursor: 'ns-resize' }}
                    onMouseDown={e => startResize(e, row.id, 'top')}
                  >
                    {row.paddingTop} píxeles
                  </div>
                )}

                {/* Columns */}
                {(() => {
                  // Determine which flex values to use for the current device
                  const activeFlexes: number[] =
                    device === 'mobile'
                      ? (row.mobileLayout ?? row.columns.map(() => 1))
                      : device === 'tablet'
                      ? (row.tabletLayout ?? row.columns.map(c => c.flex))
                      : row.columns.map(c => c.flex);
                  return null;
                })()}
                <div className="flex" style={{ minHeight: 60, userSelect: resizing.current ? 'none' : 'auto', flexDirection: device === 'mobile' && !row.mobileLayout ? 'column' : 'row' }}>
                  {row.columns.map((col, ci) => {
                    const activeFlex =
                      device === 'mobile'
                        ? (row.mobileLayout ? row.mobileLayout[ci] ?? 1 : 1)
                        : device === 'tablet'
                        ? (row.tabletLayout ? row.tabletLayout[ci] ?? col.flex : col.flex)
                        : col.flex;
                    return (
                    <div
                      key={col.id}
                      className={`p-3 border-r last:border-r-0 border-gray-100 transition-colors ${dropHighlight?.rowId === row.id && dropHighlight?.colId === col.id ? 'bg-indigo-50' : ''}`}
                      style={{ flex: activeFlex }}
                      onDragOver={e => handleColDragOver(e, row.id, col.id)}
                      onDragLeave={handleColDragLeave}
                      onDrop={e => handleColDrop(e, row.id, col.id)}
                    >
                      {col.elements.length === 0 ? (
                        <div className={`h-full min-h-[60px] rounded-md border border-dashed flex items-center justify-center text-[11px] transition-colors ${dropHighlight?.rowId === row.id && dropHighlight?.colId === col.id ? 'border-[#6366f1] text-[#6366f1] bg-indigo-50' : 'border-gray-200 text-gray-400'}`}>
                          Arrastra el elemento aquí
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {col.elements.map(el => (
                            <ElementBlock key={el.id} el={el} onDelete={() => deleteElement(row.id, col.id, el.id)} />
                          ))}
                          <div
                            className={`h-8 rounded border border-dashed flex items-center justify-center text-[10px] transition-colors ${dropHighlight?.rowId === row.id && dropHighlight?.colId === col.id ? 'border-[#6366f1] text-[#6366f1]' : 'border-gray-100 text-gray-300'}`}
                          >
                            + elemento
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>

                {/* Padding indicator bottom */}
                {selectedRowId === row.id && row.paddingBottom > 0 && (
                  <div
                    className="relative flex items-center justify-center text-[10px] font-semibold border border-dashed border-green-300"
                    style={{ height: row.paddingBottom, background: 'rgba(134,239,172,0.15)', color: '#16a34a', cursor: 'ns-resize' }}
                    onMouseDown={e => startResize(e, row.id, 'bottom')}
                  >
                    {resizeIndicator?.rowId === row.id && resizeIndicator.edge === 'bottom'
                      ? `${resizeIndicator.value} píxeles`
                      : `${row.paddingBottom} píxeles`}
                  </div>
                )}

                {/* BOTTOM resize handle */}
                {selectedRowId === row.id && (
                  <div
                    className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center"
                    style={{ height: 10, cursor: 'ns-resize', marginBottom: -5 }}
                    onMouseDown={e => startResize(e, row.id, 'bottom')}
                  >
                    <div className="w-full h-1 rounded-full" style={{ background: '#f472b6' }} />
                  </div>
                )}
              </div>
            ))}

            {/* Empty state / drop zone */}
            <div
              className={`flex flex-col items-center justify-center py-16 gap-4 transition-colors ${canvasDropActive && rows.length === 0 ? 'bg-indigo-50' : ''}`}
              style={{ display: rows.length > 0 ? 'none' : 'flex' }}
            >
              <div className="flex gap-3">
                <button
                  onClick={() => { const r = makeRow([1, 1]); setRows([r]); setSelectedRowId(r.id); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: '#6366f1' }}
                >
                  <Plus size={14} /> Agregar fila
                </button>
                <button
                  onClick={() => { const r = makeRow([1]); setRows([r]); setSelectedRowId(r.id); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: '#f59e0b' }}
                >
                  <LayoutTemplate size={14} /> Agregar sección
                </button>
              </div>
              <p className="text-[12px] text-gray-400">o arrastrar elementos desde la barra lateral</p>
            </div>

            {/* Add row button at bottom */}
            {rows.length > 0 && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <button
                  onClick={() => { const r = makeRow([1, 1]); setRows(p => [...p, r]); setSelectedRowId(r.id); }}
                  className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#6366f1] transition-colors"
                >
                  <Plus size={12} /> Agregar fila
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-60 bg-[#111827] border-l border-white/10 overflow-y-auto shrink-0">
          {selectedRow ? (
            <>
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Columns2 size={13} className="text-gray-400" />
                  <span className="text-[12px] font-semibold text-white">Fila</span>
                </div>
                <button onClick={() => setSelectedRowId(null)} className="text-gray-600 hover:text-gray-400 text-lg leading-none">×</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button className="flex-1 py-2 text-[10px] font-semibold text-[#6366f1] border-b-2 border-[#6366f1]">Ajustes</button>
                <button className="flex-1 py-2 text-[10px] text-gray-500 hover:text-gray-300">Más</button>
              </div>

              <div className="px-4 py-4 space-y-5">
                {/* Disposición */}
                <div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">Disposición</p>
                  <p className="text-[9px] text-gray-500 mb-2">De oficina</p>
                  <div className="grid grid-cols-4 gap-1">
                    {LAYOUT_PRESETS.map((preset, i) => {
                      const isActive = selectedRow.columns.length === preset.cols.length &&
                        selectedRow.columns.every((c, ci) => c.flex === preset.cols[ci]);
                      return (
                        <button
                          key={i}
                          onClick={() => changeRowLayout(selectedRow.id, preset.cols)}
                          className={`rounded p-1.5 border transition-all flex items-center justify-center gap-0.5 ${isActive ? 'border-[#6366f1] bg-[#6366f1]/20' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                          title={preset.label}
                        >
                          {preset.cols.map((w, ci) => (
                            <div key={ci} className={`rounded-sm ${isActive ? 'bg-[#6366f1]' : 'bg-gray-600'}`} style={{ height: 16, flex: w }} />
                          ))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tablet layout */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tablet size={11} className="text-gray-500" />
                    <p className="text-[9px] text-gray-500">Tableta</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {/* "inherit" option */}
                    <button
                      onClick={() => setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, tabletLayout: null }))}
                      className={`rounded p-1.5 border transition-all flex items-center justify-center text-[8px] font-bold ${selectedRow.tabletLayout === null ? 'border-[#6366f1] bg-[#6366f1]/20 text-[#6366f1]' : 'border-white/10 hover:border-white/30 bg-white/5 text-gray-500'}`}
                      title="Igual que escritorio"
                    >
                      =
                    </button>
                    {LAYOUT_PRESETS.map((preset, i) => {
                      const isActive = selectedRow.tabletLayout !== null &&
                        selectedRow.tabletLayout.length === preset.cols.length &&
                        selectedRow.tabletLayout.every((v, ci) => v === preset.cols[ci]);
                      return (
                        <button
                          key={i}
                          onClick={() => setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, tabletLayout: preset.cols }))}
                          className={`rounded p-1.5 border transition-all flex items-center justify-center gap-0.5 ${isActive ? 'border-[#ec4899] bg-[#ec4899]/20' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                          title={preset.label}
                        >
                          {preset.cols.map((w, ci) => (
                            <div key={ci} className={`rounded-sm ${isActive ? 'bg-[#ec4899]' : 'bg-gray-600'}`} style={{ height: 14, flex: w }} />
                          ))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile layout */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Smartphone size={11} className="text-gray-500" />
                    <p className="text-[9px] text-gray-500">Móvil</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {/* "stack" default */}
                    <button
                      onClick={() => setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, mobileLayout: null }))}
                      className={`rounded p-1.5 border transition-all flex items-center justify-center text-[8px] font-bold ${selectedRow.mobileLayout === null ? 'border-[#ec4899] bg-[#ec4899]/20 text-[#ec4899]' : 'border-white/10 hover:border-white/30 bg-white/5 text-gray-500'}`}
                      title="Apilar (1 columna)"
                    >
                      ↕
                    </button>
                    {LAYOUT_PRESETS.map((preset, i) => {
                      const isActive = selectedRow.mobileLayout !== null &&
                        selectedRow.mobileLayout.length === preset.cols.length &&
                        selectedRow.mobileLayout.every((v, ci) => v === preset.cols[ci]);
                      return (
                        <button
                          key={i}
                          onClick={() => setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, mobileLayout: preset.cols }))}
                          className={`rounded p-1.5 border transition-all flex items-center justify-center gap-0.5 ${isActive ? 'border-[#ec4899] bg-[#ec4899]/20' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                          title={preset.label}
                        >
                          {preset.cols.map((w, ci) => (
                            <div key={ci} className={`rounded-sm ${isActive ? 'bg-[#ec4899]' : 'bg-gray-600'}`} style={{ height: 14, flex: w }} />
                          ))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Columns count */}
                <div>
                  <p className="text-[9px] text-gray-500 mb-1.5">Número de columnas</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { const n = Math.max(1, selectedRow.columns.length - 1); changeRowLayout(selectedRow.id, Array(n).fill(1)); }} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><span className="text-sm leading-none">−</span></button>
                    <span className="flex-1 text-center text-sm font-bold text-white">{selectedRow.columns.length}</span>
                    <button onClick={() => { const n = Math.min(4, selectedRow.columns.length + 1); changeRowLayout(selectedRow.id, Array(n).fill(1)); }} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><Plus size={13} /></button>
                  </div>
                </div>

                {/* Padding */}
                <div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">Espaciado interno</p>
                  <div className="space-y-2">
                    {(['top', 'bottom'] as const).map(edge => (
                      <div key={edge} className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 w-16 shrink-0">{edge === 'top' ? 'Superior' : 'Inferior'}</span>
                        <div className="flex-1 flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                          <button
                            onClick={() => setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, [edge === 'top' ? 'paddingTop' : 'paddingBottom']: Math.max(0, (edge === 'top' ? r.paddingTop : r.paddingBottom) - 4) }))}
                            className="text-gray-400 hover:text-white text-sm w-4 text-center"
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            value={(edge === 'top' ? selectedRow.paddingTop : selectedRow.paddingBottom) === 0 ? '' : (edge === 'top' ? selectedRow.paddingTop : selectedRow.paddingBottom)}
                            onChange={e => {
                              const raw = e.target.value;
                              const v = raw === '' ? 0 : Math.max(0, parseInt(raw) || 0);
                              setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, [edge === 'top' ? 'paddingTop' : 'paddingBottom']: v }));
                            }}
                            className="flex-1 bg-transparent text-center text-[11px] text-white outline-none w-0"
                          />
                          <span className="text-[9px] text-gray-600">px</span>
                          <button
                            onClick={() => setRows(prev => prev.map(r => r.id !== selectedRow.id ? r : { ...r, [edge === 'top' ? 'paddingTop' : 'paddingBottom']: (edge === 'top' ? r.paddingTop : r.paddingBottom) + 4 }))}
                            className="text-gray-400 hover:text-white text-sm w-4 text-center"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete row */}
                <button
                  onClick={() => deleteRow(selectedRow.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-500/30 text-red-400 text-[11px] hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} /> Eliminar fila
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Útil</p>
              </div>
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-[10px] text-gray-500 mb-2">Barra superior</p>
                <button className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-white transition-colors">
                  <Eye size={12} /> Ver elemento oculto
                </button>
              </div>
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-[10px] text-gray-500 mb-2">Atajo de teclado</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-300 font-mono">Ctrl</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-300 font-mono">Z</span>
                    <span className="text-[9px] text-gray-500 ml-1">Deshacer</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-300 font-mono">Ctrl</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-300 font-mono">Shift</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-300 font-mono">Z</span>
                    <span className="text-[9px] text-gray-500 ml-1">Rehacer</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-gray-500 mb-2">Resumen de la publicación</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 rounded-md bg-white/10 text-[9px] text-gray-300">Encabezado y pie de página</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-500">Carga diferida</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-400">apagado</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlankEditorPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#111827]"><Loader2 size={28} className="animate-spin text-[#6366f1]" /></div>}>
      <BlankEditorContent />
    </Suspense>
  );
}
