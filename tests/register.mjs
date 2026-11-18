// Lets Node's built-in test runner load the app's source files directly:
// resolves the "@/..." alias to src/ and adds the missing ".js" extensions
// (Next.js resolves both automatically, plain Node does not).
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      const SRC = ${JSON.stringify(new URL("../src/", import.meta.url).href)};
      export async function resolve(specifier, context, next) {
        let spec = specifier.startsWith("@/") ? SRC + specifier.slice(2) : specifier;
        try {
          return await next(spec, context);
        } catch (err) {
          if ((spec.startsWith(".") || spec.startsWith("file:")) && !spec.endsWith(".js")) return next(spec + ".js", context);
          throw err;
        }
      }
    `),
  import.meta.url
);
