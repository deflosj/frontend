import nextVitals from "eslint-config-next";

export default [
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];