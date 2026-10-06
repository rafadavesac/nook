// Tela Início: por enquanto só confirma que a navegação funciona.
// Os links abaixo são temporários, só para testar rotas com parâmetro.
// Vão ser removidos quando a tela Início ganhar sua versão real (Etapa 4).
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
// 1) No topo, junto dos outros imports:
import { useEffect, useState } from "react";

import { garantirLogin } from "../services/supabase";

export default function Inicio() {
  // 2) Dentro do componente, antes do return:
  const [userId, setUserId] = useState("carregando...");

  useEffect(() => {
    garantirLogin()
      .then((user) => setUserId(user.id))
      .catch((e) => setUserId("ERRO: " + e.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text>user_id: {userId}</Text>

      <Text style={styles.titulo}>Pastas</Text>

      <Link href="/colecao/6f60d74f-7d2d-475e-89cd-b9101cd8312e" style={styles.link}>
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
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  link: {
    color: "blue",
    textDecorationLine: "underline",
  },
});
