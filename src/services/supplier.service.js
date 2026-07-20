import { AppError } from "../errors/app-error.js";
import {
  findActiveSuppliers,
  findAllSuppliers,
  findSupplierByCnpj,
  findSupplierById,
  insertSupplier,
  updateSupplierById,
} from "../repositories/supplier.repository.js";
import { normalizeCnpj, normalizePhone } from "../utils/normalizers.js";
import { registerAudit } from "./audit.service.js";

function normalizeSupplier(data) {
  return {
    legalName: data.legalName?.trim(),
    tradeName: data.tradeName?.trim(),
    cnpj: normalizeCnpj(data.cnpj),
    email: data.email?.trim().toLowerCase(),
    phone: normalizePhone(data.phone),
    contactName: data.contactName?.trim() || null,
  };
}

function validateSupplier(supplier) {
  const required = [
    supplier.legalName,
    supplier.tradeName,
    supplier.cnpj,
    supplier.email,
    supplier.phone,
  ];
  if (required.some((value) => !value))
    throw new AppError("Preencha todos os campos obrigatórios.");
  if (supplier.cnpj.length !== 14)
    throw new AppError("O CNPJ deve possuir 14 números.");
  if (!/^\S+@\S+\.\S+$/.test(supplier.email))
    throw new AppError("Informe um e-mail válido.");
  if (![10, 11].includes(supplier.phone.length))
    throw new AppError("O telefone deve possuir 10 ou 11 números.");
}

export async function listSuppliers(filters = {}) {
  return findAllSuppliers(filters);
}

export async function listActiveSuppliers() {
  return findActiveSuppliers();
}

export async function getSupplierById(id) {
  const supplier = await findSupplierById(id);
  if (!supplier) throw new AppError("Fornecedor não encontrado.", 404);
  return supplier;
}

export async function createSupplier(data) {
  const supplier = normalizeSupplier(data);
  validateSupplier(supplier);

  if (await findSupplierByCnpj(supplier.cnpj)) {
    throw new AppError("Já existe um fornecedor cadastrado com este CNPJ.");
  }

  const now = new Date();
  const created = await insertSupplier({
    ...supplier,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await registerAudit({
    entityType: "SUPPLIER",
    entityId: created._id,
    action: "CREATE",
    description: `Fornecedor ${created.tradeName} cadastrado.`,
  });

  return created;
}

export async function updateSupplier(id, data) {
  await getSupplierById(id);
  const supplierData = {
    ...normalizeSupplier(data),
    status: data.status,
  };
  validateSupplier(supplierData);

  if (!["ACTIVE", "INACTIVE"].includes(supplierData.status)) {
    throw new AppError("O status informado é inválido.");
  }

  const sameCnpj = await findSupplierByCnpj(supplierData.cnpj);
  if (sameCnpj && sameCnpj._id.toString() !== id) {
    throw new AppError("Já existe outro fornecedor cadastrado com este CNPJ.");
  }

  const updated = await updateSupplierById(id, {
    ...supplierData,
    updatedAt: new Date(),
  });

  await registerAudit({
    entityType: "SUPPLIER",
    entityId: updated._id,
    action: "UPDATE",
    description: `Fornecedor ${updated.tradeName} atualizado.`,
  });

  return updated;
}
