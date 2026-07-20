const body = document.body;

document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
  button.addEventListener("click", () => body.classList.toggle("sidebar-open"));
});

document.querySelectorAll("[data-alert-close]").forEach((button) => {
  button.addEventListener("click", () =>
    button.closest("[data-alert]")?.remove(),
  );
});

setTimeout(() => {
  document
    .querySelectorAll("[data-alert]")
    .forEach((alert) => alert.classList.add("alert--fade"));
}, 6500);

document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});

function formatCnpjInput(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length > 10)
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
  return digits.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
}

document.querySelectorAll("[data-mask='cnpj']").forEach((input) => {
  input.addEventListener(
    "input",
    () => (input.value = formatCnpjInput(input.value)),
  );
});

document.querySelectorAll("[data-mask='phone']").forEach((input) => {
  input.addEventListener(
    "input",
    () => (input.value = formatPhoneInput(input.value)),
  );
});
