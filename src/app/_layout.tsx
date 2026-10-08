// Layout das abas: desenha a barra inferior e diz quais telas pertencem a ela.
// A ordem dos <Tabs.Screen> aqui é a ordem em que os ícones aparecem na barra.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { garantirLogin } from '../services/supabase';

export default function TabsLayout() {
  // pronto: o login terminou? erro: deu algo errado?
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Roda uma vez quando o app abre: garante o usuário logado ANTES de qualquer tela
  useEffect(() => {
    garantirLogin()
      .then(() => setPronto(true))
      .catch((e) => setErro(e.message));
  }, []);

  if (erro) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text>Não foi possível entrar: {erro}</Text>
      </View>
    );
  }

  if (!pronto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    // backBehavior="history": o botão voltar leva à última tela visitada
    // (ex.: Detalhe -> Coleção), em vez de sempre ir para a primeira aba.
    <Tabs backBehavior="history">
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pastas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="novo-item"
        options={{
          title: 'Novo item',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: 'Caixa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Rotas dinâmicas: existem e recebem parâmetro, mas não ganham botão na barra */}
      <Tabs.Screen name="colecao/[id]" options={{ href: null }} />
      <Tabs.Screen name="item/[id]" options={{ href: null }} />
      {/* Tela que recebe conteúdo compartilhado por outros apps (só teste por enquanto) */}
      <Tabs.Screen name="handle-share" options={{ href: null }} />
    </Tabs>
  );
}