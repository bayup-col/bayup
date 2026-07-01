import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Crea el cliente de Supabase solo si las variables de entorno están
 * configuradas. Devuelve null (en vez de explotar el build) cuando aún no
 * se han conectado las credenciales del proyecto.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
};

export const signInWithGoogle = async (redirectPath: string = "/dashboard") => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("El inicio de sesión con Google aún no está configurado. Faltan las credenciales de Supabase.");
  }

  // Limpiar sesión Supabase cacheada para que Google siempre muestre el selector de cuentas
  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) throw error;
};
