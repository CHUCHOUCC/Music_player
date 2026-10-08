import { describe, expect, it } from "vitest";
import { DoublyLinkedList } from "../src/structures/DoublyLinkedList";

function build(...values: string[]): DoublyLinkedList<string> {
  const list = new DoublyLinkedList<string>();
  for (const value of values) list.insertLast(value);
  return list;
}

/** Walks the list forwards and backwards to prove both links are consistent. */
function backwards(list: DoublyLinkedList<string>): string[] {
  const values: string[] = [];
  for (let node = list.last; node !== null; node = node.previous) values.push(node.value);
  return values.reverse();
}

describe("DoublyLinkedList", () => {
  it("inserts at the start, at the end and at any position", () => {
    const list = build("b", "d");
    list.insertFirst("a");
    list.insertLast("e");
    list.insertAt(2, "c");
    expect(list.toArray()).toEqual(["a", "b", "c", "d", "e"]);
    expect(backwards(list)).toEqual(["a", "b", "c", "d", "e"]);
    expect(list.size).toBe(5);
  });

  it("rejects invalid positions", () => {
    const list = build("a");
    expect(() => list.insertAt(5, "x")).toThrow(RangeError);
    expect(() => list.nodeAt(1)).toThrow(RangeError);
  });

  it("removes from the start, middle and end", () => {
    const list = build("a", "b", "c", "d");
    list.remove(list.nodeAt(0));
    list.remove(list.nodeAt(1));
    list.remove(list.nodeAt(1));
    expect(list.toArray()).toEqual(["b"]);
    expect(backwards(list)).toEqual(["b"]);
    list.remove(list.nodeAt(0));
    expect(list.size).toBe(0);
    expect(list.first).toBeNull();
    expect(list.last).toBeNull();
  });

  it("moves a node keeping the same node object", () => {
    const list = build("a", "b", "c", "d");
    const b = list.nodeAt(1);
    list.move(b, 0);
    expect(list.toArray()).toEqual(["b", "a", "c", "d"]);
    expect(backwards(list)).toEqual(["b", "a", "c", "d"]);
    expect(list.nodeAt(0)).toBe(b);
    list.move(b, 3);
    expect(list.toArray()).toEqual(["a", "c", "d", "b"]);
    expect(backwards(list)).toEqual(["a", "c", "d", "b"]);
    list.move(b, 3);
    expect(list.toArray()).toEqual(["a", "c", "d", "b"]);
  });

  it("finds nodes and their index", () => {
    const list = build("a", "b", "c");
    const node = list.find((value) => value === "c");
    expect(node).not.toBeNull();
    expect(list.indexOf(node!)).toBe(2);
    expect(list.find((value) => value === "z")).toBeNull();
  });
});
