import { ImageResponse } from "next/og";

// 默认 OG 分享卡片（1200×630）：全站兜底。
// 有自定义 openGraph.images 的页面（词条页）会覆盖它；
// 每风格独立的动态分享卡图是 P3-2 的活，这里只做品牌兜底。
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 12,
            color: "#a3a3a3",
            textTransform: "uppercase",
          }}
        >
          Style Atlas
        </div>
        <div style={{ fontSize: 120, fontWeight: 900, marginTop: 24 }}>
          风格图谱
        </div>
        <div style={{ fontSize: 36, color: "#d4d4d4", marginTop: 32 }}>
          111 种视觉风格 · 真实案例 · 可复制提示词
        </div>
      </div>
    ),
    { ...size }
  );
}
