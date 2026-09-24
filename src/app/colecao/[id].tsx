// Tela Coleção: por enquanto só mostra qual coleção foi aberta.
// Depois vai listar os itens dessa coleção, agrupados por mês, com filtro Todos/Favoritos.
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Colecao() {
  // useLocalSearchParams lê o parâmetro da rota atual.
  // Se a URL foi /colecao/cursos, então id vale "cursos".
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Coleção: {id}</Text>
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