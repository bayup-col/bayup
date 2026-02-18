"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  ChevronLeft, 
  Sparkles, 
  Layout, 
  Eye, 
  CheckCircle2,
  Search,
  Filter,
  Star,
  Zap,
  Smartphone,
  Monitor,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateTemplateSchema } from '@/lib/templates-config';
import { shopPageService } from '@/lib/api';
import { useToast } from '@/context/toast-context';

// --- MOCK DATA DE TODAS LAS PLANTILLAS ---
const ALL_TEMPLATES = [
    { 
        id: 't1', 
        name: 'Silicon Pro', 
        category: 'Tecnología',
        desc: 'Inspirada en el minimalismo de Cupertino. Foco quirúrgico en el detalle, tipografías premium y una experiencia de usuario legendaria.', 
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop', 
        color: 'bg-gray-200',
        stats: { conversion: '5.4%', difficulty: 'Baja' }
    },
    { 
        id: 't2', 
        name: 'Pixel Tech', 
        category: 'Tecnología',
        desc: 'Interfaz optimizada para la venta de celulares, computadores y gadgets de última generación.', 
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop', 
        color: 'bg-blue-600',
        stats: { conversion: '5.2%', difficulty: 'Media' }
    },
    { 
        id: 't3', 
        name: 'Vogue Pro', 
        category: 'Moda',
        desc: 'Diseño tipo revista de alta costura. Tipografías elegantes para vestidos y calzado de lujo.', 
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop', 
        color: 'bg-purple-500',
        stats: { conversion: '3.9%', difficulty: 'Alta' }
    },
    { 
        id: 't4', 
        name: 'Mechanic Pro', 
        category: 'Industrial',
        desc: 'Estructura robusta y técnica. Ideal para catálogos de repuestos mecánicos y herramientas.', 
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop', 
        color: 'bg-gray-800',
        stats: { conversion: '4.5%', difficulty: 'Media' }
    },
    { 
        id: 't5', 
        name: 'Hyper Speed', 
        category: 'Deportivo',
        desc: 'Dinamismo total. Diseñada específicamente para la venta de calzado deportivo y equipo fitness.', 
        image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=800&auto=format&fit=crop', 
        color: 'bg-rose-500',
        stats: { conversion: '5.5%', difficulty: 'Alta' }
    },
    { 
        id: 't6', 
        name: 'Collector Edition', 
        category: 'Coleccionables',
        desc: 'Diseño tipo vitrina con alta fidelidad visual. Ideal para Funko Pops y artículos de colección.', 
        image: 'https://images.unsplash.com/photo-1566576661368-2410a519808a?q=80&w=800&auto=format&fit=crop', 
        color: 'bg-indigo-600',
        stats: { conversion: '4.7%', difficulty: 'Baja' }
    },
];

const CATEGORIES = ['Todas', 'Moda', 'Tecnología', 'Industrial', 'Deportivo', 'Coleccionables'];

export default function TemplatesCatalog() {
    const router = useRouter();
    const { showToast } = useToast();
    const [selectedCat, setSelectedCat] = useState('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [activatingId, setActivatingId] = useState<string | null>(null);

    const filtered = ALL_TEMPLATES.filter(t => {
        const matchesCat = selectedCat === 'Todas' || t.category === selectedCat;
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const handleActivateTemplate = async (templateId: string) => {
        const token = localStorage.getItem("token");
        if (!token) {
            showToast("No se encontró sesión activa", "error");
            return;
        }

        setActivatingId(templateId);
        try {
            // 1. Generar los esquemas para las 6 páginas (Home, Colecciones, Productos, Nosotros, Legal, Checkout)
            const fullStoreSchema = generateTemplateSchema(templateId);
            const pageKeys = Object.keys(fullStoreSchema);

            // 2. Guardar cada página en la base de datos
            const savePromises = pageKeys.map(key => {
                return shopPageService.save(token, {
                    page_key: key,
                    schema_data: fullStoreSchema[key as keyof typeof fullStoreSchema]
                });
            });

            await Promise.all(savePromises);
            
            showToast("¡Plantilla activada con éxito! Tu tienda ha sido rediseñada completamente.", "success");
            
            // 3. Redirigir a 'Mis Páginas' para que vean el resultado y puedan editar en Visual Pro v4.0
            setTimeout(() => {
                router.push('/dashboard/pages');
            }, 1500);

        } catch (e: any) {
            console.error("Template activation error:", e);
            showToast("Error al activar la plantilla. Inténtalo de nuevo.", "error");
        } finally {
            setActivatingId(null);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* --- HEADER TÁCTICO --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div className="space-y-4">
                    <Link href="/dashboard/my-store" className="flex items-center gap-2 text-gray-400 hover:text-purple-600 transition-colors w-fit group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Volver a Mi Tienda</span>
                    </Link>
                    <h1 className="text-5xl font-black italic text-gray-900 tracking-tighter">Catálogo de <span className="text-purple-600">Plantillas</span></h1>
                    <p className="text-gray-500 font-medium italic text-lg max-w-2xl">Elige el ADN visual de tu marca. Cada plantilla es una obra maestra de ingeniería y diseño.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 p-2 rounded-3xl border border-gray-100 backdrop-blur-xl">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar estilo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* --- FILTROS DE CATEGORÍA --- */}
            <div className="px-4 overflow-x-auto no-scrollbar pb-4">
                <div className="flex items-center gap-4 min-w-max">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCat(cat)}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                selectedCat === cat 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xl shadow-purple-200' 
                                : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200 hover:text-purple-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- GRID DE PLANTILLAS PREMIUM --- */}
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                <AnimatePresence mode='popLayout'>
                    {filtered.map((tpl, i) => (
                        <motion.div
                            key={tpl.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            onMouseEnter={() => setHoveredId(tpl.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className="group relative bg-white rounded-[4rem] border border-gray-100 shadow-sm hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden"
                        >
                            {/* Visual Preview */}
                            <div className="h-80 overflow-hidden relative">
                                <img 
                                    src={tpl.image} 
                                    alt={tpl.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                />
                                <div className={`absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl flex items-center gap-2 border border-white/50 shadow-sm transition-all duration-500 ${hoveredId === tpl.id ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
                                    <Sparkles size={14} className="text-purple-600" />
                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Premium Template</span>
                                </div>
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10 space-y-4">
                                    <button 
                                        onClick={() => window.open(`/shop/preview?tpl=${tpl.id}`, '_blank')}
                                        className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-purple-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500"
                                    >
                                        <Eye size={16} /> Vista Previa 360°
                                    </button>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{tpl.category}</p>
                                        <h4 className="text-2xl font-black text-gray-900 italic tracking-tighter">{tpl.name}</h4>
                                    </div>
                                    <div className={`h-3 w-3 rounded-full ${tpl.color} shadow-lg shadow-current/20 animate-pulse`} />
                                </div>

                                <p className="text-gray-500 text-xs leading-relaxed font-medium italic min-h-[40px]">"{tpl.desc}"</p>

                                {/* Mini Stats */}
                                <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Conversión</p>
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-amber-500" />
                                            <span className="text-sm font-black text-gray-900">{tpl.stats.conversion}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 border-l border-gray-50 pl-4">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Dificultad</p>
                                        <div className="flex items-center gap-2">
                                            <Layout size={14} className="text-blue-500" />
                                            <span className="text-sm font-black text-gray-900">{tpl.stats.difficulty}</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleActivateTemplate(tpl.id)}
                                    disabled={activatingId !== null}
                                    className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${
                                        activatingId === tpl.id 
                                        ? 'bg-gray-100 text-gray-400 cursor-wait' 
                                        : 'bg-gray-900 text-white hover:bg-purple-600 hover:shadow-2xl hover:shadow-purple-200'
                                    }`}
                                >
                                    {activatingId === tpl.id ? (
                                        <> <Loader2 className="animate-spin" size={16}/> Activando Motor Visual... </>
                                    ) : (
                                        <> Activar Plantilla <ArrowRight size={16} /> </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="py-40 text-center space-y-6">
                    <div className="h-24 w-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-gray-200">
                        <Search size={48} />
                    </div>
                    <p className="text-xl font-black text-gray-300 italic uppercase">No encontramos plantillas con ese criterio</p>
                    <button onClick={() => {setSearchTerm(''); setSelectedCat('Todas');}} className="text-purple-600 font-black text-[10px] uppercase tracking-widest underline underline-offset-8">Limpiar filtros</button>
                </div>
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
