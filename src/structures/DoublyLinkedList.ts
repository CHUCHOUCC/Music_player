import { DoublyNode } from "./DoublyNode";

/**
 * Hand-written doubly linked list (no arrays inside).
 * Nodes are never recreated when they move, so a reference to a node
 * (for example "the song that is playing") stays valid after any change.
 */
export class DoublyLinkedList<T> implements Iterable<DoublyNode<T>> {
  private head: DoublyNode<T> | null = null;
  private tail: DoublyNode<T> | null = null;
  private count = 0;

  get size(): number {
    return this.count;
  }

  get first(): DoublyNode<T> | null {
    return this.head;
  }

  get last(): DoublyNode<T> | null {
    return this.tail;
  }

  insertFirst(value: T): DoublyNode<T> {
    const node = new DoublyNode(value);
    this.linkAfter(null, node);
    return node;
  }

  insertLast(value: T): DoublyNode<T> {
    const node = new DoublyNode(value);
    this.linkAfter(this.tail, node);
    return node;
  }

  /** Inserts so that the new node ends up at `index` (0 = first, size = last). */
  insertAt(index: number, value: T): DoublyNode<T> {
    if (index < 0 || index > this.count) {
      throw new RangeError(`Invalid position ${index}`);
    }
    const node = new DoublyNode(value);
    this.linkAfter(index === 0 ? null : this.nodeAt(index - 1), node);
    return node;
  }

  nodeAt(index: number): DoublyNode<T> {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`Invalid position ${index}`);
    }
    // Walk from the nearest end: that is the advantage of a doubly linked list.
    let node: DoublyNode<T>;
    if (index < this.count / 2) {
      node = this.head as DoublyNode<T>;
      for (let i = 0; i < index; i++) node = node.next as DoublyNode<T>;
    } else {
      node = this.tail as DoublyNode<T>;
      for (let i = this.count - 1; i > index; i--) node = node.previous as DoublyNode<T>;
    }
    return node;
  }

  indexOf(target: DoublyNode<T>): number {
    let index = 0;
    for (const node of this) {
      if (node === target) return index;
      index++;
    }
    return -1;
  }

  find(predicate: (value: T) => boolean): DoublyNode<T> | null {
    for (const node of this) {
      if (predicate(node.value)) return node;
    }
    return null;
  }

  remove(node: DoublyNode<T>): void {
    this.unlink(node);
  }

  /**
   * Moves an existing node so it ends up at `index` of the final list.
   * The same node object is reused: only its links change.
   */
  move(node: DoublyNode<T>, index: number): void {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`Invalid position ${index}`);
    }
    if (this.indexOf(node) === index) return;
    this.unlink(node);
    this.linkAfter(index === 0 ? null : this.nodeAt(index - 1), node);
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  toArray(): T[] {
    const values: T[] = [];
    for (const node of this) values.push(node.value);
    return values;
  }

  *[Symbol.iterator](): Iterator<DoublyNode<T>> {
    let current = this.head;
    while (current !== null) {
      yield current;
      current = current.next;
    }
  }

  /** Links `node` right after `previous` (null means at the start). */
  private linkAfter(previous: DoublyNode<T> | null, node: DoublyNode<T>): void {
    const next = previous === null ? this.head : previous.next;
    node.previous = previous;
    node.next = next;
    if (previous === null) this.head = node;
    else previous.next = node;
    if (next === null) this.tail = node;
    else next.previous = node;
    this.count++;
  }

  private unlink(node: DoublyNode<T>): void {
    if (node.previous === null) this.head = node.next;
    else node.previous.next = node.next;
    if (node.next === null) this.tail = node.previous;
    else node.next.previous = node.previous;
    node.previous = null;
    node.next = null;
    this.count--;
  }
}
