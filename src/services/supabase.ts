// Camada de serviços: único arquivo que sabe como falar com o Supabase.
// As telas importam "supabase" daqui, nunca criam o cliente por conta própria.
import 'react-native-url-polyfill/auto'; // corrige o suporte a URLs no React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage, // no servidor/web não há window; no celular usa AsyncStorage     // guarda a sessão no aparelho (senão o usuário muda a cada abertura)
    autoRefreshToken: true,    // renova o login sozinho
    persistSession: true,      // mantém a sessão entre aberturas do app
    detectSessionInUrl: false, // não se aplica a apps mobile
  },
});

// Só renova o token enquanto o app está na tela (economiza bateria)
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// Garante que existe um usuário logado. Se já há sessão salva, reaproveita;
// se não há, cria um usuário anônimo novo.
export async function garantirLogin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Login anônimo não retornou usuário');
  return data.user; // agora o TypeScript sabe que nunca é null
}