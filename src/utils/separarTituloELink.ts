// Separa o título do link quando um app (Chrome, Google) entrega os dois colados
// num texto só. Função pura: não usa banco nem tela (irmã de origemDaUrl).
//   "Reel: 7 livros https://share.google/xyz" -> { titulo: "Reel: 7 livros", url: "https://share.google/xyz" }
// Sem nenhum link no texto, devolve tudo null: a tela decide que é um item de texto.

export type TituloELink = {
  titulo: string | null; // o texto que sobra depois de tirar o link
  url: string | null;    // o primeiro endereço http(s) encontrado
};

export function separarTituloELink(texto: string): TituloELink {
  // Corta o texto em palavras (espaço ou quebra de linha separam)
  const palavras = texto.trim().split(/\s+/);

  // Procura a posição da primeira palavra que começa como um endereço
  const indice = palavras.findIndex(
    (p) => p.startsWith('http://') || p.startsWith('https://')
  );
  if (indice === -1) return { titulo: null, url: null }; // findIndex devolve -1 se não achar

  const url = palavras[indice];
  // O título é o que sobra: todas as palavras, menos a do link
  const titulo = palavras.filter((_, i) => i !== indice).join(' ').trim();

  return { titulo: titulo || null, url }; // "" vira null
}