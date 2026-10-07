// Camada de serviços: funções que leem e escrevem itens no banco.
// As telas chamam estas funções e nunca usam "supabase.from(...)" diretamente.
import { supabase } from './supabase';

// Descreve a forma de uma linha da tabela "items".
// Se a IA (ou você) errar o nome de um campo, o editor avisa.
export type Item = {
  id: string;
  user_id: string;
  collection_id: string | null; // null = Caixa de Entrada
  type: 'link' | 'image' | 'text';
  title: string | null;
  content: string | null;
  url: string | null;
  description: string | null;
  note: string | null;
  thumbnail_url: string | null;
  source: string | null;
  tags: string[];
  is_favorite: boolean;
  saved_at: string; // chega do banco como texto ISO (UTC), ex.: "2026-06-20T13:00:00+00:00"
  updated_at: string;
};

// Busca os itens de uma coleção, do mais recente para o mais antigo.
// Em SQL, equivale a:
//   select * from items where collection_id = '...' [and is_favorite = true] order by saved_at desc;
export async function buscarItensDaColecao(
  colecaoId: string,
  apenasFavoritos: boolean
): Promise<Item[]> {
  let consulta = supabase
    .from('items')
    .select('*')
    .eq('collection_id', colecaoId)
    .order('saved_at', { ascending: false });

  // O filtro Favoritos é só mais uma condição WHERE
  if (apenasFavoritos) {
    consulta = consulta.eq('is_favorite', true);
  }

  const { data, error } = await consulta;
  if (error) throw error; // a tela decide como mostrar o erro
  return (data ?? []) as Item[];
}


// Conta quantos itens estão na Caixa de Entrada (collection_id vazio).
// Em SQL: select count(*) from items where collection_id is null;
// Atenção: para NULL usamos .is(...) e nunca .eq(...), porque em SQL
// "= null" nunca é verdadeiro (é "is null").
// head: true significa "não traga as linhas, só me diga quantas são".
export async function contarItensDaCaixa(): Promise<number> {
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .is('collection_id', null);
  if (error) throw error;
  return count ?? 0;
}