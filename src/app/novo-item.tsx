// Tela Novo item: por enquanto só confirma a navegação.
// Depois vai ter três abas internas (URL, Imagem, Texto) para adicionar conteúdo.
import { View, Text, StyleSheet } from 'react-native';

export default function NovoItem() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Novo item</Text>
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