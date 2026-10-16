// Seletor "Salvar em": mostra a Caixa de entrada + as coleções como chips.
// Não fala com o banco e não guarda estado: a tela dona dele (novo-item, handle-share)
// passa a lista, diz qual está marcada e recebe o aviso quando o usuário escolhe outra.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColecaoComContagem } from '../services/colecoes';

type Props = {
  colecoes: ColecaoComContagem[];          // lista a mostrar
  valor: string | null;                    // id marcado agora (null = Caixa de entrada)
  aoEscolher: (id: string | null) => void; // chamada ao tocar num chip
};

export default function SeletorDeColecao({ colecoes, valor, aoEscolher }: Props) {
  return (
    <View style={estilos.container}>
      <Text style={estilos.rotulo}>Salvar em</Text>
      <View style={estilos.linhaQuebra}>
        <Pressable onPress={() => aoEscolher(null)} style={[estilos.chip, valor === null && estilos.chipAtivo]}>
          <Text style={[estilos.chipTexto, valor === null && estilos.chipTextoAtivo]}>Caixa de entrada</Text>
        </Pressable>
        {colecoes.map((c) => (
          <Pressable key={c.id} onPress={() => aoEscolher(c.id)} style={[estilos.chip, valor === c.id && estilos.chipAtivo]}>
            <Text style={[estilos.chipTexto, valor === c.id && estilos.chipTextoAtivo]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { gap: 8 },
  rotulo: { fontSize: 12, color: '#7A6A7D' },
  linhaQuebra: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EFE3EA' },
  chipAtivo: { backgroundColor: '#4A2250' },
  chipTexto: { fontSize: 12, color: '#4A2250', fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
});