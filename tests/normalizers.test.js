import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCnpj,
  normalizeCode,
  parseBoolean,
  toArray,
} from "../src/utils/normalizers.js";

test("normaliza CNPJ removendo máscara", () => {
  assert.equal(normalizeCnpj("12.345.678/0001-95"), "12345678000195");
});

test("normaliza códigos para o padrão de domínio", () => {
  assert.equal(normalizeCode("Certidão Federal"), "CERTIDAO_FEDERAL");
});

test("converte valores de checkbox e arrays", () => {
  assert.equal(parseBoolean("on"), true);
  assert.deepEqual(toArray("ITEM"), ["ITEM"]);
  assert.deepEqual(toArray(undefined), []);
});
