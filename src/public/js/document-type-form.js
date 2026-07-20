const form = document.querySelector("[data-document-type-form]");

if (form) {
  const editor = form.querySelector("[data-custom-fields-editor]");
  const hiddenInput = form.querySelector("#customFieldsJson");
  const initialDataElement = form.querySelector("#initialCustomFields");
  const initialFields = JSON.parse(initialDataElement?.textContent || "[]");

  function createFieldRow(field = {}) {
    const row = document.createElement("div");
    row.className = "dynamic-field-row";
    row.innerHTML = `
            <div class="form-field"><label>Identificador</label><input data-field-key type="text" placeholder="numero_serie" /></div>
            <div class="form-field"><label>Rótulo</label><input data-field-label type="text" placeholder="Número de série" /></div>
            <div class="form-field"><label>Tipo</label><select data-field-type><option value="text">Texto</option><option value="number">Número</option><option value="date">Data</option><option value="textarea">Texto longo</option><option value="select">Lista de opções</option></select></div>
            <div class="form-field"><label>Opções (separadas por vírgula)</label><input data-field-options type="text" placeholder="Opção A, Opção B" /></div>
            <label class="inline-check"><input data-field-required type="checkbox" /> Obrigatório</label>
            <button class="icon-button icon-button--danger" data-remove-field type="button" aria-label="Remover campo">×</button>
        `;

    row.querySelector("[data-field-key]").value = field.key || "";
    row.querySelector("[data-field-label]").value = field.label || "";
    row.querySelector("[data-field-type]").value = field.type || "text";
    row.querySelector("[data-field-options]").value = (
      field.options || []
    ).join(", ");
    row.querySelector("[data-field-required]").checked = Boolean(
      field.required,
    );
    row
      .querySelector("[data-remove-field]")
      .addEventListener("click", () => row.remove());
    editor.appendChild(row);
  }

  initialFields.forEach(createFieldRow);
  form
    .querySelector("[data-add-custom-field]")
    ?.addEventListener("click", () => createFieldRow());

  form.addEventListener("submit", () => {
    const fields = [...editor.querySelectorAll(".dynamic-field-row")].map(
      (row) => ({
        key: row.querySelector("[data-field-key]").value,
        label: row.querySelector("[data-field-label]").value,
        type: row.querySelector("[data-field-type]").value,
        required: row.querySelector("[data-field-required]").checked,
        options: row
          .querySelector("[data-field-options]")
          .value.split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      }),
    );
    hiddenInput.value = JSON.stringify(fields);
  });
}
