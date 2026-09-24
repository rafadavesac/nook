// Tela Detalhe do item: por enquanto só mostra qual item foi aberto.
// Depois vai mostrar conteúdo, título, nota, tags, coleção, e as ações
// (favoritar, mover, editar, compartilhar, excluir).
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Item() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Item: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});