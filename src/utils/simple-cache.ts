export class SimpleCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private keys: K[];

  constructor (capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
    this.keys = [];
  }

  has (key: K): boolean {
    return this.cache.has(key);
  }

  get (key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    return this.cache.get(key);
  }

  set (key: K, value: V): void {
    // If key already exists, update its position
    if (this.cache.has(key)) {
      this.keys = this.keys.filter(k => k !== key);
    } 
    // If cache is full, remove the least recently used item
    else if (this.keys.length >= this.capacity) {
      const lruKey = this.keys.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }

    // Add the new key and value
    this.keys.push(key);
    this.cache.set(key, value);
  }

  delete (key: K): void {
    if (this.cache.has(key)) {
      this.keys = this.keys.filter(k => k !== key);
      this.cache.delete(key);
    }
  }

  clear (): void {
    this.cache.clear();
    this.keys = [];
  }

  get size (): number {
    return this.cache.size;
  }
}
