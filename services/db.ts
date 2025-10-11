
import Dexie, { Table } from 'dexie';
import { Task, TestPlan, ActiveTimer } from '../types';

// This is the standard and recommended way to use Dexie with TypeScript.
// It ensures that all Dexie methods like `transaction` are correctly typed
// and that the table properties are available on the db instance.
export class MySubClassedDexie extends Dexie {
  tasks!: Table<Task>;
  testPlans!: Table<TestPlan>;
  misc!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('neetSynapseDB');
    // FIX: Cast `this` to `Dexie` to make the `version()` method available.
    // TypeScript can fail to infer inherited methods on `this` inside the constructor
    // of a Dexie subclass.
    (this as Dexie).version(1).stores({
        tasks: 'id, date, subject, status, taskType, priority, sourceLectureTaskId',
        testPlans: 'id, date, status',
        misc: 'key', // Simple key-value store for single items
    });
  }
}

// FIX: Explicitly type `db` with an intersection of the class and its superclass `Dexie`.
// This resolves a TypeScript type inference issue where methods on the superclass (e.g., `transaction`)
// were not being recognized on the subclass instance in other files.
export const db: MySubClassedDexie & Dexie = new MySubClassedDexie();


// Helper functions to manage single key-value items
export async function setMiscItem(key: string, value: any) {
  return db.misc.put({ key, value });
}

export async function getMiscItem<T>(key: string, defaultValue: T): Promise<T> {
  const item = await db.misc.get(key);
  return item ? item.value : defaultValue;
}
