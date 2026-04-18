/* eslint-disable react/no-unescaped-entities */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

/**
 * Componente @react-pdf/renderer para la auditoria SEO.
 * Colores PACAME: negro #0A0A0A, gold #D4A574, blanco.
 */

// Tipos del analisis (deben casar con lo que devuelve el LLM)
export type Severity = "high" | "medium" | "low";

export interface SEOFinding {
  severity: Severity;
  title: string;
  description: string;
  action: string;
}

export interface KeywordOpportunity {
  keyword: string;
  opportunity: string;
  difficulty: string;
}

export interface ActionItem {
  priority: string;
  task: string;
  impact: string;
  effort: string;
}

export interface OnPageData {
  title?: string;
  meta_description?: string;
  h1_count?: number;
  h2_count?: number;
  img_count?: number;
  img_without_alt?: number;
  internal_links?: number;
  external_links?: number;
  canonical?: string | null;
  og_image?: string | null;
  schema_found?: boolean;
}

export interface SEOReportData {
  website_url: string;
  generated_at: string;
  overall_score: number;
  main_keywords: string[];
  competitors: string[];
  target_location?: string;
  on_page: OnPageData;
  technical_findings: SEOFinding[];
  on_page_findings: SEOFinding[];
  keyword_opportunities: KeywordOpportunity[];
  competitive_insights: string[];
  action_plan: ActionItem[];
  executive_summary: string[];
}

const COLOR_BLACK = "#0A0A0A";
const COLOR_GOLD = "#D4A574";
const COLOR_GRAY = "#666666";
const COLOR_LIGHT = "#F5F5F5";
const COLOR_WHITE = "#FFFFFF";
const COLOR_RED = "#C44";
const COLOR_ORANGE = "#E90";
const COLOR_GREEN = "#2A8";

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLOR_WHITE,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLOR_BLACK,
  },
  // Portada
  coverPage: {
    backgroundColor: COLOR_BLACK,
    padding: 0,
    color: COLOR_WHITE,
    fontFamily: "Helvetica",
  },
  coverInner: {
    padding: 60,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverBrand: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: COLOR_GOLD,
    letterSpacing: 4,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: COLOR_WHITE,
    marginTop: 20,
  },
  coverSubtitle: {
    fontSize: 14,
    color: COLOR_GOLD,
    marginTop: 12,
  },
  coverScoreBox: {
    alignItems: "center",
    marginVertical: 40,
    padding: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLOR_GOLD,
    alignSelf: "center",
    width: 220,
  },
  coverScoreLabel: {
    fontSize: 12,
    color: COLOR_GOLD,
    letterSpacing: 2,
  },
  coverScoreValue: {
    fontSize: 72,
    fontFamily: "Helvetica-Bold",
    color: COLOR_WHITE,
    marginTop: 6,
  },
  coverFooter: {
    fontSize: 10,
    color: COLOR_GRAY,
  },

  // Secciones
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLOR_GOLD,
    paddingBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLOR_GRAY,
    marginBottom: 14,
  },

  // Listas
  bullet: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLOR_GOLD,
    marginTop: 4,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },

  // Findings
  finding: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: COLOR_LIGHT,
    borderLeftWidth: 3,
  },
  findingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  findingSeverity: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR_WHITE,
    marginRight: 8,
  },
  findingTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  findingDesc: {
    fontSize: 9,
    color: COLOR_GRAY,
    marginTop: 2,
    lineHeight: 1.4,
  },
  findingAction: {
    fontSize: 9,
    color: COLOR_BLACK,
    marginTop: 4,
    fontFamily: "Helvetica-Oblique",
  },

  // Tablas
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLOR_LIGHT,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOR_LIGHT,
  },
  tableHeader: {
    backgroundColor: COLOR_BLACK,
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR_WHITE,
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    color: COLOR_BLACK,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLOR_GRAY,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLOR_LIGHT,
    paddingTop: 6,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: COLOR_GRAY,
  },
});

function severityColor(s: Severity): string {
  if (s === "high") return COLOR_RED;
  if (s === "medium") return COLOR_ORANGE;
  return COLOR_GREEN;
}

function severityLabel(s: Severity): string {
  if (s === "high") return "ALTA";
  if (s === "medium") return "MEDIA";
  return "BAJA";
}

// Footer reutilizable
const PageFooter = () => (
  <Text
    style={styles.footer}
    render={({ pageNumber, totalPages }) =>
      `PACAME — pacameagencia.com   •   pagina ${pageNumber} / ${totalPages}`
    }
    fixed
  />
);

export const SEOReport: React.FC<{ data: SEOReportData }> = ({ data }) => {
  return (
    <Document title={`Auditoria SEO — ${data.website_url}`} author="PACAME">
      {/* Portada */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverInner}>
          <View>
            <Text style={styles.coverBrand}>PACAME</Text>
            <Text style={styles.coverTitle}>Auditoria SEO</Text>
            <Text style={styles.coverSubtitle}>{data.website_url}</Text>
            <Text style={{ fontSize: 10, color: COLOR_GRAY, marginTop: 6 }}>
              Generado el {data.generated_at}
            </Text>
          </View>

          <View style={styles.coverScoreBox}>
            <Text style={styles.coverScoreLabel}>SCORE GLOBAL</Text>
            <Text style={styles.coverScoreValue}>
              {Math.round(data.overall_score)}
            </Text>
            <Text style={{ fontSize: 10, color: COLOR_WHITE, marginTop: 4 }}>
              / 100
            </Text>
          </View>

          <View>
            <Text style={styles.coverFooter}>
              Informe elaborado por Atlas — agente SEO de PACAME.
            </Text>
            <Text style={styles.coverFooter}>
              hola@pacameagencia.com   •   pacameagencia.com
            </Text>
          </View>
        </View>
      </Page>

      {/* Resumen ejecutivo + Tecnico */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>1. Resumen ejecutivo</Text>
        <Text style={styles.sectionSubtitle}>
          Los 3 hallazgos con mas impacto potencial en tu visibilidad organica.
        </Text>
        {(data.executive_summary || []).slice(0, 5).map((b, i) => (
          <View key={`exec-${i}`} style={styles.bullet}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}

        <View style={{ height: 18 }} />

        <Text style={styles.sectionTitle}>2. Analisis tecnico</Text>
        <Text style={styles.sectionSubtitle}>
          Problemas de crawl, velocidad, indexacion y estructura.
        </Text>
        {(data.technical_findings || []).length === 0 && (
          <Text style={{ fontSize: 10, color: COLOR_GRAY }}>
            Sin hallazgos tecnicos criticos detectados.
          </Text>
        )}
        {(data.technical_findings || []).map((f, i) => (
          <View
            key={`tech-${i}`}
            style={[styles.finding, { borderLeftColor: severityColor(f.severity) }]}
          >
            <View style={styles.findingTitleRow}>
              <Text
                style={[
                  styles.findingSeverity,
                  { backgroundColor: severityColor(f.severity) },
                ]}
              >
                {severityLabel(f.severity)}
              </Text>
              <Text style={styles.findingTitle}>{f.title}</Text>
            </View>
            <Text style={styles.findingDesc}>{f.description}</Text>
            <Text style={styles.findingAction}>→ {f.action}</Text>
          </View>
        ))}

        <PageFooter />
      </Page>

      {/* On-page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>3. Analisis on-page</Text>
        <Text style={styles.sectionSubtitle}>
          Estado de los elementos on-page detectados en la home.
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Elemento</Text>
            <Text style={[styles.tableHeaderCell, { width: "60%" }]}>Valor</Text>
          </View>
          {[
            ["Title", data.on_page.title || "(no detectado)"],
            [
              "Meta description",
              data.on_page.meta_description || "(no detectada)",
            ],
            ["H1 en pagina", String(data.on_page.h1_count ?? "?")],
            ["H2 en pagina", String(data.on_page.h2_count ?? "?")],
            ["Imagenes sin alt", String(data.on_page.img_without_alt ?? "?")],
            ["Enlaces internos", String(data.on_page.internal_links ?? "?")],
            ["Enlaces externos", String(data.on_page.external_links ?? "?")],
            ["Canonical", data.on_page.canonical || "(no)"],
            ["OG image", data.on_page.og_image || "(no)"],
            [
              "Schema.org JSON-LD",
              data.on_page.schema_found ? "Detectado" : "No detectado",
            ],
          ].map((row, i) => (
            <View
              key={`op-${i}`}
              style={[
                styles.tableRow,
                { backgroundColor: i % 2 === 0 ? COLOR_WHITE : COLOR_LIGHT },
              ]}
            >
              <Text style={[styles.tableCell, { width: "40%", fontFamily: "Helvetica-Bold" }]}>
                {row[0]}
              </Text>
              <Text style={[styles.tableCell, { width: "60%" }]}>{row[1]}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />

        {(data.on_page_findings || []).map((f, i) => (
          <View
            key={`onp-f-${i}`}
            style={[styles.finding, { borderLeftColor: severityColor(f.severity) }]}
          >
            <View style={styles.findingTitleRow}>
              <Text
                style={[
                  styles.findingSeverity,
                  { backgroundColor: severityColor(f.severity) },
                ]}
              >
                {severityLabel(f.severity)}
              </Text>
              <Text style={styles.findingTitle}>{f.title}</Text>
            </View>
            <Text style={styles.findingDesc}>{f.description}</Text>
            <Text style={styles.findingAction}>→ {f.action}</Text>
          </View>
        ))}

        <PageFooter />
      </Page>

      {/* Keywords */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>4. Oportunidades de palabras clave</Text>
        <Text style={styles.sectionSubtitle}>
          Keywords objetivo: {data.main_keywords.join(", ") || "(no especificadas)"}
          {data.target_location ? `   •   Ubicacion: ${data.target_location}` : ""}
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Keyword</Text>
            <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Oportunidad</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Dificultad</Text>
          </View>
          {(data.keyword_opportunities || []).map((k, i) => (
            <View
              key={`kw-${i}`}
              style={[
                styles.tableRow,
                { backgroundColor: i % 2 === 0 ? COLOR_WHITE : COLOR_LIGHT },
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { width: "30%", fontFamily: "Helvetica-Bold" },
                ]}
              >
                {k.keyword}
              </Text>
              <Text style={[styles.tableCell, { width: "50%" }]}>{k.opportunity}</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>{k.difficulty}</Text>
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>

      {/* Competencia */}
      {data.competitive_insights && data.competitive_insights.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>5. Analisis competitivo</Text>
          <Text style={styles.sectionSubtitle}>
            Competidores analizados: {data.competitors.join(", ") || "(no especificados)"}
          </Text>
          {data.competitive_insights.map((c, i) => (
            <View key={`comp-${i}`} style={styles.bullet}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
          <PageFooter />
        </Page>
      )}

      {/* Plan de accion */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>
          {data.competitive_insights && data.competitive_insights.length > 0
            ? "6. Plan de accion priorizado"
            : "5. Plan de accion priorizado"}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Ordenado por impacto / esfuerzo. Empieza por la fila 1 y avanza en orden.
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: "12%" }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: "48%" }]}>Tarea</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Impacto</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Esfuerzo</Text>
          </View>
          {(data.action_plan || []).map((a, i) => (
            <View
              key={`ap-${i}`}
              style={[
                styles.tableRow,
                { backgroundColor: i % 2 === 0 ? COLOR_WHITE : COLOR_LIGHT },
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { width: "12%", fontFamily: "Helvetica-Bold" },
                ]}
              >
                {a.priority}
              </Text>
              <Text style={[styles.tableCell, { width: "48%" }]}>{a.task}</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>{a.impact}</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>{a.effort}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />

        <Text
          style={{
            fontSize: 10,
            color: COLOR_GRAY,
            fontFamily: "Helvetica-Oblique",
            marginTop: 12,
          }}
        >
          Este informe ha sido elaborado por Atlas (agente SEO de PACAME) con datos
          extraidos en tiempo real de la URL auditada. Para profundizar o
          implementar el plan, contacta con tu equipo PACAME.
        </Text>

        <PageFooter />
      </Page>
    </Document>
  );
};

// Evita warning de Font si no se usan fonts custom
void Font;

export default SEOReport;
