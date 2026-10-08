// Tela Coleção: nome, botão "+ Item", busca, filtro Todos/Favoritos e itens agrupados por mês.
// Não fala com o banco: usa os serviços. Trata 4 estados: carregando, erro, vazio e com itens.
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons'; // NOVO
import { buscarItensDaColecao, pesquisarItens, Item } from '../../services/itens'; // NOVO: pesquisarItens
import { buscarColecao, Colecao } from '../../services/colecoes';
import { agruparPorMes, GrupoMes } from '../../utils/agruparPorMes'; // NOVO: GrupoMes
import CardItem from '../../components/CardItem';

export default function ColecaoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [colecao, setColecao] = useState<Colecao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [apenasFavoritos, setApenasFavoritos] = useState(false); // filtro ativo
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // NOVO: estados da busca (mesmos papéis do Início)
  const [texto, setTexto] = useState('');                            // o que está no campo
  const [resultados, setResultados] = useState<Item[] | null>(null); // null = sem busca ativa
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  // Busca o nome da coleção (uma vez por coleção)
  useEffect(() => {
    buscarColecao(id).then(setColecao).catch((e) => setErro(e.message));
  }, [id]);

  // NOVO: ao trocar de coleção, zera a busca. A rota [id] pode reaproveitar esta mesma
  // tela já montada, e sem isto o texto e os resultados da coleção anterior ficariam aqui.
  useEffect(() => {
    setTexto('');
    setResultados(null);
    setErroBusca(null);
  }, [id]);

  // Busca os itens: roda sempre que a tela GANHA FOCO e quando o id ou o filtro mudam
  useFocusEffect(
    useCallback(() => {
      let cancelado = false; // evita que uma resposta antiga sobrescreva a nova
      setCarregando(true);
      setErro(null);

      buscarItensDaColecao(id, apenasFavoritos)
        .then((lista) => { if (!cancelado) setItens(lista); })
        .catch((e) => { if (!cancelado) setErro(e.message); })
        .finally(() => { if (!cancelado) setCarregando(false); });

      // Limpeza: roda ao trocar o filtro ou ao sair da tela
      return () => { cancelado = true; };
    }, [id, apenasFavoritos])
  );

  // NOVO: roda quando o usuário aperta Enter/Buscar no teclado
  async function aoBuscar() {
    const termo = texto.trim();
    if (!termo) {
      limparBusca();
      return;
    }
    setBuscando(true);
    setErroBusca(null);
    try {
      // O escopo diz ONDE procurar: só dentro desta coleção
      setResultados(await pesquisarItens(termo, { tipo: 'colecao', colecaoId: id }));
    } catch (e: any) {
      setErroBusca(e.message);
    } finally {
      setBuscando(false);
    }
  }

  // NOVO: volta à lista normal da coleção
  function limparBusca() {
    setTexto('');
    setResultados(null);
    setErroBusca(null);
  }

  // NOVO: guarda o que foi digitado; se o campo ficou vazio, encerra a busca
  function aoDigitar(novo: string) {
    setTexto(novo);
    if (novo === '') {
      setResultados(null);
      setErroBusca(null);
    }
  }

  // NOVO: com busca ativa, agrupamos os RESULTADOS; senão, a lista normal.
  // É a mesma função agruparPorMes: ela não sabe de onde vêm os itens.
  const emBusca = buscando || erroBusca !== null || resultados !== null;
  const grupos = agruparPorMes(emBusca ? resultados ?? [] : itens);

  // NOVO: desenha os grupos por mês (usado pela lista normal e pelos resultados)
  function desenharGrupos(lista: GrupoMes[]) {
    return lista.map((g) => (
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

  // Escolhe o que mostrar embaixo do campo de busca, conforme o estado
  function conteudo() {
    // NOVO: com busca ativa, os estados são os da busca
    if (emBusca) {
      if (buscando) return <ActivityIndicator style={{ marginTop: 40 }} />;
      if (erroBusca) return <Text style={estilos.aviso}>Não foi possível buscar: {erroBusca}</Text>;
      if ((resultados ?? []).length === 0) {
        return (
          <Text style={estilos.aviso}>
            Nenhum resultado nesta coleção.{'\n'}Tente outra palavra ou o nome de uma tag.
          </Text>
        );
      }
      return desenharGrupos(grupos);
    }

    // Sem busca: os estados de sempre
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
    return desenharGrupos(grupos);
  }

  return (
    // NOVO: keyboardShouldPersistTaps evita que o 1º toque (ex.: no X) só feche o teclado
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {/* Põe o nome da coleção no cabeçalho da navegação */}
      <Stack.Screen options={{ title: colecao?.name ?? 'Coleção' }} />

      {/* Cabeçalho: título e contagem à esquerda, botão "+ Item" à direita */}
      <View style={estilos.cabecalho}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>{colecao?.name ?? ''}</Text>
          {/* NOVO: durante a busca, a contagem é a dos resultados */}
          {emBusca
            ? resultados !== null && (
                <Text style={estilos.subtitulo}>
                  {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
                </Text>
              )
            : !carregando && !erro && (
                <Text style={estilos.subtitulo}>
                  {itens.length} {itens.length === 1 ? 'conteúdo' : 'conteúdos'}
                  {apenasFavoritos ? ' favoritos' : ' salvos'}
                </Text>
              )}
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/novo-item', params: { colecaoId: id } })}
          style={estilos.botaoItem}
        >
          <Text style={estilos.botaoItemTexto}>+ Item</Text>
        </Pressable>
      </View>

      {/* NOVO: campo de busca */}
      <View style={estilos.buscaBox}>
        <Ionicons name="search-outline" size={18} color="#7A6A7D" />
        <TextInput
          style={estilos.buscaCampo}
          placeholder={`Pesquisar em ${colecao?.name ?? 'coleção'}`}
          value={texto}
          onChangeText={aoDigitar}
          onSubmitEditing={aoBuscar}
          returnKeyType="search"
        />
        {texto.length > 0 && (
          <Pressable onPress={limparBusca} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#7A6A7D" />
          </Pressable>
        )}
      </View>

      {/* Filtro [Todos] [Favoritos]: some durante a busca, que procura na coleção toda */}
      {!emBusca && (
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
      )}

      {conteudo()}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botaoItem: { backgroundColor: '#4A2250', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  botaoItemTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  titulo: { fontSize: 24, fontWeight: '700', color: '#4A2250' },
  subtitulo: { fontSize: 12, color: '#7A6A7D', marginTop: 2 },
  // NOVO: estilos do campo de busca
  buscaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9C9DD',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  buscaCampo: { flex: 1, fontSize: 14, paddingVertical: 8, color: '#2B1B2E' },
  filtros: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EFE3EA' },
  chipAtivo: { backgroundColor: '#4A2250' },
  chipTexto: { fontSize: 12, color: '#4A2250', fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
  mes: { fontSize: 14, fontWeight: '700', color: '#2B1B2E', marginBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: 0 },
  aviso: { marginTop: 40, textAlign: 'center', color: '#7A6A7D' },
});