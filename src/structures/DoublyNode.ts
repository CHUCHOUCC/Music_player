/** One link of a doubly linked list: it knows the node before and after it. */
export class DoublyNode<T> {
  public previous: DoublyNode<T> | null = null;
  public next: DoublyNode<T> | null = null;

  constructor(public readonly value: T) {}
}
