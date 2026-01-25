"use client";

import { useState, useMemo } from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    image_url: string | null;
    category: string;
}

interface CatalogDraft {
    id: string;
    name: string;
    header: string;
    selectedIds: string[];
    lastModified: string;
}

const MOCK_PRODUCTS: Product[] = [
    { id: "1", name: "Camiseta Básica Oversize", price: 250, stock: 45, image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&h=200&auto=format&fit=crop', category: "Ropa" },
    { id: "2", name: "Zapatillas Urban Pro", price: 1200, stock: 12, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&h=200&auto=format&fit=crop', category: "Calzado" },
    { id: "3", name: "Gorra Snapback", price: 350, stock: 8, image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=200&h=200&auto=format&fit=crop', category: "Accesorios" },
    { id: "4", name: "Reloj Minimalist", price: 2500, stock: 3, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&h=200&auto=format&fit=crop', category: "Accesorios" },
    { id: "5", name: "Calcetines Pack x3", price: 120, stock: 150, image_url: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?q=80&w=200&h=200&auto=format&fit=crop', category: "Ropa" },
];

export default function CatalogsPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [catalogName, setCatalogName] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState("Todas");
    const [headerText, setHeaderText] = useState("🔥 ¡Mira lo nuevo que llegó a nuestra tienda! 🔥");
    const [drafts, setDrafts] = useState<CatalogDraft[]>([]);

    // URL base de la tienda (esto sería dinámico en producción)
    const storeDomain = "basecommerce.com/tienda-demo";

    const categories = ["Todas", ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))];

    const toggleProduct = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const generatedMessage = useMemo(() => {
        const selected = MOCK_PRODUCTS.filter(p => selectedIds.includes(p.id));
        if (selected.length === 0) return "";

        let msg = `*${catalogName || 'Catálogo de Productos'}*\n`;
        msg += `${headerText}\n\n`;
        
        selected.forEach((p) => {
            msg += `🛍️ *${p.name}*\n`;
            msg += `💰 Precio: *$${p.price.toFixed(2)}*\n`;
            msg += `🔗 Ver y comprar: https://${storeDomain}/p/${p.id}\n`;
            msg += `--------------------------\n`;
        });

        msg += `\n🛡️ *Haz una compra segura en ${storeDomain}*\n`;
        msg += `🚀 Envíos garantizados y pago protegido.`;
        return msg;
    }, [selectedIds, catalogName, headerText, storeDomain]);

    const handleSaveDraft = () => {
        const newDraft = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: catalogName || "Catálogo sin nombre",
            header: headerText,
            selectedIds: selectedIds,
            lastModified: new Date().toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };
        if (editingId) setDrafts(prev => prev.map(d => d.id === editingId ? newDraft : d));
        else setDrafts(prev => [newDraft, ...prev]);
        setIsCreating(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setCatalogName("");
        setSelectedIds([]);
        setHeaderText("🔥 ¡Mira lo nuevo que llegó a nuestra tienda! 🔥");
    };

    const handleSend = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(generatedMessage)}`, '_blank');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Catálogos WhatsApp</h1>
                    <p className="text-gray-500 mt-1 font-medium">Convierte tus chats en ventas enviando enlaces directos a tu web.</p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center gap-2">
                        <span className="text-xl">+</span> Crear catálogo
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-7 space-y-6">
                        {/* Configuración */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">Configuración</h2>
                                <button onClick={handleSaveDraft} className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">Guardar Borrador</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Nombre del catálogo" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                                <input type="text" placeholder="Texto de bienvenida" value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>

                        {/* Selección de Productos */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h2 className="font-bold">Selecciona los productos</h2>
                                <select onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs font-bold bg-white border border-gray-200 p-2 rounded-lg outline-none">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 max-h-[400px] overflow-y-auto">
                                {MOCK_PRODUCTS.filter(p => categoryFilter === "Todas" || p.category === categoryFilter).map(product => (
                                    <div key={product.id} onClick={() => toggleProduct(product.id)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border-2 transition-all ${selectedIds.includes(product.id) ? 'border-purple-500 bg-purple-50/30' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                                        <div className="h-12 w-12 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                                            <img src={product.image_url || ''} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                                            <p className="text-xs text-purple-600 font-bold">${product.price} • {product.stock} en stock</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview WhatsApp */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="sticky top-8">
                            <div className="bg-[#E5DDD5] rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px] border-gray-900">
                                <div className="bg-[#075E54] p-4 text-white flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-xl text-gray-600">👤</div>
                                    <div><p className="text-sm font-bold">Preview WhatsApp</p><p className="text-[10px] opacity-70">En línea</p></div>
                                </div>
                                <div className="p-6 h-[350px] overflow-y-auto" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'}}>
                                    {selectedIds.length > 0 ? (
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-md max-w-[90%] border-l-4 border-green-500">
                                            <pre className="text-[12px] whitespace-pre-wrap font-sans text-gray-800 leading-tight">{generatedMessage}</pre>
                                        </div>
                                    ) : <div className="h-full flex items-center justify-center text-gray-500 font-bold bg-white/40 rounded-3xl border-2 border-dashed border-gray-300 px-10 text-center">Selecciona productos para generar el mensaje</div>}
                                </div>
                                <div className="bg-white p-6 space-y-3">
                                    <button onClick={handleSend} disabled={selectedIds.length === 0} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${selectedIds.length > 0 ? 'bg-[#25D366] text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Compartir en WhatsApp</button>
                                    <button onClick={() => setIsCreating(false)} className="w-full py-2 text-xs font-bold text-gray-400">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Lista de Borradores */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {drafts.map(d => (
                        <div key={d.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl mb-4">📋</div>
                            <h3 className="font-bold text-gray-900">{d.name}</h3>
                            <p className="text-xs text-gray-400 mt-1">Editado el {d.lastModified}</p>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase">{d.selectedIds.length} productos</span>
                                <button onClick={() => { setEditingId(d.id); setCatalogName(d.name); setHeaderText(d.header); setSelectedIds(d.selectedIds); setIsCreating(true); }} className="text-sm font-bold text-gray-900 group-hover:text-purple-600">Editar →</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
