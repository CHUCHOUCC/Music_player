import { describe, expect, it } from "vitest";
import { formatTime } from "../src/ui/formatTime";

describe("formatTime", () => {
  it("shows minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(9.9)).toBe("0:09");
    expect(formatTime(75)).toBe("1:15");
  });

  it("shows hours when the song is longer than one hour", () => {
    expect(formatTime(3725)).toBe("1:02:05");
  });

  it("shows --:-- for unknown or infinite lengths", () => {
    expect(formatTime(Number.NaN)).toBe("--:--");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("--:--");
    expect(formatTime(-1)).toBe("--:--");
  });
});
