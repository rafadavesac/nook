// Tela Caixa de Entrada: itens salvos que ainda não têm coleção, agrupados por mês, com busca.
// Não fala com o banco: usa o serviço. Trata 4 estados: carregando, erro, vazio e com itens.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons'; // NOVO
import { buscarItensDaCaixa, pesquisarItens, Item } from '../services/itens'; // NOVO: pesquisarItens
import { agruparPorMes, GrupoMes } from '../utils/agruparPorMes'; // NOVO: GrupoMes
import CardItem from '../components/CardItem';

export default function CaixaTela() {
  const router = useRouter();

  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true); // só vale na primeira carga
  const [erro, setErro] = useState<string | null>(null);

  // NOVO: estados da busca (mesmos papéis do Início e da Coleção)
  const [texto, setTexto] = useState('');                            // o que está no campo
  const [resultados, setResultados] = useState<Item[] | null>(null); // null = sem busca ativa
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  // Roda a cada vez que a tela GANHA FOCO (a aba fica montada em segundo plano,
  // então um useEffect não rodaria ao voltar e a lista ficaria desatualizada).
  useFocusEffect(
    useCallback(() => {
      let cancelado = false; // ignora respostas antigas
      setErro(null);
      // Aqui NÃO ligamos o spinner de novo: ele só aparece na primeira carga,
      // então a lista não pisca quando você volta à tela.

      buscarItensDaCaixa()
        .then((lista) => { if (!cancelado) setItens(lista); })
        .catch((e) => { if (!cancelado) setErro(e.message); })
        .finally(() => { if (!cancelado) setCarregando(false); });

      return () => { cancelado = true; };
    }, [])
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
      // O escopo diz ONDE procurar: só nos itens sem coleção
      setResultados(await pesquisarItens(termo, { tipo: 'caixa' }));
    } catch (e: any) {
      setErroBusca(e.message);
    } finally {
      setBuscando(false);
    }
  }

  // NOVO: volta à lista normal da Caixa
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

  // NOVO: com busca ativa, agrupamos os RESULTADOS; senão, a lista normal
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

  // Escolhe o que mostrar, na ordem: (busca) ou carregando, erro, vazio, itens
  function conteudo() {
    if (emBusca) {
      if (buscando) return <ActivityIndicator style={{ marginTop: 40 }} />;
      if (erroBusca) return <Text style={estilos.aviso}>Não foi possível buscar: {erroBusca}</Text>;
      if ((resultados ?? []).length === 0) {
        return (
          <Text style={estilos.aviso}>
            Nenhum resultado na Caixa de entrada.{'\n'}Tente outra palavra ou o nome de uma tag.
          </Text>
        );
      }
      return desenharGrupos(grupos);
    }

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
    return desenharGrupos(grupos);
  }

  return (
    // keyboardShouldPersistTaps: o 1º toque no X não é "gasto" só fechando o teclado
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Caixa de entrada</Text>
      {/* Durante a busca, a contagem é a dos resultados */}
      {emBusca
        ? resultados !== null && (
            <Text style={estilos.subtitulo}>
              {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
            </Text>
          )
        : !carregando && !erro && (
            <Text style={estilos.subtitulo}>
              {itens.length} {itens.length === 1 ? 'item' : 'itens'} para organizar
            </Text>
          )}

      {/* NOVO: campo de busca */}
      <View style={estilos.buscaBox}>
        <Ionicons name="search-outline" size={18} color="#7A6A7D" />
        <TextInput
          style={estilos.buscaCampo}
          placeholder="Pesquisar na Caixa de entrada"
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

      <View style={{ height: 16 }} />
      {conteudo()}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
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
  mes: { fontSize: 14, fontWeight: '700', color: '#2B1B2E', marginBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  aviso: { marginTop: 40, textAlign: 'center', color: '#7A6A7D' },
});