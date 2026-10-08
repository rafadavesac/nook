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

// Busca UM item pelo id. Em SQL: select * from items where id = '...';
// maybeSingle() devolve o item, ou null se não existir
// (também é o que acontece quando a RLS esconde o item de outro usuário).
export async function buscarItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Item | null;
}

// Liga ou desliga o favorito de um item.
// Em SQL: update items set is_favorite = true, updated_at = now() where id = '...';
// O banco não atualiza updated_at sozinho num UPDATE, então enviamos aqui.
// .select().single() pede ao banco a linha já atualizada, para a tela usar.
export async function alternarFavorito(id: string, valor: boolean): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update({ is_favorite: valor, updated_at: new Date().toISOString() })
    .eq('id', id) // o WHERE: sem isto, mudaria todos os itens
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

// Move um item para outra coleção (ou para a Caixa, com null).
// Em SQL: update items set collection_id = '...', updated_at = now() where id = '...';
// Devolve a linha já atualizada, como no alternarFavorito.
export async function moverItem(id: string, colecaoId: string | null): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update({ collection_id: colecaoId, updated_at: new Date().toISOString() })
    .eq('id', id) // o WHERE de sempre
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

// Apaga um item para sempre.
// Em SQL: delete from items where id = '...';
// Sem o .eq(...) apagaria todos os itens, então o filtro por id é obrigatório.
export async function excluirItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Dados que a tela entrega ao salvar a edição. Tudo vem como texto dos campos.
export type EdicaoItem = {
  type: 'link' | 'image' | 'text'; // o serviço precisa saber se há "content" para validar
  title: string;
  note: string;
  tags: string;    // texto digitado, ex.: "python, curso"
  content: string; // só vale para itens de texto
};

// Em SQL, equivale a:
//   update items set title = ..., note = ..., tags = ..., content = ..., updated_at = now()
//   where id = '...';
// Aqui as tags são sempre enviadas (mesmo vazias), porque editar pode apagar todas.
export async function atualizarItem(id: string, dados: EdicaoItem): Promise<Item> {
  const content = dados.content.trim();

  // Um item de texto não pode ficar sem texto
  if (dados.type === 'text' && !content) {
    throw new Error('O texto não pode ficar vazio.');
  }

  const campos = {
    title: dados.title.trim() || null, // "" vira null
    note: dados.note.trim() || null,
    tags: montarTags(dados.tags),
    updated_at: new Date().toISOString(), // o banco não atualiza sozinho
    // "content" só entra no UPDATE para itens de texto
    ...(dados.type === 'text' ? { content } : {}),
  };

  const { data, error } = await supabase
    .from('items')
    .update(campos)
    .eq('id', id) // o WHERE de sempre
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}