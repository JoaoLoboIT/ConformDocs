import test from "node:test";
import assert from "node:assert/strict";
import {
  approveCurrentWorkflowStep,
  buildDefaultWorkflowTemplate,
  createWorkflowState,
  rejectCurrentWorkflowStep,
} from "../src/services/workflow.service.js";

test("workflow fiscal com pedido possui três etapas", () => {
  const template = buildDefaultWorkflowTemplate({
    category: "FISCAL",
    requiresPurchaseOrder: true,
  });
  assert.deepEqual(
    template.map((step) => step.code),
    ["FISCAL_REVIEW", "PURCHASING_APPROVAL", "FINANCE_APPROVAL"],
  );
});

test("aprovação avança para a próxima etapa", () => {
  const workflow = createWorkflowState([
    { code: "A", label: "Etapa A", department: "Fiscal" },
    { code: "B", label: "Etapa B", department: "Financeiro" },
  ]);
  const result = approveCurrentWorkflowStep(workflow, "Ok", { name: "Teste" });
  assert.equal(result.finished, false);
  assert.equal(result.workflow.steps[0].status, "APPROVED");
  assert.equal(result.workflow.steps[1].status, "PENDING");
});

test("rejeição encerra o fluxo", () => {
  const workflow = createWorkflowState([
    { code: "A", label: "Etapa A", department: "Fiscal" },
  ]);
  const result = rejectCurrentWorkflowStep(workflow, "Dados incorretos", {
    name: "Teste",
  });
  assert.equal(result.currentStepIndex, null);
  assert.equal(result.steps[0].status, "REJECTED");
});
