import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

// Register Noto Sans JP for Japanese character support in PDF
Font.register({
  family: "Noto Sans JP",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSansJP/NotoSansJP-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSansJP/NotoSansJP-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Noto Sans JP",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#c2185b",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#c2185b",
  },
  section: {
    marginBottom: 10,
  },
  label: {
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontWeight: "bold",
  },
  table: {
    display: "flex",
    width: "auto",
    marginTop: 20,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#eee",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 8,
  },
  tableHeader: {
    backgroundColor: "#fafafa",
    fontWeight: "bold",
  },
  tableCol: {
    flex: 1,
  },
  totalSection: {
    marginTop: 30,
    alignItems: "flex-end",
  },
  totalBox: {
    width: 200,
    padding: 10,
    backgroundColor: "#fce4ec",
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: "#c2185b",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#880e4f",
  },
});

interface InvoicePDFProps {
  invoice: {
    id: string;
    artistName: string;
    periodStart: string;
    periodEnd: string;
    listingFee: number;
    totalBookingFees: number;
    totalAmount: number;
    status: string;
  };
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>請求書 (INVOICE)</Text>
          <View>
            <Text>請求番号 (Invoice ID): #{invoice.id}</Text>
            <Text>発行日 (Date): {new Date().toLocaleDateString("ja-JP")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>宛先 (Bill To):</Text>
          <Text style={styles.value}>{invoice.artistName} 様</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>対象期間 (Billing Period):</Text>
          <Text style={styles.value}>
            {invoice.periodStart} 〜 {invoice.periodEnd}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol}>内容 (Description)</Text>
            <Text style={[styles.tableCol, { textAlign: "right" }]}>金額 (Amount)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>プラットフォーム掲載料 (Listing Fee)</Text>
            <Text style={[styles.tableCol, { textAlign: "right" }]}>
              ¥{invoice.listingFee.toLocaleString()}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>予約成約手数料 (Booking Fees)</Text>
            <Text style={[styles.tableCol, { textAlign: "right" }]}>
              ¥{invoice.totalBookingFees.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>請求合計金額 (Total Due)</Text>
            <Text style={styles.totalValue}>
              ¥{invoice.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 50 }}>
          <Text style={{ color: "#999", fontSize: 10, textAlign: "center" }}>
            ご利用いただきありがとうございます。
          </Text>
        </View>
      </Page>
    </Document>
  );
}
