interface JsonLdScriptProps {
  data: Record<string, unknown>;
}

/**
 * Renders one JSON-LD block. `<` is escaped so a value containing
 * `</script>` can never close the tag early and inject markup.
 */
export default function JsonLdScript({ data }: JsonLdScriptProps) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
