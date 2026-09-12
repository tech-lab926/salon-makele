import sanitizeHtml from "sanitize-html";

const blogOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "h1",
    "h2",
    "h3",
    "img",
    "figure",
    "figcaption",
    "span",
    "div",
    "hr",
    "br",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    // class is restricted to specific content tags only.
    // A wildcard "*" allowance enables CSS-based data exfiltration / UI redressing
    // via crafted class names, so we enumerate only the tags that need it.
    p: ["class"],
    span: ["class"],
    div: ["class"],
    h1: ["class"],
    h2: ["class"],
    h3: ["class"],
    figure: ["class"],
    figcaption: ["class"],
    ul: ["class"],
    ol: ["class"],
    li: ["class"],
    blockquote: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeBlogHtml(html: string): string {
  try {
    return sanitizeHtml(html, blogOptions);
  } catch (err) {
    console.error("Sanitization failed:", err);
    return ""; // Secure fallback: do not return unsanitized raw HTML
  }
}
