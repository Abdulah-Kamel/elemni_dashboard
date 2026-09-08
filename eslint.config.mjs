import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const physicalDirectionBan = {
  name: "ban-physical-direction-utilities",
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban physical-direction Tailwind utilities (Article IV — RTL is enforced by tooling, not review)",
    },
    schema: [],
    messages: {
      physicalDir:
        "'{{class}}' is a physical-direction utility. Use the logical equivalent (Article IV — RTL default).",
    },
  },
  defaultOptions: [],
  create(context) {
    const physicalPatterns = [
      "\\bml-",
      "\\bmr-",
      "\\bpl-",
      "\\bpr-",
      "\\bleft-",
      "\\bright-",
      "\\btext-left\\b",
      "\\btext-right\\b",
      "\\bborder-l\\b",
      "\\bborder-l-",
      "\\bborder-r\\b",
      "\\bborder-r-",
      "\\bleft-\\[",
      "\\bright-\\[",
    ];
    const regex = new RegExp(`(${physicalPatterns.join("|")})`);

    return {
      JSXAttribute(node) {
        if (node.name.name !== "className") return;
        if (node.value?.type !== "Literal" && node.value?.type !== "JSXExpressionContainer") return;

        let classStr = "";
        if (node.value.type === "Literal") {
          classStr = String(node.value.value);
        } else if (
          node.value.type === "JSXExpressionContainer" &&
          node.value.expression.type === "Literal"
        ) {
          classStr = String(node.value.expression.value);
        }

        if (!classStr) return;
        for (const cls of classStr.split(/\s+/)) {
          if (regex.test(cls)) {
            context.report({
              node,
              messageId: "physicalDir",
              data: { class: cls },
            });
          }
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "rtldir-ban": {
        rules: {
          "ban-physical-direction": physicalDirectionBan,
        },
      },
    },
    rules: {
      "rtldir-ban/ban-physical-direction": "error",
    },
  },
  globalIgnores([
    ".next/**",
    ".agent/**",
    ".worktrees/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
