// Tela Novo item: abas URL e Texto, campos opcionais, "Salvar em" e botão Salvar.
// Ao salvar, mostra um modal de confirmação com os botões OK e "Ver em ...".
// Pode receber uma coleção pela rota (botão "+ Item" da tela Coleção).
// Não fala com o banco: usa os serviços (criarItem e buscarColecoes).
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { criarItem } from '../services/itens';
import { buscarColecoes, ColecaoComContagem } from '../services/colecoes';
import SeletorDeColecao from '../components/SeletorDeColecao';

type Aba = 'url' | 'texto';

// Onde o item foi salvo (guardado na hora de salvar, porque o formulário é limpo depois)
type Destino = { id: string | null; nome: string };

export default function NovoItem() {
  const router = useRouter();

  // Coleção enviada pelo botão "+ Item" da tela Coleção (vazio se vier pela barra de abas)
  const { colecaoId: colecaoDaRota } = useLocalSearchParams<{ colecaoId?: string }>();

  // Qual aba está aberta
  const [aba, setAba] = useState<Aba>('url');

  // Campos do formulário (um estado para cada campo)
  const [url, setUrl] = useState('');
  const [texto, setTexto] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tags, setTags] = useState('');
  const [nota, setNota] = useState('');
  const [colecaoId, setColecaoId] = useState<string | null>(null); // null = Caixa de entrada

  // Lista de coleções para o "Salvar em"
  const [colecoes, setColecoes] = useState<ColecaoComContagem[]>([]);

  // Estados do botão Salvar
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Destino do último item salvo (NÃO é apagado ao fechar, para o texto não mudar durante a animação)
  const [salvoEm, setSalvoEm] = useState<Destino | null>(null);
  // Controla SÓ se o modal está aberto ou fechado
  const [modalAberto, setModalAberto] = useState(false);

  // Roda toda vez que a aba ganha foco: recarrega as coleções e aplica o parâmetro da rota
  useFocusEffect(
    useCallback(() => {
      buscarColecoes().then(setColecoes).catch(() => setColecoes([]));

      if (colecaoDaRota) {
        setColecaoId(colecaoDaRota);                // marca a coleção no "Salvar em"
        router.setParams({ colecaoId: undefined }); // apaga o parâmetro, já foi usado
      }
    }, [colecaoDaRota])
  );

  async function salvar() {
    setSalvando(true);
    setErro(null);

    // Guarda o destino ANTES de salvar (depois o formulário é limpo)
    const destino: Destino = {
      id: colecaoId,
      nome: colecoes.find((c) => c.id === colecaoId)?.name ?? '',
    };

    try {
      await criarItem({
        type: aba === 'url' ? 'link' : 'text',
        url: aba === 'url' ? url : undefined,
        content: aba === 'texto' ? texto : undefined,
        title: titulo,
        note: nota,
        tags,
        collection_id: colecaoId,
      });
      // Deu certo: limpa os campos e abre o modal
      setUrl('');
      setTexto('');
      setTitulo('');
      setTags('');
      setNota('');
      setSalvoEm(destino);
      setModalAberto(true);
    } catch (e: any) {
      setErro(e.message ?? 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  // Fecha o modal (botão OK, toque fora ou botão voltar do Android)
  function fecharModal() {
    setModalAberto(false);
  }

  // Fecha o modal e leva até onde o item foi salvo
  function verOndeFoiSalvo() {
    const destino = salvoEm;
    setModalAberto(false);
    if (!destino) return;
    if (destino.id) {
      router.push({ pathname: '/colecao/[id]', params: { id: destino.id } });
    } else {
      router.push('/caixa'); // tela vazia até a Etapa 7
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Adicionar item</Text>

      {/* Abas URL / Texto */}
      <View style={estilos.linha}>
        <Pressable onPress={() => setAba('url')} style={[estilos.chip, aba === 'url' && estilos.chipAtivo]}>
          <Text style={[estilos.chipTexto, aba === 'url' && estilos.chipTextoAtivo]}>URL</Text>
        </Pressable>
        <Pressable onPress={() => setAba('texto')} style={[estilos.chip, aba === 'texto' && estilos.chipAtivo]}>
          <Text style={[estilos.chipTexto, aba === 'texto' && estilos.chipTextoAtivo]}>Texto</Text>
        </Pressable>
      </View>

      {/* Campo principal: muda conforme a aba */}
      {aba === 'url' ? (
        <TextInput
          style={estilos.campo}
          placeholder="Cole o endereço (https://...)"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      ) : (
        <TextInput
          style={[estilos.campo, { minHeight: 110, textAlignVertical: 'top' }]}
          placeholder="Escreva o texto que quer guardar"
          value={texto}
          onChangeText={setTexto}
          multiline
        />
      )}

      <TextInput style={estilos.campo} placeholder="Título (opcional)" value={titulo} onChangeText={setTitulo} />

           {/* Salvar em: Caixa de entrada + coleções (o estado colecaoId continua aqui na tela) */}
      <SeletorDeColecao colecoes={colecoes} valor={colecaoId} aoEscolher={setColecaoId} />

      <TextInput
        style={estilos.campo}
        placeholder="Tags separadas por vírgula (opcional)"
        value={tags}
        onChangeText={setTags}
        autoCapitalize="none"
      />
      <TextInput
        style={[estilos.campo, { minHeight: 70, textAlignVertical: 'top' }]}
        placeholder="Nota pessoal: por que você quer guardar isso? (opcional)"
        value={nota}
        onChangeText={setNota}
        multiline
      />

      {erro && <Text style={estilos.erro}>{erro}</Text>}

      <Pressable onPress={salvar} disabled={salvando} style={[estilos.botao, salvando && { opacity: 0.6 }]}>
        {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={estilos.botaoTexto}>Salvar</Text>}
      </Pressable>

      {/* Modal de confirmação: aparece quando modalAberto é true */}
      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={fecharModal}>
        {/* Fundo escuro: tocar fora fecha */}
        <Pressable style={estilos.fundo} onPress={fecharModal}>
          {/* Caixa: o onPress vazio impede que tocar DENTRO feche o modal */}
          <Pressable style={estilos.caixa} onPress={() => {}}>
            <Text style={estilos.caixaTitulo}>✓ Item salvo</Text>
            <Text style={estilos.caixaTexto}>
              {salvoEm?.id ? `Salvo em ${salvoEm.nome}` : 'Salvo na Caixa de entrada'}
            </Text>

            <Pressable onPress={fecharModal} style={estilos.botao}>
              <Text style={estilos.botaoTexto}>OK</Text>
            </Pressable>
            <Pressable onPress={verOndeFoiSalvo} style={estilos.botaoSecundario}>
              <Text style={estilos.botaoSecundarioTexto}>
                {salvoEm?.id ? `Ver em ${salvoEm.nome}` : 'Ver na Caixa'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  titulo: { fontSize: 24, fontWeight: '700', color: '#4A2250' },
  linha: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EFE3EA' },
  chipAtivo: { backgroundColor: '#4A2250' },
  chipTexto: { fontSize: 12, color: '#4A2250', fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
  campo: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, fontSize: 14, color: '#2B1B2E' },
  erro: { color: '#B3261E', fontSize: 13 },
  botao: { backgroundColor: '#4A2250', borderRadius: 10, padding: 14, alignItems: 'center' },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700' },
  botaoSecundario: { borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#4A2250' },
  botaoSecundarioTexto: { color: '#4A2250', fontWeight: '700' },
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  caixa: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 12 },
  caixaTitulo: { fontSize: 18, fontWeight: '700', color: '#2E7D32', textAlign: 'center' },
  caixaTexto: { fontSize: 14, color: '#2B1B2E', textAlign: 'center', marginBottom: 4 },
});