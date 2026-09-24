// Tela Ajustes: por enquanto só confirma a navegação.
// Conteúdo definitivo ainda é um ponto em aberto (Anexo B do documento-base).
import { View, Text, StyleSheet } from 'react-native';

export default function Ajustes() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Ajustes</Text>
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