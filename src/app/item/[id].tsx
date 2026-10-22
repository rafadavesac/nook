// Tela Detalhe do item.
// Lê o id da rota, pede o item ao serviço e mostra os 4 estados:
// carregando, erro, não encontrado e item.
// Ações: favoritar, abrir o original, mover de coleção, editar e excluir.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { buscarItem, alternarFavorito, moverItem, excluirItem, atualizarItem, Item } from '../../services/itens';
import { buscarColecao, buscarColecoes, ColecaoComContagem } from '../../services/colecoes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mini-componente local: um rótulo pequeno com o valor embaixo.
function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
  );
}

export default function DetalheDoItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // altura da barra de status do aparelho

  const [item, setItem] = useState<Item | null>(null);
  const [nomeColecao, setNomeColecao] = useState<string>('Caixa de entrada');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [salvandoFavorito, setSalvandoFavorito] = useState(false);

  const [movendo, setMovendo] = useState(false); // o modal de coleções está aberto?
  const [colecoes, setColecoes] = useState<ColecaoComContagem[]>([]);
  const [erroMover, setErroMover] = useState<string | null>(null);
  const [movidoPara, setMovidoPara] = useState<string | null>(null); // mensagem de confirmação

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false); // o modal está aberto?
  const [excluindo, setExcluindo] = useState(false); // o DELETE está em andamento?
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  // Edição: "editando" liga o modo; cada campo tem o seu próprio estado.
  const [editando, setEditando] = useState(false);
  const [tituloEdit, setTituloEdit] = useState('');
  const [notaEdit, setNotaEdit] = useState('');
  const [tagsEdit, setTagsEdit] = useState('');
  const [conteudoEdit, setConteudoEdit] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [tecladoAberto, setTecladoAberto] = useState(false);

    // Liga e desliga "tecladoAberto" quando o teclado aparece ou some.
  // A função de limpeza remove os ouvintes quando a tela sai.
  useEffect(() => {
    const aoAbrir = Keyboard.addListener('keyboardDidShow', () => setTecladoAberto(true));
    const aoFechar = Keyboard.addListener('keyboardDidHide', () => setTecladoAberto(false));
    return () => {
      aoAbrir.remove();
      aoFechar.remove();
    };
  }, []);

  // Toca na estrela: pede ao serviço, e se der certo troca o item no estado.
  async function aoTocarNaEstrela() {
    if (!item || salvandoFavorito) return; // evita toques repetidos
    try {
      setSalvandoFavorito(true);
      const atualizado = await alternarFavorito(item.id, !item.is_favorite);
      setItem(atualizado);
    } catch (e) {
      setErro('Não foi possível atualizar o favorito.');
    } finally {
      setSalvandoFavorito(false);
    }
  }

  // Abre o endereço original no navegador ou no app dono do link.
  async function abrirOriginal() {
    if (!item?.url) return;
    try {
      await Linking.openURL(item.url);
    } catch (e) {
      setErro('Não foi possível abrir o link.');
    }
  }

  // Abre o modal de coleções (busca as coleções atuais antes).
  async function abrirSeletor() {
    try {
      setErroMover(null);
      setColecoes(await buscarColecoes());
      setMovendo(true);
    } catch (e) {
      setErroMover('Não foi possível carregar as coleções.');
    }
  }

  // Move o item, fecha o modal e mostra a confirmação por alguns segundos.
  async function moverPara(colecaoId: string | null, nome: string) {
    if (!item) return;
    if (colecaoId === item.collection_id) {
      setMovendo(false); // já está lá: só fecha
      return;
    }
    try {
      setErroMover(null);
      const atualizado = await moverItem(item.id, colecaoId);
      setItem(atualizado);
      setNomeColecao(nome);
      setMovendo(false);
      setMovidoPara(nome);
      setTimeout(() => setMovidoPara(null), 2500);
    } catch (e) {
      setErroMover('Não foi possível mover o item.');
    }
  }

  // Chamada pelo botão "Excluir" do modal: apaga e volta à tela anterior.
  async function confirmarExclusao() {
    if (!item || excluindo) return; // evita toques repetidos
    try {
      setExcluindo(true);
      setErroExcluir(null);
      await excluirItem(item.id);
      setConfirmandoExclusao(false);
      router.back();
    } catch (e) {
      setErroExcluir('Não foi possível excluir o item.');
    } finally {
      setExcluindo(false);
    }
  }

  // Entra no modo de edição: copia os valores atuais do item para os campos.
  function iniciarEdicao() {
    if (!item) return;
    setTituloEdit(item.title ?? '');
    setNotaEdit(item.note ?? '');
    setTagsEdit(item.tags.join(', '));
    setConteudoEdit(item.content ?? '');
    setErroEdicao(null);
    setEditando(true);
  }

  // Sai do modo de edição sem salvar nada.
  function cancelarEdicao() {
    setEditando(false);
    setErroEdicao(null);
  }

  // Salva: o serviço valida e prepara; se der certo, a tela troca o item pelo que o banco devolveu.
  async function salvarEdicao() {
    if (!item || salvandoEdicao) return; // evita toques repetidos
    try {
      setSalvandoEdicao(true);
      setErroEdicao(null);
      const atualizado = await atualizarItem(item.id, {
        type: item.type,
        title: tituloEdit,
        note: notaEdit,
        tags: tagsEdit,
        content: conteudoEdit,
      });
      setItem(atualizado);
      setEditando(false);
    } catch (e) {
      // Erros de validação (Error) trazem mensagem própria; os do banco usam a genérica
      setErroEdicao(e instanceof Error ? e.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // useFocusEffect: busca de novo toda vez que a tela ganha foco
  // (mesmo motivo da tela Coleção: a tela pode continuar montada em segundo plano).
  useFocusEffect(
    useCallback(() => {
      let cancelado = false; // ignora respostas antigas se a tela mudar

      async function carregar() {
        try {
          setCarregando(true);
          setErro(null);
          const encontrado = await buscarItem(id);
          if (cancelado) return;
          setItem(encontrado);

          // Se o item está numa coleção, buscamos o nome dela.
          if (encontrado?.collection_id) {
            const colecao = await buscarColecao(encontrado.collection_id);
            if (cancelado) return;
            setNomeColecao(colecao?.name ?? 'Coleção');
          } else {
            setNomeColecao('Caixa de entrada');
          }
        } catch (e) {
          if (!cancelado) setErro('Não foi possível carregar o item.');
        } finally {
          if (!cancelado) setCarregando(false);
        }
      }

      carregar();
      return () => {
        cancelado = true;
      };
    }, [id])
  );

  // Ordem dos estados: carregando, erro, não encontrado, item
  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#6B3A72" />
      </View>
    );
  }
  if (erro) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.valor}>{erro}</Text>
      </View>
    );
  }
  if (!item) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.valor}>Item não encontrado.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.voltar}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const origem = item.source ?? (item.type === 'text' ? 'Texto' : item.type === 'image' ? 'Imagem' : 'Link');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
    style={estilos.tela}
    contentContainerStyle={
      [
      estilos.conteudo,
      { paddingTop: 20 + insets.top }, // os 20 de sempre + a barra de status
      tecladoAberto && { paddingBottom: 100 },
    ]
    }
    keyboardShouldPersistTaps="handled"
  >
      <View style={estilos.topo}>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.voltar}>← Voltar</Text>
        </Pressable>
        {/* O botão Editar só aparece fora do modo de edição */}
        {!editando && (
          <Pressable onPress={iniciarEdicao} style={estilos.botaoEditar} hitSlop={8}>
            <Ionicons name="create-outline" size={18} color="#6B3A72" />
            <Text style={estilos.botaoEditarTexto}>Editar</Text>
          </Pressable>
        )}
      </View>

      {/* Bloco de cor no lugar do preview (preview real só na Etapa 12) */}
      <View style={estilos.bloco}>
        <View style={estilos.etiqueta}>
          <Text style={estilos.etiquetaTexto}>{origem}</Text>
        </View>

        <Pressable onPress={aoTocarNaEstrela} style={estilos.estrela} hitSlop={12}>
          <Ionicons
            name={item.is_favorite ? 'star' : 'star-outline'}
            size={26}
            color={item.is_favorite ? '#F5C451' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      {editando ? (
        <>
          {/* ===== MODO DE EDIÇÃO: os campos viram TextInputs ===== */}
          <View style={estilos.campo}>
            <Text style={estilos.rotulo}>Título</Text>
            <TextInput
              style={estilos.input}
              value={tituloEdit}
              onChangeText={setTituloEdit}
              placeholder="Sem título"
            />
          </View>

          {item.type === 'text' && (
            <View style={estilos.campo}>
              <Text style={estilos.rotulo}>Texto</Text>
              <TextInput
                style={[estilos.input, estilos.inputGrande]}
                value={conteudoEdit}
                onChangeText={setConteudoEdit}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          <View style={estilos.campo}>
            <Text style={estilos.rotulo}>Nota pessoal</Text>
            <TextInput
              style={[estilos.input, estilos.inputMedio]}
              value={notaEdit}
              onChangeText={setNotaEdit}
              placeholder="Por que você guardou isto?"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.rotulo}>Tags (separadas por vírgula)</Text>
            <TextInput
              style={estilos.input}
              value={tagsEdit}
              onChangeText={setTagsEdit}
              placeholder="ex.: python, curso"
              autoCapitalize="none"
            />
          </View>

          {item.url && <Campo rotulo="URL" valor={item.url} />}

          {erroEdicao && <Text style={estilos.erroMover}>{erroEdicao}</Text>}

          <View style={estilos.botoesConfirmacao}>
            <Pressable onPress={cancelarEdicao} style={estilos.botaoCancelar}>
              <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={salvarEdicao} style={estilos.botaoSalvar}>
              <Text style={estilos.botaoSalvarTexto}>{salvandoEdicao ? 'Salvando…' : 'Salvar'}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          {/* ===== MODO DE LEITURA ===== */}
          <Text style={estilos.titulo}>{item.title ?? 'Sem título'}</Text>

          {/* Só links têm endereço para abrir */}
          {item.url && (
            <Pressable onPress={abrirOriginal} style={estilos.botaoAbrir}>
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={estilos.botaoAbrirTexto}>Abrir original</Text>
            </Pressable>
          )}

          {/* Cada campo só aparece se tiver valor */}
          {item.url && <Campo rotulo="URL" valor={item.url} />}
          {item.content && <Campo rotulo="Texto" valor={item.content} />}
          {item.description && <Campo rotulo="Descrição" valor={item.description} />}
          {item.note && <Campo rotulo="Nota pessoal" valor={item.note} />}

          {/* A própria linha da coleção é tocável e abre o seletor */}
          <Pressable onPress={abrirSeletor} style={estilos.campo}>
            <View style={estilos.linhaColecao}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.rotulo}>Coleção atual</Text>
                <Text style={estilos.valor}>{nomeColecao}</Text>
              </View>
              <Text style={estilos.mover}>Mover</Text>
              <Ionicons name="chevron-forward" size={16} color="#6B3A72" />
            </View>
          </Pressable>

          {movidoPara && <Text style={estilos.confirmacao}>✓ Movido para {movidoPara}</Text>}
          {erroMover && <Text style={estilos.erroMover}>{erroMover}</Text>}

          {item.tags.length > 0 && (
            <Campo rotulo="Tags" valor={item.tags.map((t) => `#${t}`).join('  ')} />
          )}
          <Campo
            rotulo="Salvo em"
            valor={new Date(item.saved_at).toLocaleDateString('pt-BR')}
          />

          <Pressable
            onPress={() => {
              setErroExcluir(null);
              setConfirmandoExclusao(true);
            }}
            style={estilos.botaoExcluir}
          >
            <Ionicons name="trash-outline" size={18} color="#B3261E" />
            <Text style={estilos.botaoExcluirTexto}>Excluir item</Text>
          </Pressable>
        </>
      )}

      {/* Modal: mover de coleção */}
      <Modal visible={movendo} transparent animationType="fade" onRequestClose={() => setMovendo(false)}>
        {/* toque no fundo fecha; toque na caixa não */}
        <Pressable style={estilos.fundoModal} onPress={() => setMovendo(false)}>
          <Pressable style={estilos.caixaModal} onPress={() => {}}>
            <Text style={estilos.tituloModal}>Mover para…</Text>
            <Pressable style={estilos.opcao} onPress={() => moverPara(null, 'Caixa de entrada')}>
              <Text style={estilos.opcaoTexto}>Caixa de entrada</Text>
              {item.collection_id === null && <Ionicons name="checkmark" size={18} color="#6B3A72" />}
            </Pressable>
            {colecoes.map((c) => (
              <Pressable key={c.id} style={estilos.opcao} onPress={() => moverPara(c.id, c.name)}>
                <Text style={estilos.opcaoTexto}>{c.name}</Text>
                {item.collection_id === c.id && <Ionicons name="checkmark" size={18} color="#6B3A72" />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: confirmação de exclusão */}
      <Modal
        visible={confirmandoExclusao}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmandoExclusao(false)}
      >
        <Pressable style={estilos.fundoModal} onPress={() => setConfirmandoExclusao(false)}>
          <Pressable style={estilos.caixaModal} onPress={() => {}}>
            <Text style={estilos.tituloModal}>Excluir este item?</Text>
            <Text style={estilos.textoConfirmacao}>Essa ação não pode ser desfeita.</Text>
            {erroExcluir && <Text style={estilos.erroMover}>{erroExcluir}</Text>}
            <View style={estilos.botoesConfirmacao}>
              <Pressable onPress={() => setConfirmandoExclusao(false)} style={estilos.botaoCancelar}>
                <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirmarExclusao} style={estilos.botaoConfirmarExcluir}>
                <Text style={estilos.botaoConfirmarExcluirTexto}>
                  {excluindo ? 'Excluindo…' : 'Excluir'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
     
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { padding: 20, paddingBottom: 40 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7EBE3' },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  voltar: { color: '#6B3A72', fontWeight: '700' },
  botaoEditar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botaoEditarTexto: { color: '#6B3A72', fontWeight: '700', fontSize: 14 },
  bloco: { height: 180, borderRadius: 18, backgroundColor: '#6B3A72', marginBottom: 14 },
  etiqueta: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  etiquetaTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  estrela: { position: 'absolute', bottom: 12, right: 12 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#2B1B2E', marginBottom: 16 },
  botaoAbrir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6B3A72',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  botaoAbrirTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  campo: { backgroundColor: '#FFFBF7', borderRadius: 12, padding: 12, marginBottom: 10 },
  rotulo: { fontSize: 11, color: '#7A6A7D', marginBottom: 2 },
  valor: { fontSize: 14, color: '#2B1B2E' },
  input: { fontSize: 14, color: '#2B1B2E', paddingVertical: 4},
  inputMedio: { minHeight: 70 },
  inputGrande: { minHeight: 120 },
  linhaColecao: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mover: { color: '#6B3A72', fontWeight: '700', fontSize: 13 },
  confirmacao: { color: '#2E7D32', fontWeight: '600', fontSize: 13, marginBottom: 10 },
  erroMover: { color: '#B3261E', fontSize: 13, marginBottom: 10 },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  caixaModal: { width: '100%', backgroundColor: '#FFFBF7', borderRadius: 18, padding: 16 },
  tituloModal: { fontSize: 16, fontWeight: '800', color: '#2B1B2E', marginBottom: 8 },
  opcao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  opcaoTexto: { fontSize: 15, color: '#2B1B2E' },
  botaoExcluir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#B3261E',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  botaoExcluirTexto: { color: '#B3261E', fontWeight: '700', fontSize: 14 },
  textoConfirmacao: { fontSize: 14, color: '#2B1B2E', marginBottom: 14 },
  botoesConfirmacao: { flexDirection: 'row', gap: 10 },
  botaoCancelar: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: '#F0E4DA' },
  botaoCancelarTexto: { color: '#2B1B2E', fontWeight: '700' },
  botaoSalvar: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: '#6B3A72' },
  botaoSalvarTexto: { color: '#FFFFFF', fontWeight: '700' },
  botaoConfirmarExcluir: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: '#B3261E' },
  botaoConfirmarExcluirTexto: { color: '#FFFFFF', fontWeight: '700' },
});