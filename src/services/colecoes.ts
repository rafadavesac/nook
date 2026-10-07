// Camada de serviços: funções que leem e escrevem coleções no banco.
import { supabase } from './supabase';

export type Colecao = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

// Uma coleção + quantos itens ela tem (usada no card da tela Início)
export type ColecaoComContagem = Colecao & { total_itens: number };

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

// Lista todas as coleções do usuário, com a contagem de itens de cada uma.
// "items(count)" pede ao Supabase para contar as linhas de "items" ligadas a cada
// coleção (a ligação é a coluna collection_id). Em SQL seria algo como:
//   select c.*, count(i.id) from collections c
//   left join items i on i.collection_id = c.id
//   group by c.id order by c.created_at desc;
export async function buscarColecoes(): Promise<ColecaoComContagem[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*, items(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // O Supabase devolve a contagem assim: items: [{ count: 6 }].
  // Aqui transformamos em um campo simples: total_itens: 6.
  return (data ?? []).map((linha: any) => {
    const { items, ...colecao } = linha;
    return { ...colecao, total_itens: items?.[0]?.count ?? 0 } as ColecaoComContagem;
  });
}

// Em SQL: insert into collections (name) values ('...') returning *;
// Não passamos user_id: o banco preenche sozinho com auth.uid(),
// e a política de RLS de insert confere que a linha é sua.
export async function criarColecao(nome: string): Promise<Colecao> {
  const nomeLimpo = nome.trim(); // tira espaços do começo e do fim
  if (nomeLimpo === '') throw new Error('Dê um nome para a coleção.');

  const { data, error } = await supabase
    .from('collections')
    .insert({ name: nomeLimpo })
    .select()
    .single(); // devolve a linha criada
  if (error) throw error;
  return data as Colecao;
}