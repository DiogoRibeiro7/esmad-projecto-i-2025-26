import { ObjectId, type Collection, type Db } from "mongodb";
import type { ItemCreateInput, ItemDoc, ItemPatchInput } from "../models/item.js";

export class ItemRepository {
  private readonly col: Collection<ItemDoc>;

  constructor(db: Db) {
    this.col = db.collection<ItemDoc>("items");
  }

  async ensureIndexes(): Promise<void> {
    await this.col.createIndex({ createdAt: -1 });
    await this.col.createIndex({ status: 1, createdAt: -1 });
  }

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

  async list(limit: number): Promise<ItemDoc[]> {
    return this.col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  async getById(id: string): Promise<ItemDoc | null> {
    return this.col.findOne({ _id: new ObjectId(id) });
  }

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

  async delete(id: string): Promise<boolean> {
    const res = await this.col.deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount === 1;
  }
}
