// Layout das abas: desenha a barra inferior e diz quais telas pertencem a ela.
// A ordem dos <Tabs.Screen> aqui é a ordem em que os ícones aparecem na barra.
import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function TabsLayout() {
  return (
    <Tabs>
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
      
    </Tabs>
    
  );
}