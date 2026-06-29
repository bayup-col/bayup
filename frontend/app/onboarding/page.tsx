"use client";

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronRight, ChevronLeft, Loader2, Image as ImageIcon,
  Store, Package, Rocket, ShoppingBag, Smartphone, Sparkles, Activity, Edit3, LogOut, Eye, X, Upload
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { buildDefaultBodyElements } from '@/lib/default-page-schemas';

const CATEGORIES = [
  'Moda & Accesorios', 'Calzado', 'Tecnología', 'Hogar', 'Belleza',
  'Mascotas', 'Deportes', 'Alimentos', 'Joyería', 'Arte & Diseño',
];

// Menú estándar de cualquier e-commerce. Las plantillas traen categorías de
// muestra (Mujer/Hombre/Niños/Ofertas) que no aplican a todos los rubros —
// se normalizan aquí, una sola vez al cargar las plantillas, para que tanto
// el editor de onboarding como la tienda publicada usen siempre estos items.
const STANDARD_MENU_ITEMS = ['Inicio', 'Colecciones', 'Productos', 'Nosotros'];

const withStandardMenu = (tpl: WebTemplate): WebTemplate => {
  if (!tpl.schema_data?.header?.elements) return tpl;
  const schema_data = JSON.parse(JSON.stringify(tpl.schema_data));
  const navbarEl = (schema_data.header.elements || []).find((el: any) => el.type === 'navbar');
  if (navbarEl) navbarEl.props = { ...navbarEl.props, menuItems: STANDARD_MENU_ITEMS };
  return { ...tpl, schema_data };
};

const STEPS = ['Plantilla', 'Tu tienda', 'Tu primer producto'];

interface WebTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_url: string | null;
  schema_data: any;
  template_type?: 'schema' | 'html';
  html_pages?: string[];
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]"><Loader2 size={28} className="animate-spin text-petroleum" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Si viene de "Registros" del super admin, este wizard configura la
  // tienda de ESE cliente en vez de la del usuario autenticado (que en ese
  // caso es el propio super-admin). Ver backend `_resolve_target_user`.
  const targetUserId = searchParams.get('targetUserId');
  const { token, isAuthenticated, isLoading, userName, userEmail, userStatus, isGlobalStaff, updateUser, refreshToken, setOnboardingCompleted, logout } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return Number(sessionStorage.getItem('bayup_ob_step') || 0);
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // Correccion de los datos del registro (nombre/correo), accesible desde el
  // Paso 1 por si el usuario se equivoco al crear la cuenta y quiere arreglarlo
  // antes de seguir, sin tener que volver a /register (eso crearia una cuenta
  // nueva en vez de editar la actual).
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Paso 1
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('bayup_ob_template') || null;
  });

  // Paso 2
  const [storeName, setStoreName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('bayup_ob_store_name') || '';
  });
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phone, setPhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('bayup_ob_logo_preview') || null;
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('bayup_ob_logo_url') || null;
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Paso 3
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const bulkProductsInputRef = useRef<HTMLInputElement>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<{ created: number; errors: string[] } | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Carga masiva de productos desde un Excel — alternativa a llenar el
  // formulario de "primer producto" uno por uno. Independiente del resto
  // del wizard: se sube apenas se elige el archivo, no espera a "Publicar".
  const handleBulkProductsUpload = async (file: File) => {
    setIsBulkUploading(true);
    setBulkUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (targetUserId) fd.append('target_user_id', targetUserId);
      const res = await fetch(`${apiBase}/products/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'No se pudo procesar el archivo');
      }
      const data = await res.json();
      setBulkUploadResult(data);
      if (data.created > 0) showToast(`${data.created} producto${data.created !== 1 ? 's' : ''} cargado${data.created !== 1 ? 's' : ''} correctamente`, 'success');
      if (data.errors?.length > 0 && data.created === 0) showToast('No se pudo cargar ningún producto — revisa el detalle', 'error');
    } catch (e: any) {
      showToast(e.message || 'No se pudo procesar el archivo', 'error');
    } finally {
      setIsBulkUploading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  // Registro recién creado: todavía no puede elegir/configurar su propia
  // tienda — espera a que el equipo Bayup lo haga por él desde "Registros".
  // No aplica cuando es un super-admin operando este wizard en nombre de
  // OTRO usuario (targetUserId en la URL) — su propio status es "Activo".
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isGlobalStaff && userStatus === 'Pendiente') {
      router.replace('/registro-pendiente');
    }
  }, [isLoading, isAuthenticated, isGlobalStaff, userStatus, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/web-templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setTemplates(Array.isArray(data) ? data.map(withStandardMenu) : []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [token, apiBase]);

  // Persistir progreso del onboarding en sessionStorage
  useEffect(() => { sessionStorage.setItem('bayup_ob_step', String(step)); }, [step]);
  useEffect(() => {
    if (templateId) sessionStorage.setItem('bayup_ob_template', templateId);
    else sessionStorage.removeItem('bayup_ob_template');
  }, [templateId]);
  useEffect(() => { sessionStorage.setItem('bayup_ob_store_name', storeName); }, [storeName]);
  useEffect(() => {
    if (logoPreview) sessionStorage.setItem('bayup_ob_logo_preview', logoPreview);
    else sessionStorage.removeItem('bayup_ob_logo_preview');
  }, [logoPreview]);
  useEffect(() => {
    if (logoUrl) sessionStorage.setItem('bayup_ob_logo_url', logoUrl);
    else sessionStorage.removeItem('bayup_ob_logo_url');
  }, [logoUrl]);

  const selectedTemplate = templates.find(t => t.id === templateId) || null;

  // Ediciones del comerciante por plantilla (banner, menú, estilo visual,
  // productos de muestra), hechas en /onboarding/editor. Se guardan en
  // sessionStorage por id de plantilla para sobrevivir la navegación entre
  // esa página y esta. Si no hay edición, se usa el esquema original.
  const [schemaOverrides, setSchemaOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    if (templates.length === 0) return;
    const hydrated: Record<string, any> = {};
    templates.forEach(tpl => {
      const raw = sessionStorage.getItem(`bayup_ob_schema_override_${tpl.id}`);
      if (raw) {
        try { hydrated[tpl.id] = JSON.parse(raw); } catch {}
      }
    });
    if (Object.keys(hydrated).length > 0) setSchemaOverrides(prev => ({ ...hydrated, ...prev }));
  }, [templates]);

  const schemaFor = (tpl: WebTemplate) => schemaOverrides[tpl.id] || tpl.schema_data;

  const openEditor = (tpl: WebTemplate) => {
    setTemplateId(tpl.id);
    router.push(`/onboarding/editor?templateId=${tpl.id}${targetUserId ? `&targetUserId=${targetUserId}` : ''}`);
  };

  const openPreview = (tpl?: WebTemplate | null) => {
    const target = tpl || selectedTemplate;
    if (!target) return;
    if (target.template_type === 'html') {
      const firstPage = (target.html_pages && target.html_pages[0]) || 'home';
      window.open(`${apiBase}/web-templates/${target.id}/preview/${firstPage}?token=${encodeURIComponent(token || '')}`, '_blank');
      return;
    }
    localStorage.setItem('bayup-studio-preview', JSON.stringify(schemaFor(target)));
    window.open('/studio-preview', '_blank');
  };

  const openEditAccount = () => {
    setAccountName(userName || '');
    setAccountEmail(userEmail || '');
    setShowEditAccount(true);
  };

  const saveAccount = async () => {
    if (!accountName.trim() || !accountEmail.trim()) return;
    setSavingAccount(true);
    try {
      const res = await fetch(`${apiBase}/admin/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: accountName.trim(), email: accountEmail.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'No se pudieron guardar tus datos');
      }
      const data = await res.json().catch(() => ({}));
      updateUser({ name: accountName.trim() });
      if (data.access_token) {
        // El email cambio: el backend emitio un token nuevo porque el viejo
        // (firmado con el email anterior) ya no es valido para esta cuenta.
        refreshToken(data.access_token, accountEmail.trim());
      }
      showToast('Tus datos se actualizaron correctamente', 'success');
      setShowEditAccount(false);
    } catch (e: any) {
      showToast(e.message || 'No se pudieron guardar tus datos', 'error');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleStoreNameChange = (value: string) => {
    setStoreName(value);
    if (!slugTouched) {
      setSlug(value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleLogoPick = async (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      setLogoUrl(url);
    } finally {
      setUploadingLogo(false);
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
      // 1. Logo (opcional) — si ya se subió al elegirlo (o desde el editor),
      // se reutiliza esa URL en vez de volver a subir el archivo.
      let finalLogoUrl: string | null = logoUrl;
      if (!finalLogoUrl && logoFile) {
        finalLogoUrl = await uploadImage(logoFile);
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
          ...(finalLogoUrl ? { logo_url: finalLogoUrl } : {}),
          ...(targetUserId ? { target_user_id: targetUserId } : {}),
        }),
      });
      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        throw new Error(err.detail || 'No se pudo guardar la información de tu tienda');
      }

      // 3. Instalar la plantilla elegida.
      if (selectedTemplate.template_type === 'html') {
        // Plantilla HTML: su contenido vive en WebTemplate.html_pages, no en
        // schema_data — cada ShopPage solo guarda la referencia (template_id)
        // y el backend resuelve el HTML real al servir la tienda publicada.
        const pageKeys = selectedTemplate.html_pages && selectedTemplate.html_pages.length > 0 ? selectedTemplate.html_pages : ['home'];
        const saveResults = await Promise.all(pageKeys.map(pageKey =>
          fetch(`${apiBase}/shop-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ page_key: pageKey, schema_data: {}, template_id: selectedTemplate.id, ...(targetUserId ? { target_user_id: targetUserId } : {}) }),
          })
        ));
        if (saveResults.some(r => !r.ok)) throw new Error('No se pudo instalar la plantilla');
        const pubResults = await Promise.all(pageKeys.map(pageKey =>
          fetch(`${apiBase}/shop-pages/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ page_key: pageKey, schema_data: {}, ...(targetUserId ? { target_user_id: targetUserId } : {}) }),
          })
        ));
        if (pubResults.some(r => !r.ok)) throw new Error('No se pudo publicar tu tienda');
      } else {
        // Plantilla schema: reemplaza el nombre/logo de muestra del diseño
        // por los datos reales que el usuario acaba de ingresar. Sin esto,
        // la tienda publicada sale con el texto/logo de fábrica de la
        // plantilla en vez de la marca del comerciante.
        const architecture = schemaFor(selectedTemplate) || {};
        const brandedSection = (section: any) => {
          if (!section?.elements) return section;
          return {
            ...section,
            elements: section.elements.map((el: any) =>
              (el.type === 'navbar' || el.type === 'footer-premium')
                ? { ...el, props: { ...el.props, logoText: storeName.trim(), ...(finalLogoUrl ? { logoUrl: finalLogoUrl } : {}) } }
                : el
            ),
          };
        };

        const homeSchema = {
          header: brandedSection(architecture.header || { elements: [], styles: {} }),
          footer: brandedSection(architecture.footer || { elements: [], styles: {} }),
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

        // Las 4 paginas (home/catalog/about/product) son independientes entre si,
        // asi que se guardan en paralelo en vez de en cascada uno por uno.
        const saveResults = await Promise.all(Object.entries(pageSchemas).map(([pageKey, schema]) =>
          fetch(`${apiBase}/shop-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ page_key: pageKey, schema_data: schema, template_id: selectedTemplate.id, ...(targetUserId ? { target_user_id: targetUserId } : {}) }),
          })
        ));
        if (saveResults.some(r => !r.ok)) throw new Error('No se pudo instalar la plantilla');

        // 4. Publicar las 4 paginas de inmediato (tambien en paralelo)
        const pubResults = await Promise.all(Object.entries(pageSchemas).map(([pageKey, schema]) =>
          fetch(`${apiBase}/shop-pages/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ page_key: pageKey, schema_data: schema, ...(targetUserId ? { target_user_id: targetUserId } : {}) }),
          })
        ));
        if (pubResults.some(r => !r.ok)) throw new Error('No se pudo publicar tu tienda');
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
          ...(targetUserId ? { target_user_id: targetUserId } : {}),
        }),
      });
      if (!productRes.ok) throw new Error('No se pudo crear tu primer producto');

      // 6. Marcar onboarding completado
      const completeRes = await fetch(`${apiBase}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(targetUserId ? { target_user_id: targetUserId } : {}),
      });
      if (!completeRes.ok) throw new Error('No se pudo finalizar el proceso');

      if (targetUserId) {
        // Flujo "Registros": estamos configurando la tienda de OTRO cliente
        // en su nombre — al terminar, lo aprobamos para que pase de
        // "Registros" a "Empresas", y volvemos al módulo de Registros (no
        // tocamos el perfil/onboarding del super-admin que está operando).
        const approveRes = await fetch(`${apiBase}/super-admin/registrations/${targetUserId}/approve`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!approveRes.ok) throw new Error('La tienda se publicó pero no se pudo aprobar el registro');
        showToast('Tienda configurada y cliente aprobado 🚀', 'success');
        router.push('/dashboard/super-admin/registros');
        return;
      }

      updateUser({ name: storeName.trim(), slug: slug.trim(), logo: finalLogoUrl || undefined });
      setOnboardingCompleted(true);
      sessionStorage.removeItem('bayup_ob_step');
      sessionStorage.removeItem('bayup_ob_template');
      sessionStorage.removeItem('bayup_ob_store_name');
      sessionStorage.removeItem('bayup_ob_logo_preview');
      sessionStorage.removeItem('bayup_ob_logo_url');
      templates.forEach(t => sessionStorage.removeItem(`bayup_ob_schema_override_${t.id}`));
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
          <span className="text-cyan">UP.</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium border transition-all ${
                  i < step ? 'bg-[#0A1A1A] border-[#0A1A1A] text-white' : i === step ? 'border-cyan text-petroleum' : 'border-gray-200 text-gray-300'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium uppercase tracking-[0.1em] ${i === step ? 'text-petroleum' : 'text-gray-300'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
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
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50">
                    <span className="h-px w-6 bg-petroleum/30" />
                    Paso 1 de 3
                  </span>
                  <h1 className="text-4xl md:text-5xl font-light text-[#0A1A1A] tracking-tight">
                    Elige tu <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">plantilla.</span>
                  </h1>
                  <p className="text-gray-500 font-light max-w-xl leading-relaxed">Selecciona el diseño con el que quieres lanzar tu tienda hoy mismo. Podrás pedir más diseños y personalizaciones más adelante.</p>
                  <button onClick={openEditAccount} className="text-xs font-medium text-gray-400 hover:text-cyan underline decoration-gray-200 underline-offset-4 transition-colors">
                    ¿Tu nombre o correo de registro están mal? Corrígelos aquí
                  </button>
                </div>
                {templatesLoading ? (
                  <div className="py-20 flex items-center justify-center text-gray-300">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="py-20 text-center text-sm font-light text-gray-400">
                    No hay plantillas disponibles por ahora. Contacta a soporte.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => setTemplateId(tpl.id)}
                        className={`group text-left rounded-[1.75rem] overflow-hidden border transition-all duration-300 bg-white ${
                          templateId === tpl.id ? 'border-cyan/60 shadow-[0_25px_60px_-15px_rgba(0,242,255,0.25)] -translate-y-1' : 'border-gray-100 hover:border-cyan/30 hover:-translate-y-0.5 shadow-sm'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                          {tpl.preview_url && <img src={tpl.preview_url} alt={tpl.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                          {tpl.template_type === 'html' && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-violet-500/90 text-white text-[10px] font-bold uppercase tracking-wide z-10">HTML</span>
                          )}
                          {templateId === tpl.id && (
                            <div className="absolute top-3 right-3 h-7 w-7 bg-cyan rounded-full flex items-center justify-center text-[#0A1A1A] shadow-lg z-10">
                              <Check size={14} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <span
                              onClick={(e) => { e.stopPropagation(); openPreview(tpl); }}
                              className="flex items-center gap-2 h-10 px-5 rounded-full bg-white text-petroleum text-xs font-medium shadow-xl hover:scale-105 transition-transform"
                            >
                              <Eye size={14} /> Vista previa
                            </span>
                            {tpl.template_type !== 'html' && (
                              <span
                                onClick={(e) => { e.stopPropagation(); openEditor(tpl); }}
                                className="flex items-center gap-2 h-10 px-5 rounded-full bg-cyan text-[#0A1A1A] text-xs font-medium shadow-xl hover:scale-105 transition-transform"
                              >
                                <Edit3 size={14} /> Editar
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-5 space-y-1">
                          <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                          <p className="text-xs text-gray-400 font-light line-clamp-2">{tpl.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 max-w-xl">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50">
                    <span className="h-px w-6 bg-petroleum/30" />
                    Paso 2 de 3
                  </span>
                  <h1 className="text-4xl md:text-5xl font-light text-[#0A1A1A] tracking-tight">
                    Datos de <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">tu tienda.</span>
                  </h1>
                  <p className="text-gray-500 font-light leading-relaxed">Con esto ya queda lista la información básica para publicar. Lo demás (NIT, horarios, redes) lo completas después en Config Tienda.</p>
                </div>

                <div className="flex items-center gap-5">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="h-20 w-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden shrink-0 hover:border-cyan/40 transition-all"
                  >
                    {uploadingLogo ? <Loader2 size={20} className="animate-spin" /> : logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" /> : <ImageIcon size={24} />}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoPick(f);
                  }} />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">Logo (opcional)</p>
                    <p className="text-xs text-gray-400 font-light mt-1">Puedes agregarlo ahora o más tarde.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Nombre de tu tienda *</label>
                  <input value={storeName} onChange={e => handleStoreNameChange(e.target.value)} placeholder="Ej. Tech Hub Colombia"
                    className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">URL de tu tienda *</label>
                  <div className="flex items-center gap-2 p-4 bg-gray-50/80 border border-transparent focus-within:border-cyan/40 rounded-2xl transition-all focus-within:bg-white">
                    <span className="text-xs font-medium text-gray-400 shrink-0">bayup.com.co/shop/</span>
                    <input value={slug} onChange={e => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                      placeholder="mi-tienda" className="flex-1 outline-none text-sm font-medium bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Categoría *</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">WhatsApp de tu tienda *</label>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d+]/g, ''))} placeholder="3000000000"
                      className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 max-w-xl">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50">
                    <span className="h-px w-6 bg-petroleum/30" />
                    Paso 3 de 3
                  </span>
                  <h1 className="text-4xl md:text-5xl font-light text-[#0A1A1A] tracking-tight">
                    Tu primer <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">producto.</span>
                  </h1>
                  <p className="text-gray-500 font-light leading-relaxed">Para que tu tienda no se vea vacía el día que la publiques. Podrás subir el resto del catálogo después.</p>
                </div>

                <div className="flex items-center gap-5">
                  <button
                    onClick={() => productImageInputRef.current?.click()}
                    className="h-24 w-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 overflow-hidden shrink-0 hover:border-cyan/40 transition-all"
                  >
                    {productImagePreview ? <img src={productImagePreview} className="w-full h-full object-cover" alt="Producto" /> : <ImageIcon size={28} />}
                  </button>
                  <input ref={productImageInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setProductImageFile(f); setProductImagePreview(URL.createObjectURL(f)); }
                  }} />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">Foto del producto (opcional)</p>
                    <p className="text-xs text-gray-400 font-light mt-1">Recomendado para que se vea bien en tu catálogo.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Nombre del producto *</label>
                  <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ej. Camiseta Premium"
                    className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Precio (COP) *</label>
                  <input type="number" min="0" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="50000"
                    className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Descripción (opcional)</label>
                  <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} rows={3} placeholder="Describe brevemente tu producto..."
                    className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white resize-none" />
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-300">o</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">¿Tienes muchos productos? Súbelos todos de una vez</p>
                    <p className="text-xs text-gray-400 font-light mt-1">Un Excel (.xlsx) con columnas: nombre, precio, descripción (opcional), categoría (opcional), sku (opcional).</p>
                  </div>
                  <input ref={bulkProductsInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleBulkProductsUpload(f);
                    e.target.value = '';
                  }} />
                  <button
                    onClick={() => bulkProductsInputRef.current?.click()}
                    disabled={isBulkUploading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-cyan/40 hover:text-petroleum transition-all disabled:opacity-50"
                  >
                    {isBulkUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isBulkUploading ? 'Procesando...' : 'Subir Excel con varios productos'}
                  </button>
                  {bulkUploadResult && (
                    <div className={`p-4 rounded-2xl text-xs space-y-1.5 ${bulkUploadResult.created > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                      <p className="font-medium">{bulkUploadResult.created} producto{bulkUploadResult.created !== 1 ? 's' : ''} cargado{bulkUploadResult.created !== 1 ? 's' : ''} correctamente.</p>
                      {bulkUploadResult.errors.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5 opacity-80">
                          {bulkUploadResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                          {bulkUploadResult.errors.length > 5 && <li>y {bulkUploadResult.errors.length - 5} más...</li>}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVEGACION */}
          <div className="flex items-center justify-between mt-14 max-w-xl">
            {step === 0 ? (
              <button
                onClick={openEditAccount}
                className="flex items-center gap-2 px-6 py-4 rounded-full text-gray-400 font-medium text-xs hover:text-gray-900 transition-all"
              >
                <Edit3 size={14} /> Editar mis datos
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={isPublishing}
                className="flex items-center gap-2 px-6 py-4 rounded-full text-gray-400 font-medium text-xs hover:text-gray-900 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 0 && !canContinueStep1) || (step === 1 && !canContinueStep2)}
                className="flex items-center gap-3 px-9 py-4 bg-[#0A1A1A] text-white rounded-full font-medium text-sm tracking-wide shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)] hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continuar <ChevronRight size={16} className="text-cyan" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
                className="flex items-center gap-3 px-9 py-4 bg-cyan text-[#0A1A1A] rounded-full font-medium text-sm tracking-wide shadow-[0_15px_35px_-10px_rgba(0,242,255,0.4)] hover:bg-[#1AF5FF] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <><Loader2 size={18} className="animate-spin" /> Publicando tu tienda...</>
                ) : (
                  <><Rocket size={18} /> Publicar mi tienda</>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* MODAL: corregir nombre/correo de registro */}
      <AnimatePresence>
        {showEditAccount && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setShowEditAccount(false)} />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md my-auto bg-white rounded-[2rem] shadow-2xl p-8 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-light text-[#0A1A1A]">Corregir mis datos</h2>
                  <button onClick={() => setShowEditAccount(false)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-light -mt-2">Estos son los datos con los que creaste tu cuenta. Puedes corregirlos sin perder tu avance.</p>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Nombre</label>
                  <input value={accountName} onChange={e => setAccountName(e.target.value)}
                    className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-1">Correo electrónico</label>
                  <input type="email" value={accountEmail} onChange={e => setAccountEmail(e.target.value)}
                    className="w-full p-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm font-medium transition-all focus:bg-white" />
                </div>
                <button onClick={saveAccount} disabled={savingAccount || !accountName.trim() || !accountEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#0A1A1A] text-white rounded-full font-medium text-sm tracking-wide hover:bg-black transition-all disabled:opacity-40">
                  {savingAccount ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} className="text-cyan" />}
                  Guardar cambios
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
