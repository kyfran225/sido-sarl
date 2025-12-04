import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('sido_mobile.db');

export interface TransactionQueueItem {
  id?: number;
  auditId: string;
  clientSid: string;
  amountFCFA: number;
  litres: number;
  localTimestamp: string;
  deviceId: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  serverId?: string;
  serverTimestamp?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseService {
  static init() {
    return new Promise<void>((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS transaction_queue (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              auditId TEXT UNIQUE NOT NULL,
              clientSid TEXT NOT NULL,
              amountFCFA REAL NOT NULL,
              litres REAL NOT NULL,
              localTimestamp TEXT NOT NULL,
              deviceId TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending',
              serverId TEXT,
              serverTimestamp TEXT,
              errorMessage TEXT,
              retryCount INTEGER DEFAULT 0,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL
            )`,
            [],
            () => resolve(),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }

  static enqueueTransaction(transaction: Omit<TransactionQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO transaction_queue (
              auditId, clientSid, amountFCFA, litres, localTimestamp, deviceId,
              status, retryCount, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
            [
              transaction.auditId,
              transaction.clientSid,
              transaction.amountFCFA,
              transaction.litres,
              transaction.localTimestamp,
              transaction.deviceId,
              now,
              now,
            ],
            (_, result) => resolve(result.insertId),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }

  static getPendingTransactions(): Promise<TransactionQueueItem[]> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT * FROM transaction_queue WHERE status IN ('pending', 'failed') ORDER BY createdAt ASC`,
            [],
            (_, result) => {
              const transactions: TransactionQueueItem[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                transactions.push(result.rows.item(i));
              }
              resolve(transactions);
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }

  static updateTransactionStatus(
    auditId: string,
    status: TransactionQueueItem['status'],
    serverId?: string,
    serverTimestamp?: string,
    errorMessage?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const params: any[] = [status, now];
      let query = `UPDATE transaction_queue SET status = ?, updatedAt = ?`;

      if (serverId) {
        query += `, serverId = ?`;
        params.push(serverId);
      }

      if (serverTimestamp) {
        query += `, serverTimestamp = ?`;
        params.push(serverTimestamp);
      }

      if (errorMessage) {
        query += `, errorMessage = ?, retryCount = retryCount + 1`;
        params.push(errorMessage);
      }

      query += ` WHERE auditId = ?`;
      params.push(auditId);

      db.transaction(
        (tx) => {
          tx.executeSql(
            query,
            params,
            () => resolve(),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }

  static getTransactionQueueStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    synced: number;
  }> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT status, COUNT(*) as count FROM transaction_queue GROUP BY status`,
            [],
            (_, result) => {
              const stats = { pending: 0, syncing: 0, failed: 0, synced: 0 };
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                stats[row.status as keyof typeof stats] = row.count;
              }
              resolve(stats);
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }

  static clearOldSyncedTransactions(daysOld: number = 30): Promise<void> {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffISOString = cutoffDate.toISOString();

      db.transaction(
        (tx) => {
          tx.executeSql(
            `DELETE FROM transaction_queue WHERE status = 'synced' AND updatedAt < ?`,
            [cutoffISOString],
            () => resolve(),
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }
}
