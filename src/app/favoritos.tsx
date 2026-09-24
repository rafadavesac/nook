// Tela Favoritos: por enquanto só confirma a navegação.
// Depois vai mostrar todos os itens favoritados, agrupados por coleção.
import { View, Text, StyleSheet } from 'react-native';

export default function Favoritos() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Favoritos</Text>
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