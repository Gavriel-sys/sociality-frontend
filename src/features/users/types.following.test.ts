import { describe, expect, it } from "vitest";
import { normalizeSearchUser, normalizeSearchUsersResponse } from "./types";

describe("search user following state", () => {
  it.each([true, false])("preserves explicit isFollowing: %s", (isFollowing) => {
    const response = { success: true, data: { users: [{ id: 42, username: "alex", isFollowing }] } };
    expect(normalizeSearchUsersResponse(response).users[0].isFollowing).toBe(isFollowing);
  });

  it("reads a relationship on the outer user envelope", () => {
    expect(normalizeSearchUser({ user: { id: 42, username: "alex" }, isFollowing: true }).isFollowing).toBe(true);
  });

  it("leaves unknown relationships unset", () => {
    expect(normalizeSearchUser({ id: 42, username: "alex" })).not.toHaveProperty("isFollowing");
  });
});
