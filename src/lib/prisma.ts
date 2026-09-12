import type { PrismaClient } from "@prisma/client";
import { shouldUseMockPrismaServer } from "@/lib/runtime-flags";
import { SEED_AREAS, SEED_CATEGORIES, SEED_TECHNIQUES } from "@/lib/seed-data";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Robustly serializes any object containing BigInts into a plain object with strings.
 * This prevents Next.js serialization crashes in production (Vercel).
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  // Use JSON stringify/parse to ensure absolute serializability for Next.js
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      return value;
    })
  );
}

const techniqueByCategorySlug: Record<string, any[]> = SEED_TECHNIQUES.reduce((acc: any, tech: any) => {
  if (!acc[tech.categorySlug]) acc[tech.categorySlug] = [];
  acc[tech.categorySlug].push({ id: BigInt(Object.keys(acc).length * 10 + acc[tech.categorySlug].length + 1), ...tech });
  return acc;
}, {} as any);

const dummyCategories = [
  ...SEED_CATEGORIES.map((category, index) => ({
    id: BigInt(index + 1),
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    techniques: techniqueByCategorySlug[category.slug] || [],
    _count: { cases: 10 - index * 3, artistSkills: 8 - index * 2 },
  })),
  {
    id: BigInt(3),
    name: "アイライン",
    slug: "eyeliner",
    sortOrder: 3,
    isActive: true,
    techniques: [],
    _count: { cases: 2, artistSkills: 2 },
  },
];

const dummyUsers = [
  { id: BigInt(1), clerkId: "mock-admin", role: "ADMIN", email: "admin@example.com", name: "管理者", image: null, _count: { bookings: 0 }, createdAt: new Date() },
  { id: BigInt(2), clerkId: "mock-artist", role: "ARTIST", email: "artist@example.com", name: "デモ・アーティスト", image: null, _count: { bookings: 12 }, createdAt: new Date() },
  { id: BigInt(3), clerkId: "mock-user", role: "USER", email: "user@example.com", name: "テスト一般ユーザー", image: null, _count: { bookings: 5 }, createdAt: new Date() }
];

const dummyAreas = SEED_AREAS.map((area, index) => ({
  id: BigInt(index + 1),
  prefecture: area.prefecture,
  slug: `area-${index + 1}`,
  areaType: index === 0 ? "KANTO" : index === 1 ? "KANSAI" : "OTHER",
  sortOrder: area.sortOrder,
  _count: { artists: Math.max(1, 6 - index) },
}));

const dummyArtistsData = [
  { name: "田中 美咲", areaIdx: 0, imgPath: "/demo/artists/artist_7.png" },
  { name: "佐藤 結衣", areaIdx: 1, imgPath: "/demo/artists/artist_6.png" },
  { name: "鈴木 陽子", areaIdx: 0, imgPath: "/demo/artists/artist_3.png" },
  { name: "高橋 舞", areaIdx: 1, imgPath: "/demo/artists/artist_8.png" },
  { name: "伊藤 瑞希", areaIdx: 0, imgPath: "/demo/artists/artist_5.png" },
  { name: "渡辺 彩花", areaIdx: 1, imgPath: "/demo/artists/artist_2.png" },
  { name: "中村 里帆", areaIdx: 0, imgPath: "/demo/artists/artist_9.png" },
  { name: "小林 優奈", areaIdx: 1, imgPath: "/demo/artists/artist_4.png" },
  { name: "加藤 杏奈", areaIdx: 0, imgPath: "/demo/artists/artist_1.png" },
  { name: "吉田 栞", areaIdx: 1, imgPath: "/demo/artists/artist_10.png" }
];

const casePairs = [
  { img: "case1", title: "Natural Eyebrow Design", categoryId: 1 },
  { img: "case2", title: "Powder Brow Case", categoryId: 1 },
  { img: "case3", title: "Eyebrow Microblading (Women)", categoryId: 1 },
  { img: "case4", title: "Men's Eyebrow Design", categoryId: 1 },
  { img: "case5", title: "Lip Tint Style", categoryId: 2 },
  { img: "case6", title: "Full Lip Case", categoryId: 2 },
  { img: "case7", title: "Upper Eyeliner (Very Thin)", categoryId: 3 },
  { img: "case8", title: "Hairline Correction", categoryId: 2 }, // Using Lip for Hairline temporarily
  { img: "case9", title: "Eyebrow Retouch", categoryId: 1 },
  { img: "case10", title: "4D Eyebrow Design", categoryId: 1 },
  { img: "case11", title: "Lip Art (Pink Tones)", categoryId: 2 },
  { img: "case12", title: "Parallel Eyebrow Design", categoryId: 1 }
];

const dummyCases = casePairs.map((pair, i) => ({
  id: BigInt(i + 1),
  artistId: BigInt((i % 10) + 1),
  categoryId: BigInt(pair.categoryId),
  title: pair.title,
  description: "自然な仕上がりになりました。お客様のご要望に合わせて黄金比で調整しました。",
  isPublished: true,
  deletedAt: null,
  beforeImgUrl: i < 12
    ? `/demo/cases/${pair.img}_before.png` 
    : `https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80`,
  afterImgUrl: i < 12
    ? `/demo/cases/${pair.img}_after.png` 
    : `https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80`,
  category: { ...dummyCategories[pair.categoryId - 1], techniques: [] }, // Break category->techniques loop
  artist: {
    id: BigInt((i % 10) + 1),
    displayName: dummyArtistsData[i % 10].name,
    profileImgUrl: dummyArtistsData[i % 10].imgPath,
    isPublished: true,
    deletedAt: null,
    areaId: BigInt(dummyArtistsData[i % 10].areaIdx + 1),
    area: dummyAreas[dummyArtistsData[i % 10].areaIdx],
    skills: [], // Break artist->skills->artist loop
  },
  technique: { id: BigInt(1), name: "3Dグラデーション" },
  createdAt: new Date(Date.now() - i * 3600000),
  updatedAt: new Date(Date.now() - i * 3600000),
  rankingScore: (i % 2 === 0) ? 50 + i : 100 - i,
  viewCount: (i + 1) * 10,
}));

const dummyArtists = dummyArtistsData.map((data, i) => ({
  id: BigInt(i + 1),
  userId: i === 0 ? BigInt(2) : BigInt(i + 10),
  clerkId: `clerk-${i + 1}`,
  displayName: data.name,
  realName: `山田 花子 ${i + 1}`,
  profileImgUrl: data.imgPath,
  bio: "アートメイク歴5年。お客様一人一人の骨格に合わせた黄金比デザインをご提案します。ナチュラルな仕上がりが得意です。",
  areaId: BigInt(data.areaIdx + 1),
  area: dummyAreas[data.areaIdx],
  isPublished: true,
  createdAt: new Date(Date.now() - i * 86400000),
  updatedAt: new Date(),
  deletedAt: null,
  rankingScore: 50 + (i % 3) * 10,
  viewCount: (i + 5) * 20,
  user: { email: `artist${i+1}@dummy.com` },
  skills: [
    { categoryId: dummyCategories[0].id, category: { ...dummyCategories[0], techniques: [] } },
    { categoryId: dummyCategories[1].id, category: { ...dummyCategories[1], techniques: [] } },
  ],
  _count: { cases: 5, menus: 2, bookings: 12, skills: 2 },
  cases: [], // Break artist->cases->artist loop
  menus: Array.from({ length: 2 }).map((_, mi) => ({
    id: BigInt(i * 10 + mi + 1),
    artistId: BigInt(i + 1),
    categoryId: BigInt(1),
    category: { ...dummyCategories[0], techniques: [] },
    name: `パウダーブロウ ${mi + 1}回コース`,
    description: "一番人気のメニューです。持続性が高く、メイクの手間が省けます。",
    price: 50000 + (mi * 5000),
    durationMin: 120,
    isActive: true,
  })),
}));

const dummyBookings = Array.from({ length: 4 }).map((_, i) => ({
  id: BigInt(i + 1),
  userId: BigInt(3), 
  user: dummyUsers[2],
  artistId: BigInt(1),
  menuId: BigInt(1),
  status: i === 0 ? "CONFIRMED" : (i === 1 ? "PENDING" : (i === 2 ? "COMPLETED" : "CANCELLED")),
  artist: dummyArtists[0],
  menu: dummyArtists[0].menus[0],
  availability: {
    date: new Date(Date.now() + 86400000 * (i + 1)),
    startTime: new Date(new Date().setHours(10 + i, 0, 0, 0)),
    endTime: new Date(new Date().setHours(12 + i, 0, 0, 0)),
  },
  createdAt: new Date(Date.now() - 86400000),
}));

const dummyNotifications = [
  // For Artist (userId 2)
  { id: BigInt(1), userId: BigInt(2), type: "BOOKING_REQUEST", title: "新規予約リクエスト", body: "新しい予約リクエストが入りました。内容を確認してください。", isRead: false, createdAt: new Date(Date.now() - 3600000) },
  { id: BigInt(2), userId: BigInt(2), type: "SYSTEM", title: "プロフィール公開完了", body: "アーティストプロフィールの公認審査が完了し、公開されました。", isRead: true, createdAt: new Date(Date.now() - 86400000) },
  { id: BigInt(3), userId: BigInt(2), type: "REMINDER", title: "明日のスケジュール", body: "明日 10:00 から予約が入っています。", isRead: false, createdAt: new Date(Date.now() - 7200000) },
  // For Admin (userId 1)
  { id: BigInt(4), userId: BigInt(1), type: "NEW_ARTIST", title: "新規アーティスト登録", body: "新しいアーティストが登録されました。審査を行ってください。", isRead: false, createdAt: new Date(Date.now() - 1800000) },
  // For User (userId 3)
  { id: BigInt(5), userId: BigInt(3), type: "BOOKING_CONFIRMED", title: "予約確定のお知らせ", body: "田中 美咲さんへの予約が確定しました。当日のご来店をお待ちしております。", isRead: false, createdAt: new Date(Date.now() - 3600000) },
  { id: BigInt(6), userId: BigInt(3), type: "REMINDER", title: "明日の予約リマインド", body: "明日 10:00 より予約が入っています。遅れる場合はお早めにご連絡ください。", isRead: false, createdAt: new Date(Date.now() - 7200000) },
  { id: BigInt(7), userId: BigInt(3), type: "SYSTEM", title: "本人確認完了", body: "ご提出いただいた本人確認書類の審査が完了しました。", isRead: true, createdAt: new Date(Date.now() - 172800000) },
];

const dummyBlogs = [
  {
    id: BigInt(1),
    title: "アートメイク後のダウンタイムの過ごし方",
    slug: "downtime-guide",
    excerpt: "アートメイクを受けた後の数日間は非常に重要です。正しいケア方法を知ることで、色持ちを良くし、トラブルを防ぐことができます。",
    thumbnailUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80",
    publishedAt: new Date(Date.now() - 86400000 * 2),
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 2),
    author: { name: "MAKELE編集部" },
    categories: [{ category: dummyCategories[0] }],
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
    id: BigInt(2),
    title: "失敗しない！リップアートメイクの色の選び方",
    slug: "lip-color-selection",
    excerpt: "自分の肌色（パーソナルカラー）に合ったリップカラーを選ぶことで、より自然で魅力的な印象を与えることができます。",
    thumbnailUrl: "https://images.unsplash.com/photo-1699282022178-293b6658b45d?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    publishedAt: new Date(Date.now() - 86400000 * 5),
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 6),
    updatedAt: new Date(Date.now() - 86400000 * 5),
    author: { name: "田中 美咲" },
    categories: [{ category: dummyCategories[1] }],
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
    id: BigInt(3),
    title: "アイラインアートメイクで朝のメイクを時短に",
    slug: "eyeliner-time-saving",
    excerpt: "毎朝のアイラインが面倒…そんな悩みはアートメイクで解決！自然なインライン効果で、目元の印象がぐっと明るくなります。",
    thumbnailUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
    publishedAt: new Date(Date.now() - 86400000 * 10),
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 12),
    updatedAt: new Date(Date.now() - 86400000 * 10),
    author: { name: "佐藤 結衣" },
    categories: [{ category: dummyCategories[2] }],
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
];

const dummySubscriptionPlans = [
  {
    id: BigInt(1),
    planCode: "free",
    name: "Free",
    monthlyFee: 0,
    feeRate: 0,
    maxCases: 10,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: BigInt(2),
    planCode: "standard",
    name: "Standard",
    monthlyFee: 9800,
    feeRate: 0.05,
    maxCases: 50,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: BigInt(3),
    planCode: "premium",
    name: "Premium",
    monthlyFee: 19800,
    feeRate: 0.1,
    maxCases: 999,
    isActive: true,
    createdAt: new Date(),
  },
];

const dummyHeroBanners = [
  {
    id: BigInt(1),
    imageUrl: "/demo/banners/hero_banner_with_text.png",
    altText: "MAKELE Hero Banner",
    linkUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function createMockPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbData: Record<string, any[]> = {
    categories: dummyCategories,
    users: dummyUsers,
    areas: dummyAreas,
    artists: dummyArtists,
    cases: dummyCases,
    bookings: dummyBookings,
    notifications: dummyNotifications,
    blogs: dummyBlogs,
    subscriptionPlans: dummySubscriptionPlans,
    heroBanners: dummyHeroBanners,
    availability: [],
    menus: dummyArtists.flatMap((a) => a.menus),
    accounts: [],
    sessions: [],
    passwordResetTokens: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      if (prop === "_dbData") return dbData;
      if (prop === "$connect" || prop === "$disconnect") return async () => {};
      if (prop === "$executeRaw") return async () => 0;
      if (prop === "$queryRaw") return async () => [];
      if (prop === "$transaction") {
        return async <T>(arg: ((tx: PrismaClient) => Promise<T>) | Promise<T>[]) => {
          if (typeof arg === "function") {
            const tx = new Proxy({}, handler) as unknown as PrismaClient;
            return arg(tx);
          }
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          throw new Error("Unsupported mock transaction payload");
        };
      }

      const tableKey = prop === "category" ? "categories"
        : prop === "user" ? "users"
        : prop === "area" ? "areas"
        : prop === "artist" ? "artists"
        : prop === "case" ? "cases"
        : prop === "booking" ? "bookings"
        : prop === "notification" ? "notifications"
        : prop === "blog" ? "blogs"
        : prop === "subscriptionPlan" ? "subscriptionPlans"
        : prop === "heroBanner" ? "heroBanners"
        : prop === "menu" ? "menus"
        : prop === "artistSkill" ? "artistSkills"
        : prop === "passwordResetToken" ? "passwordResetTokens"
        : prop === "account" ? "accounts"
        : prop === "session" ? "sessions"
        : prop;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((o: any, key: string) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
      };

      return {
        findMany: async (args?: any) => {
          let tableData = [...((dbData[tableKey] || []) as any[])];

          if (args?.where) {
            const w = args.where;
            tableData = tableData.filter((item: any) => {
              const checkCondition = (item: any, key: string, value: any): boolean => {
                if (typeof value !== 'object' || value === null || typeof value === 'bigint' || value instanceof Date) {
                  const itemVal = getNestedValue(item, key);
                  if (typeof value === 'bigint' || typeof itemVal === 'bigint' || key?.toLowerCase().endsWith('id')) {
                    try {
                      return String(itemVal ?? -1) === String(value ?? -2);
                    } catch {
                      return itemVal == value;
                    }
                  }
                  return itemVal === value;
                }
                if (Array.isArray(value)) return true;
                const itemVal = key ? getNestedValue(item, key) : item;
                if (!itemVal && key) return false;

                return Object.entries(value as Record<string, unknown>).every(([vKey, vVal]) => {
                  if (vKey === 'contains') return String(itemVal || "").toLowerCase().includes(String(vVal).toLowerCase());
                  if (vKey === 'not') {
                    if (vVal === null) return itemVal !== null && itemVal !== undefined;
                    return itemVal !== vVal;
                  }
                  if (vKey === 'in') {
                    if (!Array.isArray(vVal)) return false;
                    return (vVal as unknown[]).some(v => String(v ?? -1) === String(itemVal ?? -2));
                  }
                  if (vKey === 'mode') return true;
                  if (vKey === 'some') {
                    if (!Array.isArray(itemVal)) return false;
                    return (itemVal as unknown[]).some((subItem: unknown) =>
                      Object.entries(vVal as object).every(([sk, sv]) => checkCondition(subItem, sk, sv))
                    );
                  }
                  return checkCondition(itemVal, vKey, vVal);
                });
              };
              if (w.OR && Array.isArray(w.OR)) {
                if (!w.OR.some((cond: any) => Object.entries(cond).every(([k, v]) => checkCondition(item, k, v)))) return false;
              }
              return Object.entries(w as Record<string, unknown>).every(([k, v]) => {
                if (k === 'OR') return true;
                return checkCondition(item, k, v);
              });
            });
          }

          if (args?.orderBy) {
            const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
            tableData.sort((a: any, b: any) => {
              for (const sortObj of orderBy) {
                const key = Object.keys(sortObj as Record<string, unknown>)[0];
                const direction = (sortObj as Record<string, string>)[key];
                let valA = getNestedValue(a, key) ?? 0;
                let valB = getNestedValue(b, key) ?? 0;
                if (valA instanceof Date) valA = valA.getTime();
                if (valB instanceof Date) valB = valB.getTime();
                if (valA === valB) continue;
                return direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
              }
              return 0;
            });
          }

          if (args?.skip !== undefined) tableData = tableData.slice(args.skip);
          if (args?.take !== undefined) tableData = tableData.slice(0, args.take);

          // Handle include/select for relations (Mock Support for Artist -> Cases)
          if (args?.include || args?.select) {
            tableData = tableData.map((item: any) => {
              const newItem = { ...item };
              // Artist -> Cases relation
              if ((args.include?.cases || args.select?.cases) && tableKey === "artists") {
                newItem.cases = dummyCases
                  .filter((c: any) => String(c.artistId) === String(item.id))
                  .slice(0, args.select?.cases?.take || args.include?.cases?.take || 2);
              }
              // Category -> Cases relation
              if ((args.include?.cases || args.select?.cases) && tableKey === "categories") {
                newItem.cases = dummyCases
                  .filter((c: any) => String(c.categoryId) === String(item.id))
                  .slice(0, args.select?.cases?.take || args.include?.cases?.take || 3);
              }
              return newItem;
            });
          }

          return serializeBigInt(tableData);
        },
        findFirst: async (args?: any) => {
          const tableData = (dbData[tableKey] || []) as any[];
          let filtered = [...tableData];
          if (args?.where) {
            const w = args.where;
            filtered = filtered.filter((item: any) => {
              if (w.id !== undefined && String(item.id) !== String(w.id)) return false;
              if (w.slug !== undefined && item.slug !== w.slug) return false;
              if (w.userId !== undefined && String(item.userId) !== String(w.userId)) return false;
              if (w.artistId !== undefined && String(item.artistId) !== String(w.artistId)) return false;
              return true;
            });
          }
          return serializeBigInt(filtered[0] || null);
        },
        findUnique: async (args?: any) => {
          const tableData = (dbData[tableKey] || []) as any[];
          if (args?.where?.id !== undefined) {
            return serializeBigInt(tableData.find((item: any) => String(item.id) === String(args.where.id)) || null);
          }
          if (args?.where?.slug !== undefined) {
            return serializeBigInt(tableData.find((item: any) => item.slug === args.where.slug) || null);
          }
          return serializeBigInt(tableData[0] || null);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        count: async (args?: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let tableData = [...((dbData[tableKey] as any[]) || [])];
          if (args?.where) {
            const w = args.where;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getNestedValue = (obj: any, path: string) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return path.split('.').reduce((o: any, key: string) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tableData = tableData.filter((item: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const checkCondition = (item: any, key: string, value: any): boolean => {
                if (typeof value !== 'object' || value === null || typeof value === 'bigint' || value instanceof Date) {
                  const itemVal = getNestedValue(item, key);
                  return itemVal === value;
                }
                if (!Array.isArray(value)) {
                  const itemVal = key ? getNestedValue(item, key) : item;
                  return Object.entries(value).every(([vKey, vVal]) => {
                    if (vKey === 'contains') {
                      const str = String(itemVal || "").toLowerCase();
                      const search = String(vVal).toLowerCase();
                      return str.includes(search);
                    }
                    if (vKey === 'not') {
                      if (vVal === null) return itemVal !== null && itemVal !== undefined;
                      return itemVal !== vVal;
                    }
                    if (vKey === 'in') {
                      if (!Array.isArray(vVal)) return false;
                      return vVal.includes(itemVal);
                    }
                    if (vKey === 'mode') return true;
                    if (vKey === 'some') {
                      if (!Array.isArray(itemVal)) return false;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      return itemVal.some((subItem: any) =>
                        Object.entries(vVal as object).every(([sk, sv]) => checkCondition(subItem, sk, sv))
                      );
                    }
                    return checkCondition(itemVal, vKey, vVal);
                  });
                }
                return true;
              };

              if (w.OR) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!w.OR.some((cond: any) =>
                  Object.entries(cond).every(([k, v]) => checkCondition(item, k, v))
                )) return false;
              }
              return Object.entries(w).every(([k, v]) => {
                if (k === 'OR') return true;
                return checkCondition(item, k, v);
              });
            });
          }
          return tableData.length;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: async (args?: any) => {
          return { id: BigInt(9999), ...args?.data, createdAt: new Date() };
        },
        createMany: async () => {
          return { count: 1 };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: async (args?: any) => {
          return { id: args?.where?.id || BigInt(1), ...args?.data, updatedAt: new Date() };
        },
        updateMany: async () => {
          return { count: 1 };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete: async (args?: any) => {
          return { id: args?.where?.id || BigInt(1), deletedAt: new Date() };
        },
        deleteMany: async () => {
          return { count: 1 };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        upsert: async (args?: any) => {
          return { id: args?.where?.id || BigInt(1), ...args?.create, updatedAt: new Date() };
        },
      };
    }
  };

  return new Proxy({}, handler) as unknown as PrismaClient;
}

function createRealPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required when USE_MOCK_PRISMA=false");
  }

  // Lazy-load DB drivers only when needed (prevents crash in mock-only environments)
  const { Pool } = require("pg");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { PrismaClient } = require("@prisma/client");

  const isServerless = !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY
  );
  const maxConnections = isServerless ? 3 : 10;

  const pool = new Pool({
    connectionString,
    max: maxConnections,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const useMockPrisma = shouldUseMockPrismaServer();

if (useMockPrisma && process.env.NODE_ENV !== "production") {
  console.warn("[prisma] Using mock client (set DATABASE_URL and USE_MOCK_PRISMA=false to use real DB)");
}

const prismaClient = useMockPrisma
  ? createMockPrismaClient()
  : (globalForPrisma.prisma ?? createRealPrismaClient());

if (!useMockPrisma && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
export const isMockPrisma = useMockPrisma;
