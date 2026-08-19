import {
  isUserAllowedForTool,
  isToolVisibleWithoutAccess,
  isToolVisibleForUser,
} from "./toolAccess";

describe("toolAccess", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isUserAllowedForTool", () => {
    it("allows admin users unconditionally", () => {
      expect(isUserAllowedForTool("finance-tracker", null, "admin")).toBe(true);
      expect(isUserAllowedForTool("finance-tracker", "anyone@test.com", "admin")).toBe(true);
    });

    it("denies access if email is missing or empty", () => {
      expect(isUserAllowedForTool("finance-tracker", null, "user")).toBe(false);
      expect(isUserAllowedForTool("finance-tracker", "", "user")).toBe(false);
    });

    it("denies access if ALLOWED_USERS is not set", () => {
      delete process.env.TEST_TOOL_ALLOWED_USERS;
      expect(isUserAllowedForTool("test-tool", "user@test.com", "user")).toBe(false);
    });

    it("allows user if email is in ALLOWED_USERS whitelist", () => {
      process.env.TEST_TOOL_ALLOWED_USERS = "user1@test.com, user2@test.com";
      expect(isUserAllowedForTool("test-tool", "user1@test.com", "user")).toBe(true);
      expect(isUserAllowedForTool("test-tool", "USER2@TEST.COM", "user")).toBe(true);
      expect(isUserAllowedForTool("test-tool", "user3@test.com", "user")).toBe(false);
    });
  });

  describe("isToolVisibleWithoutAccess", () => {
    it("returns false by default when env var is not set", () => {
      delete process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS;
      expect(isToolVisibleWithoutAccess("test-tool")).toBe(false);
    });

    it("returns false when set to false or 0", () => {
      process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS = "false";
      expect(isToolVisibleWithoutAccess("test-tool")).toBe(false);

      process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS = "0";
      expect(isToolVisibleWithoutAccess("test-tool")).toBe(false);
    });

    it("returns true when set to true, 1, or yes", () => {
      process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS = "true";
      expect(isToolVisibleWithoutAccess("test-tool")).toBe(true);

      process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS = "1";
      expect(isToolVisibleWithoutAccess("test-tool")).toBe(true);

      process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS = "yes";
      expect(isToolVisibleWithoutAccess("test-tool")).toBe(true);
    });
  });

  describe("isToolVisibleForUser", () => {
    it("shows tool to admin users regardless of visibility env var", () => {
      delete process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS;
      expect(isToolVisibleForUser("test-tool", "admin@test.com", "admin")).toBe(true);
    });

    it("shows tool if dashboard unlocked via auth_dashboard cookie", () => {
      delete process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS;
      const cookies = {
        get: (name: string) => (name === "auth_dashboard" ? { value: "true" } : undefined),
      };
      expect(isToolVisibleForUser("test-tool", "user@test.com", "user", cookies)).toBe(true);
    });

    it("shows tool if tool unlocked via auth_tool_<toolId> cookie", () => {
      delete process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS;
      const cookies = {
        get: (name: string) => (name === "auth_tool_test-tool" ? { value: "true" } : undefined),
      };
      expect(isToolVisibleForUser("test-tool", "user@test.com", "user", cookies)).toBe(true);
    });

    it("shows tool if user is whitelisted in ALLOWED_USERS", () => {
      delete process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS;
      process.env.TEST_TOOL_ALLOWED_USERS = "allowed@test.com";
      expect(isToolVisibleForUser("test-tool", "allowed@test.com", "user")).toBe(true);
    });

    it("HIDES tool from users without access if VISIBLE_WITHOUT_ACCESS is false/unset", () => {
      delete process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS;
      process.env.TEST_TOOL_ALLOWED_USERS = "allowed@test.com";
      expect(isToolVisibleForUser("test-tool", "blocked@test.com", "user")).toBe(false);
    });

    it("SHOWS tool to users without access if VISIBLE_WITHOUT_ACCESS is true", () => {
      process.env.TEST_TOOL_VISIBLE_WITHOUT_ACCESS = "true";
      process.env.TEST_TOOL_ALLOWED_USERS = "allowed@test.com";
      expect(isToolVisibleForUser("test-tool", "blocked@test.com", "user")).toBe(true);
    });
  });
});
