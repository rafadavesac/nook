// Camada de serviços: funções que leem e escrevem itens no banco.
// As telas chamam estas funções e nunca usam "supabase.from(...)" diretamente.
import { supabase } from './supabase';
import { origemDaUrl } from '../utils/origemDaUrl';

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

// Dados que a tela entrega para criar um item.
// Tudo é opcional, menos o tipo (e, conforme o tipo, a url ou o texto).
export type NovoItem = {
  type: 'link' | 'text';        // imagem entra na Etapa 10
  url?: string;                 // usado quando type = 'link'
  content?: string;             // usado quando type = 'text'
  title?: string;
  note?: string;
  tags?: string;                // texto digitado, ex.: "python, curso"
  collection_id?: string | null; // null ou vazio = Caixa de Entrada
};

// Transforma "python, #curso,  ," em ['python', 'curso'].
function montarTags(texto?: string): string[] {
  if (!texto) return [];
  return texto
    .split(',')                         // corta nas vírgulas
    .map((t) => t.trim().replace(/^#/, '')) // tira espaços e o # do começo
    .filter((t) => t.length > 0);       // descarta os vazios
}

// Em SQL, equivale a:
//   insert into items (type, url, content, title, note, source, collection_id, tags)
//   values (...);
// O banco preenche sozinho: id, user_id, is_favorite, saved_at, updated_at.
export async function criarItem(dados: NovoItem): Promise<void> {
  const url = dados.url?.trim();
  const content = dados.content?.trim();

  // Validação: cada tipo exige o seu conteúdo principal
  if (dados.type === 'link' && !url) {
    throw new Error('Cole um endereço para salvar.');
  }
  if (dados.type === 'text' && !content) {
    throw new Error('Escreva algum texto para salvar.');
  }

  const tags = montarTags(dados.tags);

  const linha = {
    type: dados.type,
    url: dados.type === 'link' ? url : null,
    content: dados.type === 'text' ? content : null,
    source: dados.type === 'link' ? origemDaUrl(url as string) : null,
    title: dados.title?.trim() || null,   // "" vira null
    note: dados.note?.trim() || null,
    collection_id: dados.collection_id || null, // "" vira null = Caixa
    // só enviamos tags se houver alguma; senão vale o padrão '{}' do banco
    ...(tags.length > 0 ? { tags } : {}),
  };

  const { error } = await supabase.from('items').insert(linha);
  if (error) throw error;
}