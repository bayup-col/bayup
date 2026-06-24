"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronRight, ChevronLeft, Loader2, Image as ImageIcon,
  Store, Package, Rocket, ShoppingBag, Smartphone, Sparkles, Activity, Edit3, LogOut, Eye
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { buildDefaultBodyElements } from '@/lib/default-page-schemas';

const CATEGORIES = [
  'Moda & Accesorios', 'Calzado', 'Tecnología', 'Hogar', 'Belleza',
  'Mascotas', 'Deportes', 'Alimentos', 'Joyería', 'Arte & Diseño',
];

const STEPS = ['Plantilla', 'Tu tienda', 'Tu primer producto'];

interface WebTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_url: string | null;
  schema_data: any;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading, updateUser, setOnboardingCompleted, logout } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  // Paso 1
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Paso 2
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phone, setPhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Paso 3
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/web-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [token, apiBase]);

  const selectedTemplate = templates.find(t => t.id === templateId) || null;

  const openPreview = () => {
    if (!selectedTemplate) return;
    localStorage.setItem('bayup-studio-preview', JSON.stringify(selectedTemplate.schema_data));
    window.open('/studio-preview', '_blank');
  };

  const handleStoreNameChange = (value: string) => {
    setStoreName(value);
    if (!slugTouched) {
      setSlug(value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const canContinueStep1 = !!templateId;
  const canContinueStep2 = storeName.trim().length > 0 && slug.trim().length > 0 && phone.trim().length > 0;
  const canPublish = productName.trim().length > 0 && Number(productPrice) > 0;

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${apiBase}/admin/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  };

  const handlePublish = async () => {
    if (!selectedTemplate) { setStep(0); return; }
    setIsPublishing(true);
    try {
      // 1. Logo (opcional)
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile);
      }

      // 2. Datos de la tienda
      const profileRes = await fetch(`${apiBase}/admin/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: storeName.trim(),
          shop_slug: slug.trim(),
          category,
          phone: phone.trim(),
          ...(logoUrl ? { logo_url: logoUrl } : {}),
        }),
      });
      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        throw new Error(err.detail || 'No se pudo guardar la información de tu tienda');
      }

      // 3. Instalar la plantilla elegida en Home
      const architecture = selectedTemplate.schema_data || {};
      const homeSchema = {
        header: architecture.header || { elements: [], styles: {} },
        footer: architecture.footer || { elements: [], styles: {} },
        body: architecture.body || { elements: [], styles: {} },
      };

      const pageSchemas: Record<string, any> = { home: homeSchema };
      for (const key of ['catalog', 'about', 'product'] as const) {
        pageSchemas[key] = {
          header: homeSchema.header,
          footer: homeSchema.footer,
          body: { elements: buildDefaultBodyElements(key), styles: {} },
        };
      }

      for (const [pageKey, schema] of Object.entries(pageSchemas)) {
        const saveRes = await fetch(`${apiBase}/shop-pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ page_key: pageKey, schema_data: schema, template_id: selectedTemplate.id }),
        });
        if (!saveRes.ok) throw new Error('No se pudo instalar la plantilla');
      }

      // 4. Publicar las 4 paginas de inmediato
      for (const [pageKey, schema] of Object.entries(pageSchemas)) {
        const pubRes = await fetch(`${apiBase}/shop-pages/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ page_key: pageKey, schema_data: schema }),
        });
        if (!pubRes.ok) throw new Error('No se pudo publicar tu tienda');
      }

      // 5. Primer producto
      let productImageUrl: string | null = null;
      if (productImageFile) {
        productImageUrl = await uploadImage(productImageFile);
      }
      const productRes = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: productName.trim(),
          price: Number(productPrice),
          description: productDescription.trim() || undefined,
          category,
          image_url: productImageUrl ? [productImageUrl] : [],
        }),
      });
      if (!productRes.ok) throw new Error('No se pudo crear tu primer producto');

      // 6. Marcar onboarding completado
      const completeRes = await fetch(`${apiBase}/onboarding/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!completeRes.ok) throw new Error('No se pudo finalizar el proceso');

      updateUser({ name: storeName.trim(), slug: slug.trim(), logo: logoUrl || undefined });
      setOnboardingCompleted(true);
      showToast('¡Tu tienda ya está publicada! 🚀', 'success');
      router.push('/dashboard');
    } catch (e: any) {
      showToast(e.message || 'Ocurrió un error al publicar tu tienda', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-2xl font-bold tracking-[0.15em] text-[#004d4d] animate-pulse uppercase">BAYUP</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col">
      {/* HEADER */}
      <header className="h-20 flex items-center justify-between px-6 md:px-10 border-b border-gray-100 bg-white/80 backdrop-blur-md shrink-0">
        <div className="text-xl font-black italic tracking-tighter">
          <span className="text-black">BAY</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b2bd] to-[#00f2ff]">UP.</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                  i < step ? 'bg-[#004d4d] border-[#004d4d] text-white' : i === step ? 'border-[#004d4d] text-[#004d4d]' : 'border-gray-200 text-gray-300'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${i === step ? 'text-[#004d4d]' : 'text-gray-300'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
          {selectedTemplate && (
            <button onClick={openPreview}
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-[#004d4d]/5 border border-[#004d4d]/15 text-[10px] font-black uppercase tracking-widest text-[#004d4d] hover:bg-[#004d4d]/10 transition-all">
              <Eye size={13} /> Vista previa
            </button>
          )}
          <button onClick={logout} className="text-gray-300 hover:text-rose-500 transition-colors" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00b2bd]">Paso 1 de 3</p>
                  <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-[#001A1A]">Elige tu plantilla</h1>
                  <p className="text-gray-500 font-medium max-w-xl">Selecciona el diseño con el que quieres lanzar tu tienda hoy mismo. Podrás pedir más diseños y personalizaciones más adelante.</p>
                </div>
                {templatesLoading ? (
                  <div className="py-20 flex items-center justify-center text-gray-300">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="py-20 text-center text-sm font-medium text-gray-400">
                    No hay plantillas disponibles por ahora. Contacta a soporte.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => setTemplateId(tpl.id)}
                        className={`group text-left rounded-[2rem] overflow-hidden border-2 transition-all bg-white ${
                          templateId === tpl.id ? 'border-[#004d4d] shadow-2xl scale-[1.02]' : 'border-gray-100 hover:border-[#004d4d]/30 shadow-sm'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                          {tpl.preview_url && <img src={tpl.preview_url} alt={tpl.name} className="w-full h-full object-cover" />}
                          {templateId === tpl.id && (
                            <div className="absolute top-3 right-3 h-7 w-7 bg-[#004d4d] rounded-full flex items-center justify-center text-white shadow-lg">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                        <div className="p-5 space-y-1">
                          <p className="text-sm font-black uppercase tracking-tight text-gray-900">{tpl.name}</p>
                          <p className="text-[11px] text-gray-400 font-medium line-clamp-2">{tpl.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 max-w-xl">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00b2bd]">Paso 2 de 3</p>
                  <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-[#001A1A]">Datos de tu tienda</h1>
                  <p className="text-gray-500 font-medium">Con esto ya queda lista la información básica para publicar. Lo demás (NIT, horarios, redes) lo completas después en Config Tienda.</p>
                </div>

                <div className="flex items-center gap-5">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="h-20 w-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden shrink-0 hover:border-[#004d4d]/30 transition-all"
                  >
                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" /> : <ImageIcon size={24} />}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
                  }} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo (opcional)</p>
                    <p className="text-[11px] text-gray-400 mt-1">Puedes agregarlo ahora o más tarde.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de tu tienda *</label>
                  <input value={storeName} onChange={e => handleStoreNameChange(e.target.value)} placeholder="Ej. Tech Hub Colombia"
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-bold focus:border-[#004d4d] shadow-sm transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL de tu tienda *</label>
                  <div className="flex items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-[#004d4d] transition-all">
                    <span className="text-[12px] font-bold text-gray-300 shrink-0">bayup.com.co/shop/</span>
                    <input value={slug} onChange={e => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                      placeholder="mi-tienda" className="flex-1 outline-none text-sm font-bold bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoría *</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-bold focus:border-[#004d4d] shadow-sm transition-all">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp de tu tienda *</label>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d+]/g, ''))} placeholder="3000000000"
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-bold focus:border-[#004d4d] shadow-sm transition-all" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 max-w-xl">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00b2bd]">Paso 3 de 3</p>
                  <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-[#001A1A]">Tu primer producto</h1>
                  <p className="text-gray-500 font-medium">Para que tu tienda no se vea vacía el día que la publiques. Podrás subir el resto del catálogo después.</p>
                </div>

                <div className="flex items-center gap-5">
                  <button
                    onClick={() => productImageInputRef.current?.click()}
                    className="h-24 w-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden shrink-0 hover:border-[#004d4d]/30 transition-all"
                  >
                    {productImagePreview ? <img src={productImagePreview} className="w-full h-full object-cover" alt="Producto" /> : <ImageIcon size={28} />}
                  </button>
                  <input ref={productImageInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setProductImageFile(f); setProductImagePreview(URL.createObjectURL(f)); }
                  }} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Foto del producto (opcional)</p>
                    <p className="text-[11px] text-gray-400 mt-1">Recomendado para que se vea bien en tu catálogo.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del producto *</label>
                  <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ej. Camiseta Premium"
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-bold focus:border-[#004d4d] shadow-sm transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio (COP) *</label>
                  <input type="number" min="0" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="50000"
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-bold focus:border-[#004d4d] shadow-sm transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción (opcional)</label>
                  <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} rows={3} placeholder="Describe brevemente tu producto..."
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none text-sm font-medium focus:border-[#004d4d] shadow-sm transition-all resize-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVEGACION */}
          <div className="flex items-center justify-between mt-14 max-w-xl">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0 || isPublishing}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all disabled:opacity-0"
            >
              <ChevronLeft size={16} /> Atrás
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 0 && !canContinueStep1) || (step === 1 && !canContinueStep2)}
                className="flex items-center gap-3 px-10 py-5 bg-[#001A1A] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continuar <ChevronRight size={16} className="text-[#00f2ff]" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
                className="flex items-center gap-3 px-10 py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#003838] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <><Loader2 size={18} className="animate-spin" /> Publicando tu tienda...</>
                ) : (
                  <><Rocket size={18} className="text-[#00f2ff]" /> Publicar mi tienda</>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
