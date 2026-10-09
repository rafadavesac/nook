// Hook de busca: guarda o texto, os resultados e os estados da pesquisa, com debounce.
// As telas só dizem ONDE procurar (escopo); aqui dentro mora o "quando" e o "como".
import { useEffect, useState } from 'react';
import { pesquisarItens, EscopoBusca, Item } from '../services/itens';

const ESPERA_MS = 400; // quanto tempo sem digitar até a busca disparar

export function useBusca(escopo: EscopoBusca) {
  const [texto, setTexto] = useState('');                            // o que está no campo
  const [resultados, setResultados] = useState<Item[] | null>(null); // null = sem busca ativa
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  // O escopo é um objeto, e a tela cria um novo a cada desenho. Se ele fosse dependência
  // do useEffect, o efeito rodaria sem parar. Por isso usamos só os valores simples dele.
  const tipo = escopo.tipo;
  const colecaoId = escopo.tipo === 'colecao' ? escopo.colecaoId : null;

  // Ao mudar de escopo (ex.: outra coleção), zera o campo.
  useEffect(() => {
    setTexto('');
  }, [tipo, colecaoId]);

  // O debounce: roda toda vez que o texto muda.
  useEffect(() => {
    const termo = texto.trim();

    // Campo vazio: encerra a busca
    if (!termo) {
      setResultados(null);
      setErroBusca(null);
      setBuscando(false);
      return;
    }

    let cancelado = false; // ignora respostas de buscas antigas (padrão da Etapa 3)

    // Agenda a busca para daqui a 400 ms
    const relogio = setTimeout(async () => {
      setBuscando(true);
      setErroBusca(null);
      try {
        const lista = await pesquisarItens(termo, montarEscopo(tipo, colecaoId));
        if (!cancelado) setResultados(lista);
      } catch (e: any) {
        if (!cancelado) setErroBusca(e.message);
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, ESPERA_MS);

    // Limpeza: roda quando o texto muda de novo (ou a tela sai).
    // Cancela o agendamento E ignora uma consulta que ainda esteja a caminho.
    return () => {
      cancelado = true;
      clearTimeout(relogio);
    };
  }, [texto, tipo, colecaoId]);

  const emBusca = buscando || erroBusca !== null || resultados !== null;

  return {
    texto,
    setTexto,
    resultados,
    buscando,
    erroBusca,
    emBusca,
    limpar: () => setTexto(''), // texto vazio já encerra a busca, pelo efeito acima
  };
}

// Reconstrói o escopo a partir dos valores simples.
function montarEscopo(tipo: EscopoBusca['tipo'], colecaoId: string | null): EscopoBusca {
  if (tipo === 'colecao' && colecaoId) return { tipo: 'colecao', colecaoId };
  if (tipo === 'caixa') return { tipo: 'caixa' };
  return { tipo: 'global' };
}