import { ObjectId, type Collection, type Db } from "mongodb";
import type { ItemCreateInput, ItemDoc, ItemPatchInput } from "../models/item.js";

/**
 * Camada de acesso a dados dos itens.
 *
 * Esta classe encapsula operações MongoDB para que as rotas não fiquem
 * acopladas aos detalhes da base de dados.
 */
export class ItemRepository {
  private readonly col: Collection<ItemDoc>;

  /**
   * @param db Ligação MongoDB já estabelecida.
   */
  constructor(db: Db) {
    this.col = db.collection<ItemDoc>("items");
  }

  /**
   * Cria índices úteis para as queries mais frequentes.
   */
  async ensureIndexes(): Promise<void> {
    await this.col.createIndex({ createdAt: -1 });
    await this.col.createIndex({ status: 1, createdAt: -1 });
  }

  /**
   * Cria um novo item com estado inicial `open`.
   *
   * @param input Dados de criação validados.
   * @param nowIso Timestamp ISO para `createdAt` e `updatedAt`.
   * @returns Documento criado.
   */
  async create(input: ItemCreateInput, nowIso: string): Promise<ItemDoc> {
    const doc: ItemDoc = {
      _id: new ObjectId(),
      title: input.title,
      status: "open",
      tags: input.tags,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await this.col.insertOne(doc);
    return doc;
  }

  /**
   * Lista itens ordenados dos mais recentes para os mais antigos.
   *
   * @param limit Número máximo de resultados.
   * @returns Lista de documentos.
   */
  async list(limit: number): Promise<ItemDoc[]> {
    return this.col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  /**
   * Procura um item pelo seu `_id`.
   *
   * @param id Identificador em formato string.
   * @returns Documento encontrado ou `null`.
   */
  async getById(id: string): Promise<ItemDoc | null> {
    return this.col.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Atualiza parcialmente um item existente.
   *
   * @param id Identificador do item.
   * @param patch Campos a alterar.
   * @param nowIso Timestamp ISO para atualizar `updatedAt`.
   * @returns Documento atualizado ou `null` se não existir.
   */
  async patch(id: string, patch: ItemPatchInput, nowIso: string): Promise<ItemDoc | null> {
    const update: Record<string, unknown> = { updatedAt: nowIso };

    if (patch.title !== undefined) update.title = patch.title;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.tags !== undefined) update.tags = patch.tags;

    const res = await this.col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    return res ?? null;
  }

  /**
   * Remove um item pelo id.
   *
   * @param id Identificador do item.
   * @returns `true` se apagou 1 documento, `false` caso contrário.
   */
  async delete(id: string): Promise<boolean> {
    const res = await this.col.deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount === 1;
  }
}
