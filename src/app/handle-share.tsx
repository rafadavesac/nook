// Tela de teste do compartilhamento (temporária).
// Mostra, em texto cru, tudo o que o Nook recebeu de outro app.
// Na Etapa 9 ela vira a tela real "Salvar conteúdo" (preview, coleção, tags, nota).
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useIncomingShare } from 'expo-sharing';

export default function HandleShare() {
  // O hook devolve o que foi compartilhado com o app.
  // sharedPayloads: dados "crus", disponíveis na hora.
  // resolvedSharedPayloads: versão com detalhes extras (pode precisar de internet).
  const { sharedPayloads, resolvedSharedPayloads, isResolving, error } = useIncomingShare();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Recebido pelo compartilhamento</Text>

      <Text style={styles.subtitulo}>Dados crus (sharedPayloads)</Text>
      <Text style={styles.codigo}>{JSON.stringify(sharedPayloads, null, 2)}</Text>

      <Text style={styles.subtitulo}>
        Dados resolvidos {isResolving ? '(carregando...)' : ''}
      </Text>
      <Text style={styles.codigo}>{JSON.stringify(resolvedSharedPayloads, null, 2)}</Text>

      {error ? <Text style={styles.erro}>Erro: {error.message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 64,
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  codigo: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  erro: {
    color: 'red',
  },
});