const documentForm = document.querySelector("[data-document-form]");

if (documentForm) {
  const types = JSON.parse(
    document.querySelector("#documentTypesData")?.textContent || "[]",
  );
  const suppliers = JSON.parse(
    document.querySelector("#suppliersData")?.textContent || "[]",
  );
  const initialMetadata = JSON.parse(
    document.querySelector("#initialMetadata")?.textContent || "{}",
  );
  const typeSelect = documentForm.querySelector("#typeId");
  const supplierSelect = documentForm.querySelector("#supplierId");
  const purchaseOrderSelect = documentForm.querySelector("#purchaseOrderId");
  const customFieldsContainer = documentForm.querySelector(
    "[data-document-custom-fields]",
  );
  const customFieldsSection = documentForm.querySelector(
    "[data-custom-fields-section]",
  );
  const expirationField = documentForm.querySelector("[data-expiration-field]");
  const purchaseOrderField = documentForm.querySelector(
    "[data-purchase-order-field]",
  );
  const metadataInput = documentForm.querySelector("#metadataJson");
  const fileInput = documentForm.querySelector("#attachmentFile");
  const fileNameLabel = documentForm.querySelector("[data-file-name]");

  function selectedType() {
    return types.find((type) => type._id === typeSelect.value);
  }

  function renderCustomFields() {
    const type = selectedType();
    customFieldsContainer.innerHTML = "";
    const fields = type?.customFields || [];
    customFieldsSection.hidden = fields.length === 0;

    fields.forEach((field) => {
      const wrapper = document.createElement("div");
      wrapper.className =
        field.type === "textarea"
          ? "form-field form-field--wide"
          : "form-field";
      const label = document.createElement("label");
      label.htmlFor = `metadata_${field.key}`;
      label.textContent = field.label;
      if (field.required) {
        const required = document.createElement("span");
        required.textContent = " *";
        label.appendChild(required);
      }

      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 3;
      } else if (field.type === "select") {
        input = document.createElement("select");
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "Selecione";
        input.appendChild(empty);
        (field.options || []).forEach((optionValue) => {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue;
          input.appendChild(option);
        });
      } else {
        input = document.createElement("input");
        input.type = field.type;
        if (field.type === "number") input.step = "0.01";
      }

      input.id = `metadata_${field.key}`;
      input.dataset.metadataKey = field.key;
      input.required = Boolean(field.required);
      input.value = initialMetadata[field.key] ?? "";
      wrapper.append(label, input);
      customFieldsContainer.appendChild(wrapper);
    });

    expirationField.hidden = !type?.hasExpiration;
    expirationField.querySelector("input").required = Boolean(
      type?.hasExpiration,
    );
    purchaseOrderField.hidden = !type?.requiresPurchaseOrder;
    purchaseOrderSelect.required = Boolean(type?.requiresPurchaseOrder);
  }

  function filterPurchaseOrders() {
    const supplierId = supplierSelect.value;
    [...purchaseOrderSelect.options].forEach((option, index) => {
      if (index === 0) return;
      const visible = !supplierId || option.dataset.supplierId === supplierId;
      option.hidden = !visible;
      option.disabled = !visible;
      if (!visible && option.selected) purchaseOrderSelect.value = "";
    });
  }

  function collectMetadata() {
    const metadata = {};
    documentForm.querySelectorAll("[data-metadata-key]").forEach((input) => {
      metadata[input.dataset.metadataKey] = input.value;
    });
    metadataInput.value = JSON.stringify(metadata);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  typeSelect.addEventListener("change", renderCustomFields);
  supplierSelect.addEventListener("change", filterPurchaseOrders);
  fileInput?.addEventListener("change", () => {
    fileNameLabel.textContent =
      fileInput.files[0]?.name || "Nenhum arquivo selecionado";
  });

  documentForm
    .querySelector("[data-simulate-ocr]")
    ?.addEventListener("click", () => {
      const type = selectedType();
      const supplier = suppliers.find(
        (item) => item._id === supplierSelect.value,
      );
      const today = new Date().toISOString().slice(0, 10);
      documentForm.querySelector("#documentNumber").value ||=
        `AUTO-${String(Date.now()).slice(-7)}`;
      documentForm.querySelector("#issueDate").value ||= today;
      documentForm.querySelector("#source").value = "AUTOMATIC_CAPTURE";

      const selectedOrder = purchaseOrderSelect.selectedOptions[0];
      if (
        selectedOrder?.dataset.remaining &&
        !documentForm.querySelector("#amount").value
      ) {
        documentForm.querySelector("#amount").value = Math.min(
          Number(selectedOrder.dataset.remaining),
          1250,
        ).toFixed(2);
      }

      documentForm.querySelectorAll("[data-metadata-key]").forEach((input) => {
        const key = input.dataset.metadataKey.toLowerCase();
        if (key.includes("cnpj") && supplier) input.value = supplier.cnpj;
        else if (key.includes("serie")) input.value = "1";
        else if (key.includes("chave"))
          input.value = String(Date.now()).padEnd(44, "0").slice(0, 44);
        else if (key.includes("orgao")) input.value = "Órgão emissor simulado";
        else if (!input.value && input.type !== "date")
          input.value = `Extraído automaticamente (${type?.code || "DOC"})`;
      });

      window.alert(
        "Leitura automática simulada: os campos foram preenchidos com dados de demonstração.",
      );
    });

  documentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const action = event.submitter?.dataset.submitAction || "draft";
    documentForm.querySelector("#submissionAction").value = action;
    collectMetadata();

    const file = fileInput?.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        window.alert("O arquivo deve possuir no máximo 8 MB.");
        return;
      }
      documentForm.querySelector("#fileData").value =
        await readFileAsDataUrl(file);
      documentForm.querySelector("#fileName").value = file.name;
      documentForm.querySelector("#fileMimeType").value = file.type;
    }

    documentForm.submit();
  });

  renderCustomFields();
  filterPurchaseOrders();
}
