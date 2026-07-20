# ConformDocs

Sistema web full stack para gestão, validação, aprovação e controle de vencimento de documentos fiscais e não fiscais enviados por fornecedores.

O projeto simula partes de uma esteira empresarial como a do V360: recebimento de documentos, leitura automática simulada, cruzamento com pedido de compra, tratamento de divergências, workflow de aprovação e escrituração em ERP simulado.

## Tecnologias

- Node.js 24
- Express 5
- EJS
- HTML, CSS e JavaScript
- MongoDB 8
- Driver oficial `mongodb`

O projeto **não utiliza ORM ou ODM**. Todos os acessos ao banco são executados nos repositories por meio do driver oficial do MongoDB.

## Arquitetura

```text
Routes
  ↓
Controllers
  ↓
Services (regras de negócio)
  ↓
Repositories (acesso exclusivo ao MongoDB)
  ↓
MongoDB
```

## Funcionalidades

- Dashboard com indicadores e Aggregation Pipeline;
- Cadastro, consulta e edição de fornecedores;
- Pedidos de compra que simulam dados do ERP;
- Tipos de documento configuráveis;
- Campos personalizados por tipo de documento;
- Upload de PDF e imagens sem biblioteca externa;
- Leitura automática/OCR simulada;
- Validações automáticas;
- Detecção e tratamento de divergências;
- Workflow de aprovação por área;
- Controle de vencimentos;
- Escrituração simulada no ERP;
- Consumo do saldo do pedido de compra;
- Histórico de status e logs de auditoria;
- Índices e validação de esquema no MongoDB.

## Como executar

### 1. Instalar dependências

```powershell
npm.cmd install
```

### 2. Criar o arquivo `.env`

Copie `.env.example` para `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=conformdocs
MAX_UPLOAD_MB=8
NODE_ENV=development
```

### 3. Iniciar o MongoDB

No Windows, usando o diretório criado durante o desenvolvimento:

```powershell
mongod --dbpath "$env:USERPROFILE\MongoData\db"
```

Mantenha esse terminal aberto.

### 4. Configurar banco, validações, índices e dados de demonstração

Em outro terminal:

```powershell
npm.cmd run db:init
```

Esse comando cria/configura as coleções:

- `suppliers`
- `purchaseOrders`
- `documentTypes`
- `documents`
- `auditLogs`

Também insere tipos de documento, um fornecedor e um pedido de demonstração quando ainda não existirem.

### 5. Iniciar a aplicação

```powershell
npm.cmd run dev
```

Acesse:

```text
http://localhost:3000
```

## Testes

```powershell
npm.cmd test
```

## Formatação

```powershell
npm.cmd run format
```

## Fluxo de demonstração sugerido

1. Abra **Tipos de documento** e confira os modelos criados pelo seed;
2. Abra **Pedidos de compra** e verifique o pedido `PC-2026-001`;
3. Clique em **Receber documento**;
4. Selecione `Nota Fiscal Eletrônica`, o fornecedor e o pedido;
5. Clique em **Simular leitura automática**;
6. Anexe um PDF ou imagem opcional;
7. Clique em **Receber e validar**;
8. Corrija divergências, se houver, e revalide;
9. Aprove cada etapa do workflow;
10. Envie ao ERP simulado;
11. Verifique a redução do saldo do pedido e os indicadores do dashboard.
