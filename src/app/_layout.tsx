// Layout das abas: desenha a barra inferior e diz quais telas pertencem a ela.
// A ordem dos <Tabs.Screen> aqui é a ordem em que os ícones aparecem na barra.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { garantirLogin } from '../services/supabase';
import { ThemeProvider, DefaultTheme } from 'expo-router/react-navigation';

// Tema do Nook: o tema padrão da navegação, só com o fundo trocado pelo bege do app.
// Toda tela sem fundo próprio herda essa cor.
const temaNook = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#F7EBE3' },
};

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
    <ThemeProvider value={temaNook}>
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

           {/* Rotas escondidas da barra (href: null). Os arquivos continuam existindo:
          favoritos volta na Etapa 11 e ajustes na Etapa 13. */}
      <Tabs.Screen name="favoritos" options={{ href: null }} />
      <Tabs.Screen name="ajustes" options={{ href: null }} />

      {/* Rotas dinâmicas: sem botão na barra e sem cabeçalho (cada tela tem o próprio título) */}
      <Tabs.Screen name="colecao/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="item/[id]" options={{ href: null, headerShown: false }} />
      {/* Tela que recebe conteúdo compartilhado por outros apps (só teste por enquanto) */}
      <Tabs.Screen name="handle-share" options={{ href: null }} />
    </Tabs>
    </ThemeProvider>
  );
}