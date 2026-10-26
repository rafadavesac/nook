# Nook

Aplicativo mobile pessoal para **guardar, organizar e reencontrar** links, textos e (em breve) imagens.

O Nook é um projeto de aprendizado: o foco é entender cada parte de um app real, do banco de dados à tela.

## O que já funciona

- Salvar links e textos, com título, nota e tags
- Organizar em coleções; itens sem coleção ficam na **Caixa de Entrada**
- Marcar favoritos e filtrar por **Todos / Favoritos**
- Itens agrupados por mês
- Pesquisa por título, nota, tags, coleção e domínio
- Tela de detalhe: editar, mover de coleção, favoritar, abrir o conteúdo original e excluir (com confirmação)
- Receber conteúdo pelo menu **Compartilhar** do celular (testado no Android)

## Próximos passos

- Imagens da galeria (upload no Supabase Storage)
- Aba global de Favoritos
- Pré-visualização automática de links
- Tela de Ajustes e polimento visual

## Tecnologias

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (Expo Router)
- [Supabase](https://supabase.com/): Postgres, autenticação anônima e RLS (Row Level Security)
- [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) para receber conteúdo compartilhado
- TypeScript

## Estrutura

```
src/
├── app/         telas e rotas (Expo Router)
├── components/  peças visuais reutilizáveis
├── hooks/       lógica de estado reutilizável
├── services/    comunicação com o Supabase
└── utils/       funções puras (agrupar por mês, separar título e link...)
```

As telas nunca falam direto com o banco: elas chamam os `services`, que conversam com o Supabase.

## Como rodar

Você precisa de um projeto Supabase próprio, com as tabelas `collections` e `items`, login anônimo ligado e RLS ativada.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz com as chaves do **seu** projeto Supabase:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
   ```

   Use apenas a chave *publishable*. Nunca coloque chaves secretas no app.

3. Gere um development build (o recebimento de compartilhamento não funciona no Expo Go):

   ```bash
   eas build --platform android --profile development
   ```

4. Com o build instalado no celular, inicie o servidor:

   ```bash
   npx expo start --dev-client
   ```
