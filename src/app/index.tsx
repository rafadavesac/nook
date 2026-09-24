// Tela Início: por enquanto só confirma que a navegação funciona.
// Os links abaixo são temporários, só para testar rotas com parâmetro.
// Vão ser removidos quando a tela Início ganhar sua versão real (Etapa 4).
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Inicio() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Pastas</Text>

      <Link href="/colecao/cursos" style={styles.link}>
        Abrir coleção "cursos" (teste)
      </Link>
      <Link href="/item/123" style={styles.link}>
        Abrir item "123" (teste)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});