// Redirecionador de compartilhamento.
// Quando o Android abre o Nook por causa de um "Compartilhar", o sistema manda
// um endereço especial para o app. Este arquivo olha esse endereço e decide
// para qual tela o app deve ir. Aqui, qualquer compartilhamento vai para /handle-share.

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (new URL(path).hostname === 'expo-sharing') {
      return '/handle-share';
    }
    return path;
  } catch {
    return '/';
  }
}