/**
 * Ejecuta una función dentro de una transacción. Commit al terminar sin error,
 * rollback ante cualquier excepción; el cliente siempre se libera.
 */
import type { Pool, PoolClient } from "pg";

export async function withTransaction<T>(
  pool: Pool,
  fn: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
