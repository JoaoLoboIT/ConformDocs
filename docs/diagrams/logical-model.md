# Modelo lógico documental

```mermaid
flowchart LR
    suppliers[(suppliers)] -->|supplierId + snapshot| purchaseOrders[(purchaseOrders)]
    suppliers -->|supplierId + snapshot| documents[(documents)]
    documentTypes[(documentTypes)] -->|typeId + snapshot| documents
    purchaseOrders -->|purchaseOrderId + snapshot| documents
    documents -->|ações rastreadas| auditLogs[(auditLogs)]

    documents --> validations[validations embutidas]
    documents --> divergences[divergences embutidas]
    documents --> workflow[workflow embutido]
    documents --> history[statusHistory embutido]
```

## Decisões de modelagem

- Referências por `ObjectId` preservam o vínculo entre coleções compartilhadas.
- Snapshots guardam o estado histórico de fornecedor, tipo e pedido no momento do recebimento.
- Validações, divergências, workflow e histórico ficam embutidos no documento porque são consultados em conjunto.
- `metadata` armazena campos variáveis definidos por cada tipo documental.
