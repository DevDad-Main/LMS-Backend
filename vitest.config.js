export default {
  test: {
    setupFiles: ["./tests/setup/vitest.env.js", "./tests/setup/mongodb.js"],
    globals: true,
  },
};
