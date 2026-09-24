// Tela Caixa de Entrada: por enquanto só confirma a navegação.
// Depois vai listar os itens sem coleção, agrupados por mês.
import { View, Text, StyleSheet } from 'react-native';

export default function Caixa() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Caixa de entrada</Text>
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