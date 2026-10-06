// Componente: desenha um item como card (bloco de cor + origem + título + detalhe).
// Não busca dados nem navega: só recebe um item e uma função onPress pela tela que o usa.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Item } from '../services/itens';

type Props = {
  item: Item;
  onPress: () => void; // a tela decide o que acontece ao tocar
};

// Extrai o domínio de uma URL ("https://www.youtube.com/x" vira "youtube.com").
// try/catch porque uma URL malformada faria new URL() lançar erro.
function extrairDominio(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Texto da etiqueta de origem: usa a fonte salva ou, se não houver, o tipo do item
function rotuloDaOrigem(item: Item): string {
  if (item.source) return item.source;
  if (item.type === 'image') return 'Imagem';
  if (item.type === 'text') return 'Texto';
  return 'Link';
}

export default function CardItem({ item, onPress }: Props) {
  // Linha de detalhe: a nota pessoal tem prioridade; senão, o domínio (links)
  const detalhe = item.note ? `Nota: ${item.note}` : extrairDominio(item.url);

  return (
    <Pressable onPress={onPress} style={estilos.card}>
      {/* Bloco de cor no lugar da thumbnail (thumbnails reais só na Etapa 12) */}
      <View style={estilos.bloco}>
        <View style={estilos.etiqueta}>
          <Text style={estilos.etiquetaTexto}>{rotuloDaOrigem(item)}</Text>
        </View>
        <Ionicons
          name={item.is_favorite ? 'star' : 'star-outline'}
          size={16}
          color={item.is_favorite ? '#F5C451' : '#FFFFFF'}
          style={estilos.estrela}
        />
      </View>

      <Text style={estilos.titulo} numberOfLines={2}>
        {item.title ?? 'Sem título'}
      </Text>
      {detalhe && (
        <Text style={estilos.detalhe} numberOfLines={1}>
          {detalhe}
        </Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  card: { width: '100%' }, // a largura real é decidida pela tela que usa o card
  bloco: {
    height: 110,
    borderRadius: 14,
    backgroundColor: '#6B3A72',
    marginBottom: 8,
  },
  etiqueta: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  etiquetaTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  estrela: { position: 'absolute', bottom: 8, right: 8 },
  titulo: { fontSize: 13, fontWeight: '700', color: '#2B1B2E' },
  detalhe: { fontSize: 11, color: '#7A6A7D', marginTop: 2 },
});