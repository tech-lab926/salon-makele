export const SEED_CATEGORIES = [
  { name: "眉", slug: "eyebrow", sortOrder: 1, isActive: true },
  { name: "リップ", slug: "lip", sortOrder: 2, isActive: true },
  { name: "アイライン", slug: "eyeline", sortOrder: 3, isActive: true },
] as const;

export const SEED_TECHNIQUES = [
  { name: "毛並み（マイクロブレーディング）", categorySlug: "eyebrow", sortOrder: 1 },
  { name: "パウダー眉", categorySlug: "eyebrow", sortOrder: 2 },
  { name: "コンビネーション眉", categorySlug: "eyebrow", sortOrder: 3 },
  { name: "リップブラッシュ", categorySlug: "lip", sortOrder: 1 },
  { name: "フルリップカラー", categorySlug: "lip", sortOrder: 2 },
] as const;

export const SEED_AREAS = [
  { prefecture: "東京都", sortOrder: 1 },
  { prefecture: "大阪府", sortOrder: 2 },
  { prefecture: "神奈川県", sortOrder: 3 },
  { prefecture: "愛知県", sortOrder: 4 },
  { prefecture: "福岡県", sortOrder: 5 },
  { prefecture: "北海道", sortOrder: 6 },
  { prefecture: "京都府", sortOrder: 7 },
  { prefecture: "兵庫県", sortOrder: 8 },
  { prefecture: "埼玉県", sortOrder: 9 },
  { prefecture: "千葉県", sortOrder: 10 },
] as const;

/** Listing / subscription tiers — upserted in prisma seed by plan_code */
export const SEED_SUBSCRIPTION_PLANS = [
  {
    planCode: "free",
    name: "Free",
    monthlyFee: 0,
    feeRate: "0",
    maxCases: 10,
    isActive: true,
  },
  {
    planCode: "standard",
    name: "Standard",
    monthlyFee: 9800,
    feeRate: "0.05",
    maxCases: 50,
    isActive: true,
  },
  {
    planCode: "premium",
    name: "Premium",
    monthlyFee: 19800,
    feeRate: "0.1",
    maxCases: 999,
    isActive: true,
  },
] as const;

export const SEED_ADMIN_USER = {
  name: "管理者",
  email: "admin@makele.jp",
  password: "admin12345",
} as const;

export const SEED_SAMPLE_USER = {
  name: "山田 さくら",
  email: "user@makele.jp",
  password: "user12345",
} as const;

export const SEED_ARTIST = {
  areaPrefecture: "東京都",
  user: {
    name: "田中 ゆき",
    email: "artist@makele.jp",
    password: "artist12345",
  },
  profile: {
    displayName: "田中 ゆき",
    bio: "アートメイク歴5年以上。自然な眉毛デザインを得意とし、お一人おひとりの骨格や雰囲気に合わせた施術を心がけています。医療機関監修のもと、安全で美しいアートメイクをご提供します。",
    isPublished: true,
  },
  menus: [
    {
      categorySlug: "eyebrow",
      name: "ナチュラル眉 — 毛並み（マイクロブレーディング）",
      description:
        "自然な毛流れを再現するマイクロブレーディング技法による眉アートメイク。初回の方にもおすすめです。",
      price: 55000,
      durationMin: 120,
      isActive: true,
      sortOrder: 1,
    },
    {
      categorySlug: "lip",
      name: "リップブラッシュ",
      description:
        "唇に自然な血色感をプラスするリップアートメイク。すっぴんでも美しい唇を実現します。",
      price: 65000,
      durationMin: 90,
      isActive: true,
      sortOrder: 2,
    },
  ],
} as const;

export const SEED_BLOGS = [
  {
    title: "アートメイク後のダウンタイムの過ごし方",
    slug: "downtime-guide",
    excerpt: "アートメイクを受けた後の数日間は非常に重要です。正しいケア方法を知ることで、色持ちを良くし、トラブルを防ぐことができます。",
    thumbnailUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80",
    categorySlug: "eyebrow",
    body: `
      <h2>施術当日の注意点</h2>
      <p>施術直後は部位が非常にデリケートになっています。当日は以下のことに気をつけてください。</p>
      <ul>
        <li>患部を濡らさない（洗顔は目元以外を優しく）</li>
        <li>激しい運動やサウナを控える</li>
        <li>飲酒を控える</li>
      </ul>
      <h2>1週間のアフターケア</h2>
      <p>薄くワセリンを塗って保湿を保つことが、色持ちを良くする秘訣です。瘡蓋（かさぶた）ができても無理に剥がさないようにしましょう。</p>
    `,
  },
  {
    title: "失敗しない！リップアートメイクの色の選び方",
    slug: "lip-color-selection",
    excerpt: "自分の肌色（パーソナルカラー）に合ったリップカラーを選ぶことで、より自然で魅力的な印象を与えることができます。",
    thumbnailUrl: "https://images.unsplash.com/photo-1699282022178-293b6658b45d?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    categorySlug: "lip",
    body: `
      <h2>イエベ・ブルベ別のおすすめカラー</h2>
      <p>パーソナルカラー診断に基づいて色を選ぶと失敗が少なくなります。</p>
      <h3>イエローベース（イエベ）の方</h3>
      <p>コーラルピンク、オレンジレッド、サーモンピンクなど、暖かみのある色が馴染みます。</p>
      <h3>ブルーベース（ブルベ）の方</h3>
      <p>ローズピンク、チェリーレッド、プラムなど、青みを感じる色が透明感を引き立てます。</p>
    `,
  },
  {
    title: "アイラインアートメイクで朝のメイクを時短に",
    slug: "eyeliner-time-saving",
    excerpt: "毎朝のアイラインが面倒…そんな悩みはアートメイクで解決！自然なインライン効果で、目元の印象がぐっと明るくなります。",
    thumbnailUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
    categorySlug: "eyeline",
    body: `
      <h2>アイラインアートメイクとは</h2>
      <p>まつ毛の隙間を埋めるように色素を入れることで、自然にぱっちりとした目元を演出します。</p>
      <h2>こんな方におすすめ</h2>
      <ul>
        <li>毎朝のメイクに時間がかかる方</li>
        <li>アイラインがにじみやすい方</li>
        <li>すっぴんでも目力が欲しい方</li>
      </ul>
    `,
  },
] as const;
