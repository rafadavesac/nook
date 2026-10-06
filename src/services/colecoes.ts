// Camada de serviços: funções que leem coleções no banco.
// Vai crescer na Etapa 4 (listar todas, criar nova).
import { supabase } from './supabase';

export type Colecao = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

// Em SQL: select * from collections where id = '...';
// maybeSingle() devolve null se não achar (em vez de dar erro)
export async function buscarColecao(id: string): Promise<Colecao | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Colecao | null;
}