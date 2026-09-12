import Link from "next/link";
import Image from "next/image";

/** Reserve scroll space above fixed homepage promo bar. Bar shows from `lg` (1024px), so extra footer padding matches that breakpoint. */
const padBottomForPromoClasses = "lg:pb-[7.5rem] xl:pb-28";

export default function Footer({
  padBottomForFixedPromo = false,
}: {
  padBottomForFixedPromo?: boolean;
} = {}) {
  return (
    <footer
      className={`border-t border-gray-100 bg-gray-50${padBottomForFixedPromo ? ` ${padBottomForPromoClasses}` : ""}`}
    >
      <div className="mx-auto w-full max-w-[calc(1000px+4rem)] pt-12 pb-[max(3rem,calc(2.25rem+env(safe-area-inset-bottom,0px)))] ps-[max(2rem,env(safe-area-inset-left,0px))] pe-[max(2rem,env(safe-area-inset-right,0px))] sm:ps-[max(1.75rem,env(safe-area-inset-left,0px))] sm:pe-[max(1.75rem,env(safe-area-inset-right,0px))] lg:pb-12 lg:ps-[max(2rem,env(safe-area-inset-left,0px))] lg:pe-[max(2rem,env(safe-area-inset-right,0px))]">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 md:items-start md:gap-8">
          <div>
            <h3 className="m-0 text-sm font-semibold leading-none text-gray-900">
              <span className="sr-only">MAKELE（メイクル）</span>
              <Image
                src="/makele_logo.png"
                className="-translate-y-2.5 block h-11 w-auto max-w-[10rem] object-contain object-left object-top md:-translate-y-3"
                alt=""
                width={110}
                height={44}
                aria-hidden
              />
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              日本初、医療機関監修のアートメイク症例・アーティスト検索メディア。
              信頼できるアーティストを症例写真から探せます。
            </p>
          </div>

          <div>
            <h3 className="m-0 text-sm font-bold leading-none text-gray-900 md:font-semibold">
              メニュー
            </h3>
            <ul className="mt-1.5 space-y-2 ps-4 md:mt-3">
              <li>
                <Link
                  href="/cases"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  症例一覧
                </Link>
              </li>
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  アーティスト一覧
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  ブログ
                </Link>
              </li>
              <li>
                <Link
                  href="/mypage"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  マイページ
                </Link>
              </li>
              <li>
                <Link
                  href="/bookings"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  予約一覧
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="m-0 text-sm font-bold leading-none text-gray-900 md:font-semibold">
              カテゴリ
            </h3>
            <ul className="mt-1.5 space-y-2 ps-4 md:mt-3">
              <li>
                <Link
                  href="/cases?category=eyebrow"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  眉
                </Link>
              </li>
              <li>
                <Link
                  href="/cases?category=lip"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  リップ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="m-0 text-sm font-bold leading-none text-gray-900 md:font-semibold">
              アーティストの方へ
            </h3>
            <ul className="mt-1.5 space-y-2 ps-4 md:mt-3">
              <li>
                <Link
                  href="/register/artist"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  アーティスト登録
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-[#c2185b]"
                >
                  ログイン
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} MAKELE（メイクル）All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
