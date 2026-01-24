"use client";

import Link from 'next/link';

export default function MyStorePage() {
  
  const themes = [
    { id: 1, name: 'Minimalist Aura', desc: 'Limpio, moderno y enfocado en el producto.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&h=250&auto=format&fit=crop' },
    { id: 2, name: 'Vogue Boutique', desc: 'Elegancia clásica para tiendas de moda.', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&h=250&auto=format&fit=crop' },
    { id: 3, name: 'Tech Pulse', desc: 'Diseño oscuro y vibrante para tecnología.', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&h=250&auto=format&fit=crop' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mi Tienda</h1>
        <p className="text-gray-500 mt-2 text-lg">Gestiona el diseño y la apariencia de tu canal de ventas.</p>
      </div>

      {/* 1. PAGINA ACTIVA (Card Sofisticado) */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            Versión Publicada
        </h2>
        
        <div className="relative group overflow-hidden bg-white rounded-[2rem] border border-gray-100 shadow-2xl transition-all duration-500 hover:shadow-purple-500/10">
            <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
                {/* Preview Thumbnail */}
                <div className="lg:col-span-3 bg-gray-50 relative overflow-hidden border-r border-gray-50">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent z-10"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop" 
                        alt="Preview Tienda" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase text-gray-700 tracking-widest">En línea</span>
                    </div>
                </div>

                {/* Info & Actions */}
                <div className="lg:col-span-2 p-8 flex flex-col justify-center space-y-6">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">Tu Tienda Principal</h3>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                            Esta es la versión que tus clientes ven actualmente. Los cambios realizados aquí se reflejan al instante.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2">
                            <span>Personalizar diseño</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
                                Vista previa
                            </button>
                            <button className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.007.51.01.77.01.28 0 .557-.01.81-.02m0-9.16c.253-.007.51-.01.77-.01.28 0 .557.01.81.02m0 9.16c.688.06 1.386.09 2.09.09H16.5a4.5 4.5 0 100-9h-.75c-.704 0-1.402.03-2.09.09m-4.75 1.238a7.464 7.464 0 01-2.25 4.484m11.25-4.484a7.464 7.464 0 012.25 4.484" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 2. BORRADOR (Card más pequeño y sencillo) */}
      <section className="space-y-4 max-w-3xl">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Trabajando en...</h2>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-white">
                <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl border border-white/10">
                    ✍️
                </div>
                <div>
                    <h4 className="font-bold text-lg italic">Rediseño Temporada Invierno</h4>
                    <p className="text-gray-400 text-xs">Última edición: hace 2 horas</p>
                </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none bg-white text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-all">
                    Continuar editando
                </button>
                <button className="text-white hover:text-red-400 transition-colors p-2" title="Descartar borrador">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        </div>
      </section>

      {/* 3. TEMAS (Galería de tarjetas) */}
      <section className="pt-8 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Temas</h2>
                <p className="text-gray-500 text-sm mt-1">Plantillas premium diseñadas para maximizar tus ventas.</p>
            </div>
            <button className="text-purple-600 font-bold text-sm hover:underline">Ver tienda de temas →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {themes.map((theme) => (
                <div key={theme.id} className="group flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                    <div className="h-48 overflow-hidden relative">
                        <img 
                            src={theme.image} 
                            alt={theme.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold text-sm transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                Vista previa
                            </button>
                        </div>
                    </div>
                    <div className="p-6 space-y-3">
                        <h4 className="text-lg font-bold text-gray-900">{theme.name}</h4>
                        <p className="text-gray-500 text-xs leading-relaxed">{theme.desc}</p>
                        <button className="w-full mt-2 py-2.5 border-2 border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:border-purple-600 group-hover:text-purple-600 transition-all">
                            Usar este tema
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </section>

    </div>
  );
}
