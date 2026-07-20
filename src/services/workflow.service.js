import { ObjectId } from "mongodb";

export function buildDefaultWorkflowTemplate({
  category,
  requiresPurchaseOrder,
}) {
  if (category === "FISCAL") {
    const steps = [
      {
        code: "FISCAL_REVIEW",
        label: "Validação fiscal",
        department: "Fiscal",
      },
    ];

    if (requiresPurchaseOrder) {
      steps.push({
        code: "PURCHASING_APPROVAL",
        label: "Aprovação de compras",
        department: "Compras",
      });
    }

    steps.push({
      code: "FINANCE_APPROVAL",
      label: "Aprovação financeira",
      department: "Financeiro",
    });
    return steps;
  }

  return [
    {
      code: "COMPLIANCE_REVIEW",
      label: "Revisão de conformidade",
      department: "Compliance",
    },
    {
      code: "FINAL_APPROVAL",
      label: "Aprovação final",
      department: "Jurídico",
    },
  ];
}

export function createWorkflowState(template = []) {
  const steps = template.map((step, index) => ({
    _id: new ObjectId(),
    code: step.code,
    label: step.label,
    department: step.department,
    status: index === 0 ? "PENDING" : "WAITING",
    decidedAt: null,
    decidedBy: null,
    note: null,
  }));

  return {
    currentStepIndex: steps.length ? 0 : null,
    steps,
  };
}

export function approveCurrentWorkflowStep(workflow, note, actor) {
  const steps = workflow.steps.map((step) => ({ ...step }));
  const currentIndex = workflow.currentStepIndex;

  if (
    currentIndex === null ||
    !steps[currentIndex] ||
    steps[currentIndex].status !== "PENDING"
  ) {
    throw new Error("Não há uma etapa de aprovação pendente.");
  }

  steps[currentIndex] = {
    ...steps[currentIndex],
    status: "APPROVED",
    decidedAt: new Date(),
    decidedBy: actor,
    note: note?.trim() || null,
  };

  const nextIndex = currentIndex + 1 < steps.length ? currentIndex + 1 : null;
  if (nextIndex !== null) {
    steps[nextIndex] = { ...steps[nextIndex], status: "PENDING" };
  }

  return {
    workflow: { currentStepIndex: nextIndex, steps },
    finished: nextIndex === null,
  };
}

export function rejectCurrentWorkflowStep(workflow, note, actor) {
  const steps = workflow.steps.map((step) => ({ ...step }));
  const currentIndex = workflow.currentStepIndex;

  if (
    currentIndex === null ||
    !steps[currentIndex] ||
    steps[currentIndex].status !== "PENDING"
  ) {
    throw new Error("Não há uma etapa de aprovação pendente.");
  }

  steps[currentIndex] = {
    ...steps[currentIndex],
    status: "REJECTED",
    decidedAt: new Date(),
    decidedBy: actor,
    note: note?.trim() || "Documento rejeitado.",
  };

  return {
    currentStepIndex: null,
    steps,
  };
}
