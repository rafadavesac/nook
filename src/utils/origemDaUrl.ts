// Descobre a origem de um link (Instagram, YouTube, TikTok ou Site)
// a partir do endereço. Função pura: não usa banco nem tela.

export function origemDaUrl(url: string): string {
  let dominio: string;
  try {
    // "new URL" separa o endereço em partes (domínio, caminho etc.).
    // Se o texto não for um endereço válido, ele lança erro.
    dominio = new URL(url).hostname.toLowerCase();
  } catch {
    return 'Site';
  }

  if (dominio.includes('instagram.com')) return 'Instagram';
  if (dominio.includes('youtube.com') || dominio.includes('youtu.be')) return 'YouTube';
  if (dominio.includes('tiktok.com')) return 'TikTok';
  return 'Site';
}