"use client";

const PLANS = [
    { name: 'Emprendedor', price: '0', features: ['Hasta 50 productos', '1 usuario staff', 'Dominio bayup.com', 'Comisión 2%'], current: true },
    { name: 'Negocio Pro', price: '49', features: ['Productos ilimitados', '5 usuarios staff', 'Dominio propio', 'Comisión 0.5%', 'Chat Inteligente IA'], current: false },
    { name: 'Empresa Gold', price: '129', features: ['Todo lo Pro', 'Staff ilimitado', 'Soporte prioritario 24/7', 'App móvil propia', 'Comisión 0%'], current: false },
];

export default function PlanSettings() {
    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div className="text-center">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tu Plan Actual</h1>
                <p className="text-gray-500 mt-1">Escala tu negocio con nuestras herramientas premium.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <div key={plan.name} className={`relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${plan.current ? 'bg-purple-600 border-purple-600 text-white shadow-2xl scale-105 z-10' : 'bg-white border-gray-100 text-gray-900 hover:border-purple-200 shadow-sm'}`}>
                        {plan.current && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-purple-600 text-[10px] font-black px-4 py-1 rounded-full shadow-lg uppercase tracking-widest">Activo</span>}
                        <h3 className="text-xl font-black mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-black">${plan.price}</span>
                            <span className={plan.current ? 'text-purple-200' : 'text-gray-400'}>/mes</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {plan.features.map(f => (
                                <li key={f} className="flex items-center gap-3 text-xs font-bold">
                                    <span className={plan.current ? 'text-white' : 'text-purple-600'}>✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${plan.current ? 'bg-white text-purple-600 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-black'}`}>
                            {plan.current ? 'Gestionar Plan' : 'Cambiar a este plan'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Tarjeta de Pago */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <h2 className="text-lg font-bold text-gray-800">Método de pago para suscripción</h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="text-2xl">💳</div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Visa terminada en 4242</p>
                            <p className="text-xs text-gray-400 font-medium italic text-gray-400">Expira 12/26</p>
                        </div>
                    </div>
                    <button className="text-purple-600 font-bold text-xs hover:underline">Actualizar tarjeta</button>
                </div>
            </div>
        </div>
    );
}
