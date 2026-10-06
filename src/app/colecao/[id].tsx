// Tela Coleção: nome, filtro Todos/Favoritos e itens agrupados por mês.
// Não fala com o banco: usa os serviços. Trata 4 estados: carregando, erro, vazio e com itens.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { buscarItensDaColecao, Item } from '../../services/itens';
import { buscarColecao, Colecao } from '../../services/colecoes';
import { agruparPorMes } from '../../utils/agruparPorMes';
import CardItem from '../../components/CardItem';

export default function ColecaoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [colecao, setColecao] = useState<Colecao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [apenasFavoritos, setApenasFavoritos] = useState(false); // filtro ativo
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Busca o nome da coleção (uma vez por coleção)
  useEffect(() => {
    buscarColecao(id).then(setColecao).catch((e) => setErro(e.message));
  }, [id]);

  // Busca os itens: roda ao abrir e SEMPRE que o filtro muda
  useEffect(() => {
    let cancelado = false; // evita que uma resposta antiga sobrescreva a nova
    setCarregando(true);
    setErro(null);

    buscarItensDaColecao(id, apenasFavoritos)
      .then((lista) => { if (!cancelado) setItens(lista); })
      .catch((e) => { if (!cancelado) setErro(e.message); })
      .finally(() => { if (!cancelado) setCarregando(false); });

    // Função de limpeza: roda antes da próxima busca (ex.: ao trocar o filtro)
    return () => { cancelado = true; };
  }, [id, apenasFavoritos]);

  const grupos = agruparPorMes(itens);

  // Escolhe o que mostrar embaixo dos filtros, conforme o estado
  function conteudo() {
    if (carregando) return <ActivityIndicator style={{ marginTop: 40 }} />;
    if (erro) return <Text style={estilos.aviso}>Não foi possível carregar: {erro}</Text>;
    if (itens.length === 0) {
      return (
        <Text style={estilos.aviso}>
          {apenasFavoritos
            ? 'Nenhum favorito aqui ainda. Toque na estrela de um item para favoritá-lo.'
            : 'Esta coleção ainda não tem itens.'}
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
      {/* Põe o nome da coleção no cabeçalho da navegação */}
      <Stack.Screen options={{ title: colecao?.name ?? 'Coleção' }} />

      <Text style={estilos.titulo}>{colecao?.name ?? ''}</Text>
      {!carregando && !erro && (
        <Text style={estilos.subtitulo}>
          {itens.length} {itens.length === 1 ? 'conteúdo' : 'conteúdos'}
          {apenasFavoritos ? ' favoritos' : ' salvos'}
        </Text>
      )}

      {/* Filtro [Todos] [Favoritos] */}
      <View style={estilos.filtros}>
        <Pressable
          onPress={() => setApenasFavoritos(false)}
          style={[estilos.chip, !apenasFavoritos && estilos.chipAtivo]}
        >
          <Text style={[estilos.chipTexto, !apenasFavoritos && estilos.chipTextoAtivo]}>Todos</Text>
        </Pressable>
        <Pressable
          onPress={() => setApenasFavoritos(true)}
          style={[estilos.chip, apenasFavoritos && estilos.chipAtivo]}
        >
          <Text style={[estilos.chipTexto, apenasFavoritos && estilos.chipTextoAtivo]}>Favoritos</Text>
        </Pressable>
      </View>

      {conteudo()}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 24, fontWeight: '700', color: '#4A2250' },
  subtitulo: { fontSize: 12, color: '#7A6A7D', marginTop: 2 },
  filtros: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EFE3EA' },
  chipAtivo: { backgroundColor: '#4A2250' },
  chipTexto: { fontSize: 12, color: '#4A2250', fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
  mes: { fontSize: 14, fontWeight: '700', color: '#2B1B2E', marginBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  aviso: { marginTop: 40, textAlign: 'center', color: '#7A6A7D' },
});