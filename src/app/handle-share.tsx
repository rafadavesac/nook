// Tela "Salvar conteúdo": abre quando outro app compartilha algo com o Nook.
// C2: agora salva com criarItem, mostra "✓ Conteúdo salvo" na própria tela
// e limpa o compartilhamento recebido.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import SeletorDeColecao from '../components/SeletorDeColecao';
import { buscarColecoes, ColecaoComContagem } from '../services/colecoes';
import { criarItem } from '../services/itens';
import { origemDaUrl } from '../utils/origemDaUrl';
import { separarTituloELink } from '../utils/separarTituloELink';

export default function HandleShare() {
  const router = useRouter();

  // sharedPayloads = dados crus (na hora, sem internet).
  // clearSharedPayloads = função que esquece o que foi recebido.
  const { sharedPayloads, clearSharedPayloads } = useIncomingShare();

  const recebido = sharedPayloads[0]?.value ?? '';
  const { titulo: tituloSugerido, url } = separarTituloELink(recebido);

  // Campos do formulário
  const [titulo, setTitulo] = useState('');
  const [tags, setTags] = useState('');
  const [nota, setNota] = useState('');
  const [colecaoId, setColecaoId] = useState<string | null>(null); // null = Caixa de entrada
  const [colecoes, setColecoes] = useState<ColecaoComContagem[]>([]);

  // Estados do salvamento (um estado, uma responsabilidade)
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  // null = ainda não salvou; senão, guarda ONDE foi salvo (para a mensagem e o "Ver no Nook")
  const [salvo, setSalvo] = useState<{ nome: string; colecaoId: string | null } | null>(null);

  // Quando o conteúdo recebido MUDAR, recomeça o formulário.
  // ATENÇÃO: depois de salvar, clearSharedPayloads() faz "recebido" virar ''.
  // Por isso só escondemos a mensagem de sucesso quando chega um conteúdo NOVO (não vazio).
  useEffect(() => {
    setTitulo(tituloSugerido ?? '');
    setTags('');
    setNota('');
    setColecaoId(null);
    if (recebido !== '') {
      setSalvo(null);
      setErroSalvar(null);
    }
  }, [recebido]);

  useFocusEffect(
    useCallback(() => {
      buscarColecoes().then(setColecoes).catch(() => setColecoes([]));
    }, [])
  );

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      // Com link vira item "link"; sem link, o texto recebido inteiro vira item "texto".
      // A tela não fala com o banco: quem insere é o serviço criarItem (o mesmo do novo-item).
      await criarItem(
        url
          ? { type: 'link', url, title: titulo, note: nota, tags, collection_id: colecaoId }
          : { type: 'text', content: recebido, title: titulo, note: nota, tags, collection_id: colecaoId }
      );
      const destino = colecoes.find((c) => c.id === colecaoId);
      setSalvo({ nome: destino ? destino.name : 'Caixa de entrada', colecaoId });
      clearSharedPayloads(); // só DEPOIS de o banco confirmar
    } catch (e) {
      setErroSalvar(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  function verNoNook() {
    if (salvo?.colecaoId) {
      router.push({ pathname: '/colecao/[id]', params: { id: salvo.colecaoId } });
    } else {
      router.push('/caixa');
    }
  }

  // 1) Já salvou: mensagem de sucesso. Esta verificação vem ANTES da de "vazio",
  //    porque depois de limpar o compartilhamento "recebido" fica vazio.
  if (salvo) {
    return (
      <View style={estilos.vazio}>
        <Text style={estilos.titulo}>✓ Conteúdo salvo</Text>
        <Text style={estilos.vazioTexto}>Salvo em {salvo.nome}.</Text>
        {/* BackHandler.exitApp só existe no Android (o Nook só está configurado para Android) */}
        <Pressable style={estilos.botao} onPress={() => BackHandler.exitApp()}>
          <Text style={estilos.botaoTexto}>Fechar</Text>
        </Pressable>
        <Pressable style={estilos.botaoSecundario} onPress={verNoNook}>
          <Text style={estilos.botaoSecundarioTexto}>Ver no Nook</Text>
        </Pressable>
      </View>
    );
  }

  // 2) Nada recebido
  if (recebido === '') {
    return (
      <View style={estilos.vazio}>
        <Text style={estilos.titulo}>Salvar conteúdo</Text>
        <Text style={estilos.vazioTexto}>
          Nenhum conteúdo recebido. Compartilhe um link ou texto de outro app com o Nook.
        </Text>
      </View>
    );
  }

  // 3) Formulário
  return (
    <ScrollView contentContainerStyle={estilos.container} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Salvar conteúdo</Text>

      <View style={estilos.previa}>
        <View style={estilos.selo}>
          <Text style={estilos.seloTexto}>{url ? origemDaUrl(url) : 'Texto'}</Text>
        </View>
        {url ? (
          <>
            <Text style={estilos.previaTitulo} numberOfLines={2}>
              {tituloSugerido ?? 'Sem título'}
            </Text>
            <Text style={estilos.previaUrl} numberOfLines={1}>{url}</Text>
          </>
        ) : (
          <Text style={estilos.previaTexto}>{recebido}</Text>
        )}
      </View>

      <TextInput style={estilos.campo} placeholder="Título (opcional)" value={titulo} onChangeText={setTitulo} />

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

      {erroSalvar && <Text style={estilos.erro}>{erroSalvar}</Text>}

      <Pressable style={[estilos.botao, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando}>
        {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={estilos.botaoTexto}>Salvar</Text>}
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  vazio: { flex: 1, padding: 16, gap: 12 },
  vazioTexto: { fontSize: 14, color: '#7A6A7D' },
  titulo: { fontSize: 24, fontWeight: '700', color: '#4A2250' },
  previa: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, gap: 6 },
  selo: { alignSelf: 'flex-start', backgroundColor: '#EFE3EA', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  seloTexto: { fontSize: 11, fontWeight: '600', color: '#4A2250' },
  previaTitulo: { fontSize: 15, fontWeight: '700', color: '#2B1B2E' },
  previaUrl: { fontSize: 12, color: '#7A6A7D' },
  previaTexto: { fontSize: 14, color: '#2B1B2E' },
  campo: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, fontSize: 14, color: '#2B1B2E' },
  erro: { fontSize: 13, color: '#B3261E' },
  botao: { backgroundColor: '#4A2250', borderRadius: 12, padding: 14, alignItems: 'center' },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  botaoSecundario: { backgroundColor: '#EFE3EA', borderRadius: 12, padding: 14, alignItems: 'center' },
  botaoSecundarioTexto: { color: '#4A2250', fontWeight: '700', fontSize: 15 },
});