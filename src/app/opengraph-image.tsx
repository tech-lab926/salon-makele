import { ImageResponse } from "next/og";

export const alt = "MAKELE（メイクル）— アートメイク症例・アーティスト検索";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fce4ec 0%, #ffffff 50%, #fce4ec 100%)",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#c2185b",
            letterSpacing: "-2px",
          }}
        >
          MAKELE
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#888",
            marginTop: 8,
          }}
        >
          メイクル
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#666",
            marginTop: 24,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          日本初、医療機関監修のアートメイク症例・アーティスト検索メディア
        </div>
      </div>
    ),
    { ...size },
  );
}
