/**
 * PACAME — Server-rendered JSON-LD wrapper.
 *
 * Usage in any server component (page, layout):
 *   <JsonLd data={buildOrganizationSchema()} />
 *   <JsonLd data={[buildOrganizationSchema(), buildWebsiteSchema()]} />
 */

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

export default function JsonLd({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
