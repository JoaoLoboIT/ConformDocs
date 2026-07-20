# Visão geral do ConformDocs

## Problema

Empresas recebem documentos fiscais e não fiscais com formatos, campos, regras e períodos de validade diferentes. Processos manuais dificultam o acompanhamento de pendências, a validação contra dados do ERP e o direcionamento das divergências para a área responsável.

## Objetivo

Centralizar o recebimento de documentos de fornecedores, estruturar seus dados, executar validações automáticas, controlar vencimentos, tratar divergências e conduzir workflows de aprovação até a escrituração simulada.

## Justificativa NoSQL

Cada tipo documental possui campos próprios. O MongoDB permite armazenar campos dinâmicos em `metadata`, além de arrays e objetos aninhados para validações, divergências, workflow, snapshots e histórico, sem obrigar todos os documentos a compartilhar a mesma estrutura.

## Principais coleções

- `suppliers`: fornecedores;
- `purchaseOrders`: pedidos vindos do ERP simulado;
- `documentTypes`: modelos e regras configuráveis;
- `documents`: documentos, metadados, validações, divergências e workflow;
- `auditLogs`: rastreabilidade de ações.
