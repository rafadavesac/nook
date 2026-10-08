// Tela Caixa de Entrada: itens salvos que ainda não têm coleção, agrupados por mês.
// Não fala com o banco: usa o serviço. Trata 4 estados: carregando, erro, vazio e com itens.
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { buscarItensDaCaixa, Item } from '../services/itens';
import { agruparPorMes } from '../utils/agruparPorMes';
import CardItem from '../components/CardItem';

export default function CaixaTela() {
  const router = useRouter();

  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true); // só vale na primeira carga
  const [erro, setErro] = useState<string | null>(null);

  // Roda a cada vez que a tela GANHA FOCO (a aba fica montada em segundo plano,
  // então um useEffect não rodaria ao voltar e a lista ficaria desatualizada).
  useFocusEffect(
    useCallback(() => {
      let cancelado = false; // ignora respostas antigas
      setErro(null);
      // Repare: aqui NÃO ligamos o spinner de novo. Ele só aparece na primeira carga,
      // então a lista não pisca quando você volta à tela.

      buscarItensDaCaixa()
        .then((lista) => { if (!cancelado) setItens(lista); })
        .catch((e) => { if (!cancelado) setErro(e.message); })
        .finally(() => { if (!cancelado) setCarregando(false); });

      return () => { cancelado = true; };
    }, [])
  );

  const grupos = agruparPorMes(itens);

  // Escolhe o que mostrar, na ordem: carregando, erro, vazio, itens
  function conteudo() {
    if (carregando) return <ActivityIndicator style={{ marginTop: 40 }} />;
    if (erro) return <Text style={estilos.aviso}>Não foi possível carregar: {erro}</Text>;
    if (itens.length === 0) {
      return (
        <Text style={estilos.aviso}>
          Sua Caixa de entrada está vazia.{'\n\n'}
          Aqui ficam os itens que você salvou sem escolher uma coleção, para organizar depois.
        </Text>
      );
    }
    return grupos.map((g) => (
      <View key={g.titulo} style={{ marginBottom: 20 }}>
        <Text style={estilos.mes}>{g.titulo}</Text>
        <View style={estilos.grade}>
          {g.itens.map((i) => (
            <View key={i.id} style={{ width: '48%' }}>
              <CardItem
                item={i}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: i.id } })}
              />
            </View>
          ))}
        </View>
      </View>
    ));
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={estilos.titulo}>Caixa de entrada</Text>
      {!carregando && !erro && (
        <Text style={estilos.subtitulo}>
          {itens.length} {itens.length === 1 ? 'item' : 'itens'} para organizar
        </Text>
      )}
      <View style={{ height: 16 }} />
      {conteudo()}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 24, fontWeight: '700', color: '#4A2250' },
  subtitulo: { fontSize: 12, color: '#7A6A7D', marginTop: 2 },
  mes: { fontSize: 14, fontWeight: '700', color: '#2B1B2E', marginBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  aviso: { marginTop: 40, textAlign: 'center', color: '#7A6A7D' },
});