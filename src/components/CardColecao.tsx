// Componente: desenha uma coleção como card (ícone de pasta + nome + contagem).
// Não busca dados nem navega: só recebe a coleção e uma função onPress pela tela que o usa.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ColecaoComContagem } from '../services/colecoes';

type Props = {
  colecao: ColecaoComContagem;
  onPress: () => void; // a tela decide o que acontece ao tocar
};

// Texto da contagem, com singular e plural: "1 item" / "6 itens" / "Vazia"
function textoDaContagem(total: number): string {
  if (total === 0) return 'Nenhum item';
  if (total === 1) return '1 item';
  return `${total} itens`;
}

export default function CardColecao({ colecao, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={estilos.card}>
      <View style={estilos.topo}>
        <Ionicons name="folder" size={22} color="#FFFFFF" />
        {/* Bolinha com o número de itens, como no wireframe */}
        <View style={estilos.bolinha}>
          <Text style={estilos.bolinhaTexto}>{colecao.total_itens}</Text>
        </View>
      </View>

      <View>
        <Text style={estilos.nome} numberOfLines={2}>
          {colecao.name}
        </Text>
        <Text style={estilos.contagem}>{textoDaContagem(colecao.total_itens)}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  card: {
    width: '100%', // a largura real é decidida pela tela que usa o card
    height: 110,
    borderRadius: 14,
    backgroundColor: '#6B3A72',
    padding: 12,
    justifyContent: 'space-between', // ícone em cima, textos embaixo
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bolinha: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bolinhaTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  nome: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  contagem: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
});