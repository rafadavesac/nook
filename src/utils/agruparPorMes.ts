// Utilitário: transforma uma lista plana de itens em grupos por mês.
// Não existe coluna "mês" no banco; o agrupamento é calculado aqui a partir de saved_at.
import { Item } from '../services/itens';

export type GrupoMes = {
  titulo: string; // ex.: "Junho 2026"
  itens: Item[];
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Espera os itens já ordenados do mais recente para o mais antigo
// (o serviço buscarItensDaColecao já entrega assim).
export function agruparPorMes(itens: Item[]): GrupoMes[] {
  const grupos: GrupoMes[] = [];

  for (const item of itens) {
    // new Date(...) converte o texto UTC do banco para o fuso do aparelho,
    // então getMonth() e getFullYear() já respeitam o horário local
    const data = new Date(item.saved_at);
    const titulo = `${MESES[data.getMonth()]} ${data.getFullYear()}`;

    // Se o último grupo criado é do mesmo mês, o item entra nele;
    // senão, abre um grupo novo
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.titulo === titulo) {
      ultimo.itens.push(item);
    } else {
      grupos.push({ titulo, itens: [item] });
    }
  }

  return grupos;
}