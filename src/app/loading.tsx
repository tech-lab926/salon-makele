import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-[1050px] px-4 pt-10 pb-20">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
          {/* Brand-colored premium spinner */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-[#fce4ec] opacity-75" />
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-[#c2185b]" />
          </div>
          
          <div className="flex flex-col items-center text-center">
            <h2 className="text-[20px] font-bold tracking-[0.06em] text-[#b84a6e] [font-family:'Hiragino_Mincho_ProN','Noto_Serif_JP',serif]">
              MAKELE
            </h2>
            <p className="mt-2 text-xs font-medium tracking-[0.04em] text-gray-400">
              読み込み中...
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
