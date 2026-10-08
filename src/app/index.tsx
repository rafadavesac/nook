// Tela Início (aba Pastas): busca global + atalho da Caixa de Entrada + grade de coleções.
// Não fala com o banco direto: usa as funções de services/colecoes e services/itens.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import CardColecao from '../components/CardColecao';
import CardItem from '../components/CardItem'; // NOVO
import { buscarColecoes, criarColecao, ColecaoComContagem } from '../services/colecoes';
import { contarItensDaCaixa, pesquisarItens, Item } from '../services/itens'; // NOVO: pesquisarItens e Item

export default function Inicio() {
  const router = useRouter();

  // Estados dos dados
  const [colecoes, setColecoes] = useState<ColecaoComContagem[]>([]);
  const [totalCaixa, setTotalCaixa] = useState(0);
  const [carregando, setCarregando] = useState(true); // só vale na PRIMEIRA carga
  const [erro, setErro] = useState<string | null>(null);

  // Estados do modal "Nova coleção"
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState<string | null>(null);

  // NOVO: estados da busca. Cada um tem uma responsabilidade:
  const [texto, setTexto] = useState('');                         // o que está digitado no campo
  const [resultados, setResultados] = useState<Item[] | null>(null); // null = não há busca ativa
  const [buscando, setBuscando] = useState(false);                // consulta em andamento
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  // Busca as coleções e a contagem da Caixa ao mesmo tempo (Promise.all).
  const carregar = useCallback(async () => {
    try {
      const [listaColecoes, qtdCaixa] = await Promise.all([
        buscarColecoes(),
        contarItensDaCaixa(),
      ]);
      return { listaColecoes, qtdCaixa };
    } catch (e: any) {
      throw e;
    }
  }, []);

  // Roda TODA vez que a tela ganha foco (ao abrir e ao voltar de outra tela).
  // Mesmo padrão "cancelado" da Etapa 3: ignora respostas que chegam depois de sair da tela.
  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      carregar()
        .then(({ listaColecoes, qtdCaixa }) => {
          if (cancelado) return;
          setColecoes(listaColecoes);
          setTotalCaixa(qtdCaixa);
          setErro(null);
        })
        .catch((e) => {
          if (!cancelado) setErro(e.message);
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });
      return () => {
        cancelado = true;
      };
    }, [carregar])
  );

  function abrirModal() {
    setNomeNovo('');
    setErroCriar(null);
    setModalAberto(true);
  }

  async function aoCriar() {
    setCriando(true);
    setErroCriar(null);
    try {
      await criarColecao(nomeNovo); // serviço: faz o INSERT
      setModalAberto(false);
      const { listaColecoes, qtdCaixa } = await carregar(); // refaz a lista para a nova aparecer
      setColecoes(listaColecoes);
      setTotalCaixa(qtdCaixa);
    } catch (e: any) {
      setErroCriar(e.message);
    } finally {
      setCriando(false);
    }
  }

  // NOVO: roda quando o usuário aperta Enter/Buscar no teclado
  async function aoBuscar() {
    const termo = texto.trim();
    if (!termo) {
      limparBusca(); // campo vazio = voltar ao normal
      return;
    }
    setBuscando(true);
    setErroBusca(null);
    try {
      setResultados(await pesquisarItens(termo)); // serviço: faz as consultas
    } catch (e: any) {
      setErroBusca(e.message);
    } finally {
      setBuscando(false);
    }
  }

  // NOVO: volta para a tela normal (coleções)
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

  // Estado 1: primeira carga
  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  // Estado 2: erro
  if (erro) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.mensagem}>Não foi possível carregar: {erro}</Text>
      </View>
    );
  }

  // Textos do atalho da Caixa
  const textoCaixa =
    totalCaixa === 0
      ? 'Nenhum item para organizar'
      : totalCaixa === 1
      ? '1 item para organizar'
      : `${totalCaixa} itens para organizar`;

  // NOVO: há busca em andamento ou com resultado para mostrar?
  const emBusca = buscando || erroBusca !== null || resultados !== null;

  return (
    <View style={estilos.tela}>
      {/* NOVO: campo de busca, sempre visível no topo */}
      <View style={estilos.buscaBox}>
        <Ionicons name="search-outline" size={18} color="#7A6A7D" />
        <TextInput
          style={estilos.buscaCampo}
          placeholder="Buscar por título, nota, tag, coleção..."
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

      {/* NOVO: com busca ativa mostra os resultados; senão, a tela normal de sempre */}
      {emBusca ? (
        buscando ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : erroBusca ? (
          <Text style={estilos.aviso}>Não foi possível buscar: {erroBusca}</Text>
        ) : (
          <FlatList
            data={resultados ?? []}
            keyExtractor={(i) => i.id}
            numColumns={2}
            columnWrapperStyle={estilos.linha}
            contentContainerStyle={estilos.conteudo}
            ListHeaderComponent={
              resultados && resultados.length > 0 ? (
                <Text style={estilos.contagem}>
                  {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <Text style={estilos.aviso}>
                Nenhum resultado.{'\n'}Tente outra palavra, um pedaço do título ou o nome de uma tag.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={estilos.celula}>
                <CardItem
                  item={item}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                />
              </View>
            )}
          />
        )
      ) : (
        <FlatList
          data={colecoes}
          keyExtractor={(c) => c.id}
          numColumns={2}
          columnWrapperStyle={estilos.linha}
          contentContainerStyle={estilos.conteudo}
          ListHeaderComponent={
            <View>
              {/* Atalho da Caixa de Entrada */}
              <Pressable style={estilos.caixa} onPress={() => router.push('/caixa')}>
                <Ionicons name="mail-outline" size={22} color="#FFFFFF" />
                <View style={estilos.caixaTextos}>
                  <Text style={estilos.caixaTitulo}>Caixa de entrada</Text>
                  <Text style={estilos.caixaSub}>{textoCaixa}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>

              {/* Título da seção + botão Nova */}
              <View style={estilos.cabecalho}>
                <Text style={estilos.secao}>Coleções</Text>
                <Pressable style={estilos.botaoNova} onPress={abrirModal}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={estilos.botaoNovaTexto}>Nova</Text>
                </Pressable>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={estilos.vazio}>
              Você ainda não tem coleções. Toque em "Nova" para criar a primeira.
            </Text>
          }
          renderItem={({ item }) => (
            // Cada célula ocupa metade da linha; a tela decide a largura, o card só desenha
            <View style={estilos.celula}>
              <CardColecao colecao={item} onPress={() => router.push(`/colecao/${item.id}`)} />
            </View>
          )}
        />
      )}

      {/* Modal: janela sobreposta para nomear a coleção */}
      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAberto(false)}
      >
        <KeyboardAvoidingView
          style={estilos.fundoModal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={estilos.caixaModal}>
            <Text style={estilos.tituloModal}>Nova coleção</Text>
            <TextInput
              style={estilos.campo}
              placeholder="Ex.: Livros, Receitas, Viagens"
              value={nomeNovo}
              onChangeText={setNomeNovo}
              autoFocus
              maxLength={40}
            />
            {erroCriar && <Text style={estilos.erroModal}>{erroCriar}</Text>}
            <View style={estilos.botoesModal}>
              <Pressable onPress={() => setModalAberto(false)} disabled={criando}>
                <Text style={estilos.cancelar}>Cancelar</Text>
              </Pressable>
              <Pressable style={estilos.criar} onPress={aoCriar} disabled={criando}>
                {criando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={estilos.criarTexto}>Criar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F6E9DD' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  mensagem: { textAlign: 'center', color: '#2B1B2E' },
  conteudo: { padding: 16, paddingBottom: 32 },
  linha: { gap: 12, marginBottom: 12 },
  celula: { flex: 1, maxWidth: '50%' }, // maxWidth evita que um card sozinho na última linha estique
  // NOVO: estilos da busca
  buscaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9C9DD',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  buscaCampo: { flex: 1, fontSize: 14, paddingVertical: 8, color: '#2B1B2E' },
  contagem: { fontSize: 12, color: '#7A6A7D', marginBottom: 12 },
  aviso: { marginTop: 40, textAlign: 'center', color: '#7A6A7D', paddingHorizontal: 24 },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4A2A55',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  caixaTextos: { flex: 1 },
  caixaTitulo: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  caixaSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secao: { fontSize: 18, fontWeight: '800', color: '#2B1B2E' },
  botaoNova: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4A2A55',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  botaoNovaTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  vazio: { textAlign: 'center', color: '#7A6A7D', marginTop: 24 },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  caixaModal: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 12 },
  tituloModal: { fontSize: 16, fontWeight: '800', color: '#2B1B2E' },
  campo: {
    borderWidth: 1,
    borderColor: '#D9C9DD',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  erroModal: { color: '#B3261E', fontSize: 12 },
  botoesModal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
  },
  cancelar: { color: '#7A6A7D', fontWeight: '600' },
  criar: {
    backgroundColor: '#4A2A55',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  criarTexto: { color: '#FFFFFF', fontWeight: '700' },
});