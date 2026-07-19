import { beforeEach, describe, expect, it } from "vitest";
import { getStoredAccessToken, setStoredAccessToken } from "../authToken";

describe("in-memory access token storage", () => {
  beforeEach(() => setStoredAccessToken(null));

  it("stores the token without browser persistence", () => {
    setStoredAccessToken("token-value");
    expect(getStoredAccessToken()).toBe("token-value");
  });

  it("clears the token during logout", () => {
    setStoredAccessToken("token-value");
    setStoredAccessToken(null);
    expect(getStoredAccessToken()).toBeNull();
  });
});
