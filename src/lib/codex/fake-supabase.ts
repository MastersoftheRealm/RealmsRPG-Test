/**
 * Minimal in-memory Supabase double for the codex action tests.
 * Supports only the query shapes the admin write layer uses: select/insert/upsert/update/delete
 * with `eq` filters, `single`/`maybeSingle`, and a stubbed `rpc`.
 */

type Row = Record<string, unknown>;
type QueryResult = { data: unknown; error: { message: string; code?: string } | null };

export type FakeSupabaseOptions = {
  /** Tables whose *next* insert fails, simulating a mid-write DB error that then clears. */
  failInsertOnce?: Set<string>;
};

export class FakeSupabase {
  readonly tables: Record<string, Row[]>;
  private readonly options: FakeSupabaseOptions;

  constructor(tables: Record<string, Row[]>, options: FakeSupabaseOptions = {}) {
    this.tables = tables;
    this.options = options;
  }

  from(table: string): FakeQuery {
    return new FakeQuery(this, table, this.options);
  }

  async rpc(): Promise<QueryResult> {
    return { data: null, error: null };
  }
}

class FakeQuery implements PromiseLike<QueryResult> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: Row | Row[] = [];
  private readonly filters: Array<[string, unknown]> = [];

  constructor(
    private readonly db: FakeSupabase,
    private readonly table: string,
    private readonly options: FakeSupabaseOptions
  ) {}

  select(): this {
    return this;
  }

  insert(rows: Row | Row[]): this {
    this.op = 'insert';
    this.payload = rows;
    return this;
  }

  upsert(row: Row | Row[]): this {
    this.op = 'upsert';
    this.payload = row;
    return this;
  }

  update(patch: Row): this {
    this.op = 'update';
    this.payload = patch;
    return this;
  }

  delete(): this {
    this.op = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  order(): this {
    return this;
  }

  async maybeSingle(): Promise<QueryResult> {
    const result = await this.run();
    const data = Array.isArray(result.data) ? (result.data[0] ?? null) : result.data;
    return { data, error: result.error };
  }

  async single(): Promise<QueryResult> {
    const result = await this.maybeSingle();
    if (!result.error && result.data == null) {
      return { data: null, error: { message: 'No rows returned' } };
    }
    return result;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private matches(row: Row): boolean {
    return this.filters.every(([column, value]) => String(row[column] ?? '') === String(value));
  }

  private async run(): Promise<QueryResult> {
    const rows = this.db.tables[this.table];
    if (!rows) {
      return {
        data: null,
        error: { message: `relation "${this.table}" does not exist`, code: '42P01' },
      };
    }

    if (this.op === 'select') {
      return { data: rows.filter((row) => this.matches(row)), error: null };
    }

    if (this.op === 'insert' || this.op === 'upsert') {
      if (this.options.failInsertOnce?.has(this.table)) {
        this.options.failInsertOnce.delete(this.table);
        return { data: null, error: { message: `insert into ${this.table} failed` } };
      }
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
      const written: Row[] = [];
      for (const row of incoming) {
        const existingIndex = rows.findIndex((r) => String(r.id ?? '') === String(row.id ?? ''));
        if (this.op === 'upsert' && row.id != null && existingIndex >= 0) {
          rows[existingIndex] = { ...rows[existingIndex], ...row };
          written.push(rows[existingIndex]);
        } else {
          const inserted = { id: row.id ?? `auto_${rows.length + 1}`, ...row };
          rows.push(inserted);
          written.push(inserted);
        }
      }
      return { data: written, error: null };
    }

    if (this.op === 'update') {
      const updated: Row[] = [];
      rows.forEach((row, index) => {
        if (!this.matches(row)) return;
        rows[index] = { ...row, ...(this.payload as Row) };
        updated.push(rows[index]);
      });
      return { data: updated, error: null };
    }

    const removed = rows.filter((row) => this.matches(row));
    this.db.tables[this.table] = rows.filter((row) => !this.matches(row));
    return { data: removed, error: null };
  }
}
