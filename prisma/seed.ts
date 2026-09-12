import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import {
  SEED_ADMIN_USER,
  SEED_AREAS,
  SEED_ARTIST,
  SEED_BLOGS,
  SEED_CATEGORIES,
  SEED_SAMPLE_USER,
  SEED_SUBSCRIPTION_PLANS,
  SEED_TECHNIQUES,
} from "../src/lib/seed-data";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type DemoMenuSeed = {
  categorySlug: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  isActive: boolean;
  sortOrder: number;
};

type DemoArtistSeed = {
  user: {
    name: string;
    email: string;
    password: string;
  };
  displayName: string;
  bio: string;
  areaPrefecture: string;
  profileImgUrl: string;
  menus: DemoMenuSeed[];
};

type DemoCaseSeed = {
  artistIndex: number;
  title: string;
  categorySlug: string;
  techniqueName: string;
  beforeImgUrl: string;
  afterImgUrl: string;
  description: string;
  sessionCount: number;
  downtimeDays: number;
  downtimeNote: string;
};

const DEMO_ARTISTS: DemoArtistSeed[] = [
  {
    user: SEED_ARTIST.user,
    displayName: SEED_ARTIST.profile.displayName,
    bio: SEED_ARTIST.profile.bio,
    areaPrefecture: SEED_ARTIST.areaPrefecture,
    profileImgUrl: "/demo/artists/artist_7.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "ナチュラル眉 1回コース",
        description: "自然な毛流れを活かした、やわらかい印象の眉デザインです。",
        price: 55000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "リップブラッシュ 1回コース",
        description: "血色感をプラスして、素顔でも明るい印象に整えます。",
        price: 65000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "佐藤 結衣", email: "artist2@makele.jp", password: "artist12345" },
    displayName: "佐藤 結衣",
    bio: "骨格に合わせたやさしい眉と、血色感のあるリップが得意です。",
    areaPrefecture: "大阪府",
    profileImgUrl: "/demo/artists/artist_6.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "パウダー眉 2回コース",
        description: "ふんわりとした陰影で、メイクのような自然な眉に仕上げます。",
        price: 52000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "シアーリップ 2回コース",
        description: "透け感のある発色で、自然に顔色を明るく見せます。",
        price: 62000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "鈴木 陽子", email: "artist3@makele.jp", password: "artist12345" },
    displayName: "鈴木 陽子",
    bio: "繊細な毛並み表現と、ナチュラルな立体感づくりを大切にしています。",
    areaPrefecture: "神奈川県",
    profileImgUrl: "/demo/artists/artist_3.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "毛並み眉 3回コース",
        description: "1本1本の毛流れを描くことで、自眉のような自然さを目指します。",
        price: 58000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "フルリップ 3回コース",
        description: "しっかり発色させたい方へ向けた、存在感のある唇デザインです。",
        price: 68000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "高橋 舞", email: "artist4@makele.jp", password: "artist12345" },
    displayName: "高橋 舞",
    bio: "男性の眉や、印象を整えるナチュラルなデザインが得意です。",
    areaPrefecture: "愛知県",
    profileImgUrl: "/demo/artists/artist_8.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "メンズ眉 4回コース",
        description: "清潔感を重視した、自然で整った眉に仕上げます。",
        price: 54000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "ナチュラルリップ 4回コース",
        description: "唇の輪郭をきれいに整え、やわらかい血色感を足します。",
        price: 64000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "伊藤 瑞希", email: "artist5@makele.jp", password: "artist12345" },
    displayName: "伊藤 瑞希",
    bio: "左右差の調整や、自然なリタッチ対応を丁寧に行っています。",
    areaPrefecture: "福岡県",
    profileImgUrl: "/demo/artists/artist_5.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "リタッチ眉 5回コース",
        description: "既存の眉を活かしながら、より整った印象に整えます。",
        price: 53000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "血色感リップ 5回コース",
        description: "ふんわりとした発色で、健康的な唇の印象をつくります。",
        price: 63000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "渡辺 彩花", email: "artist6@makele.jp", password: "artist12345" },
    displayName: "渡辺 彩花",
    bio: "写真映えする眉ラインと、透明感のあるリップにこだわっています。",
    areaPrefecture: "北海道",
    profileImgUrl: "/demo/artists/artist_2.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "4D眉 6回コース",
        description: "立体感のある眉ラインで、メイクなしでも整った印象に。",
        price: 56000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "ピンクリップ 6回コース",
        description: "自然なピンク系で、やわらかい雰囲気に仕上げます。",
        price: 66000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "中村 里帆", email: "artist7@makele.jp", password: "artist12345" },
    displayName: "中村 里帆",
    bio: "上品で落ち着いた印象づくりを大切に、丁寧に施術しています。",
    areaPrefecture: "京都府",
    profileImgUrl: "/demo/artists/artist_9.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "ナチュラルライン 7回コース",
        description: "骨格に沿った自然なラインで、品のある表情に整えます。",
        price: 57000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "ローズリップ 7回コース",
        description: "自然なローズトーンで、優しい印象を演出します。",
        price: 67000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "小林 優奈", email: "artist8@makele.jp", password: "artist12345" },
    displayName: "小林 優奈",
    bio: "ライフスタイルに合わせた持ちの良いデザイン提案が得意です。",
    areaPrefecture: "兵庫県",
    profileImgUrl: "/demo/artists/artist_4.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "ハーフパウダー眉 8回コース",
        description: "やわらかさと存在感のバランスが取れた眉デザインです。",
        price: 55000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "ソフトリップ 8回コース",
        description: "控えめな発色で、日常使いしやすい仕上がりに。",
        price: 65000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "加藤 杏奈", email: "artist9@makele.jp", password: "artist12345" },
    displayName: "加藤 杏奈",
    bio: "眉の細かなニュアンスと、ふんわり感のあるリップが得意です。",
    areaPrefecture: "埼玉県",
    profileImgUrl: "/demo/artists/artist_1.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "毛流れ眉 9回コース",
        description: "自眉になじむ繊細な毛流れで、自然な印象をつくります。",
        price: 59000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "ライトリップ 9回コース",
        description: "軽やかな色味で、素顔でも明るく見えるリップに。",
        price: 69000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  {
    user: { name: "吉田 栞", email: "artist10@makele.jp", password: "artist12345" },
    displayName: "吉田 栞",
    bio: "左右差の少ない、すっきりとしたラインづくりを得意としています。",
    areaPrefecture: "千葉県",
    profileImgUrl: "/demo/artists/artist_10.png",
    menus: [
      {
        categorySlug: "eyebrow",
        name: "パラレル眉 10回コース",
        description: "表情になじむ自然な角度で、やさしい印象に仕上げます。",
        price: 60000,
        durationMin: 120,
        isActive: true,
        sortOrder: 1,
      },
      {
        categorySlug: "lip",
        name: "コーラルリップ 10回コース",
        description: "明るくやわらかい印象をつくる、コーラル系のリップデザインです。",
        price: 70000,
        durationMin: 90,
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
];

const DEMO_CASES: DemoCaseSeed[] = [
  {
    artistIndex: 0,
    title: "Natural Eyebrow Design",
    categorySlug: "eyebrow",
    techniqueName: "毛並み（マイクロブレーディング）",
    beforeImgUrl: "/demo/cases/case1_before.png",
    afterImgUrl: "/demo/cases/case1_after.png",
    description: "自然な毛流れを再現し、素顔でもやわらかく見える眉に整えました。",
    sessionCount: 2,
    downtimeDays: 2,
    downtimeNote: "赤みは1〜2日ほどで落ち着きます。",
  },
  {
    artistIndex: 1,
    title: "Powder Brow Case",
    categorySlug: "eyebrow",
    techniqueName: "パウダー眉",
    beforeImgUrl: "/demo/cases/case2_before.png",
    afterImgUrl: "/demo/cases/case2_after.png",
    description: "ふんわりとした陰影で、毎日のメイクを短縮しやすい眉にしました。",
    sessionCount: 2,
    downtimeDays: 2,
    downtimeNote: "施術直後は色が濃く見えますが、徐々になじみます。",
  },
  {
    artistIndex: 2,
    title: "Eyebrow Microblading Refresh",
    categorySlug: "eyebrow",
    techniqueName: "コンビネーション眉",
    beforeImgUrl: "/demo/cases/case3_before.png",
    afterImgUrl: "/demo/cases/case3_after.png",
    description: "既存の眉を活かしながら、立体感を少し強めたリフレッシュ例です。",
    sessionCount: 1,
    downtimeDays: 1,
    downtimeNote: "当日は保湿と摩擦を避けるのがおすすめです。",
  },
  {
    artistIndex: 3,
    title: "Men's Brow Design",
    categorySlug: "eyebrow",
    techniqueName: "パウダー眉",
    beforeImgUrl: "/demo/cases/case4_before.png",
    afterImgUrl: "/demo/cases/case4_after.png",
    description: "男性らしい清潔感を残しつつ、自然に整えた眉デザインです。",
    sessionCount: 1,
    downtimeDays: 1,
    downtimeNote: "軽い赤みは数日で落ち着きます。",
  },
  {
    artistIndex: 4,
    title: "Sheer Lip Tint",
    categorySlug: "lip",
    techniqueName: "リップブラッシュ",
    beforeImgUrl: "/demo/cases/case5_before.png",
    afterImgUrl: "/demo/cases/case5_after.png",
    description: "ほんのりとした血色感を足して、自然に顔色を明るく見せました。",
    sessionCount: 2,
    downtimeDays: 2,
    downtimeNote: "唇の乾燥対策をしっかり行うと経過が安定します。",
  },
  {
    artistIndex: 5,
    title: "Full Lip Color",
    categorySlug: "lip",
    techniqueName: "フルリップカラー",
    beforeImgUrl: "/demo/cases/case6_before.png",
    afterImgUrl: "/demo/cases/case6_after.png",
    description: "しっかりとした発色で、メイク感を出したい方に向けた仕上がりです。",
    sessionCount: 2,
    downtimeDays: 3,
    downtimeNote: "色の定着には数日かかります。",
  },
  {
    artistIndex: 6,
    title: "Balanced Brow Line",
    categorySlug: "eyebrow",
    techniqueName: "毛並み（マイクロブレーディング）",
    beforeImgUrl: "/demo/cases/case7_before.png",
    afterImgUrl: "/demo/cases/case7_after.png",
    description: "左右差を整えながら、なじみの良い眉ラインに仕上げました。",
    sessionCount: 1,
    downtimeDays: 1,
    downtimeNote: "こすらず、やさしく清潔を保つのがポイントです。",
  },
  {
    artistIndex: 7,
    title: "Gentle Lip Retouch",
    categorySlug: "lip",
    techniqueName: "リップブラッシュ",
    beforeImgUrl: "/demo/cases/case8_before.png",
    afterImgUrl: "/demo/cases/case8_after.png",
    description: "既存の色味を活かし、よりやわらかく見えるように整えました。",
    sessionCount: 1,
    downtimeDays: 2,
    downtimeNote: "直後は色が強く見えるため、数日かけて自然になじみます。",
  },
  {
    artistIndex: 8,
    title: "Brows After a Retouch",
    categorySlug: "eyebrow",
    techniqueName: "コンビネーション眉",
    beforeImgUrl: "/demo/cases/case9_before.png",
    afterImgUrl: "/demo/cases/case9_after.png",
    description: "薄くなった部分を補い、毎朝のメイクがしやすい状態に整えました。",
    sessionCount: 2,
    downtimeDays: 2,
    downtimeNote: "施術部位は乾燥しやすいため保湿を意識してください。",
  },
  {
    artistIndex: 9,
    title: "4D Brow Design",
    categorySlug: "eyebrow",
    techniqueName: "パウダー眉",
    beforeImgUrl: "/demo/cases/case10_before.png",
    afterImgUrl: "/demo/cases/case10_after.png",
    description: "立体感を持たせつつ、写真でも映える自然な眉に調整しました。",
    sessionCount: 1,
    downtimeDays: 1,
    downtimeNote: "洗顔時の摩擦を避けるときれいに仕上がります。",
  },
  {
    artistIndex: 0,
    title: "Pink Lip Tone",
    categorySlug: "lip",
    techniqueName: "フルリップカラー",
    beforeImgUrl: "/demo/cases/case11_before.png",
    afterImgUrl: "/demo/cases/case11_after.png",
    description: "自然なピンクトーンで、健康的でやわらかい印象をつくりました。",
    sessionCount: 2,
    downtimeDays: 2,
    downtimeNote: "唇の保湿をこまめに行うと色なじみが安定します。",
  },
  {
    artistIndex: 1,
    title: "Parallel Brow Design",
    categorySlug: "eyebrow",
    techniqueName: "毛並み（マイクロブレーディング）",
    beforeImgUrl: "/demo/cases/case12_before.png",
    afterImgUrl: "/demo/cases/case12_after.png",
    description: "輪郭を整えて、全体のバランスが取りやすい眉ラインに仕上げました。",
    sessionCount: 1,
    downtimeDays: 1,
    downtimeNote: "汗をかく強い運動は当日は避けると安心です。",
  },
];

async function main() {
  console.log("データベースのシード開始...");

  // カテゴリ
  const categoriesBySlug = new Map<string, { id: bigint; name: string }>();
  for (const category of SEED_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
      create: category,
    });
    categoriesBySlug.set(category.slug, { id: created.id, name: created.name });
  }

  console.log(
    "カテゴリ作成完了:",
    Array.from(categoriesBySlug.values())
      .map((c) => c.name)
      .join(", ")
  );

  for (const plan of SEED_SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { planCode: plan.planCode },
      update: {
        name: plan.name,
        monthlyFee: plan.monthlyFee,
        feeRate: new Prisma.Decimal(plan.feeRate),
        maxCases: plan.maxCases,
        isActive: plan.isActive,
      },
      create: {
        planCode: plan.planCode,
        name: plan.name,
        monthlyFee: plan.monthlyFee,
        feeRate: new Prisma.Decimal(plan.feeRate),
        maxCases: plan.maxCases,
        isActive: plan.isActive,
      },
    });
  }
  console.log("サブスクリプションプラン作成完了（Free / Standard / Premium）");

  // 技法
  for (const t of SEED_TECHNIQUES) {
    const category = categoriesBySlug.get(t.categorySlug);
    if (!category) {
      throw new Error(`Unknown category slug in seed technique: ${t.categorySlug}`);
    }

    await prisma.technique.upsert({
      where: { name: t.name },
      update: { categoryId: category.id, sortOrder: t.sortOrder },
      create: { name: t.name, categoryId: category.id, sortOrder: t.sortOrder },
    });
  }

  console.log("技法作成完了");

  // エリア（都道府県）
  const createdAreas = [];
  for (const areaSeed of SEED_AREAS) {
    const existing = await prisma.area.findFirst({
      where: { prefecture: areaSeed.prefecture, city: null },
    });

    if (existing) {
      const updated = await prisma.area.update({
        where: { id: existing.id },
        data: { sortOrder: areaSeed.sortOrder },
      });
      createdAreas.push(updated);
    } else {
      const created = await prisma.area.create({ data: areaSeed });
      createdAreas.push(created);
    }
  }

  console.log("エリア作成完了");

  // 管理者ユーザー
  const adminPassword = await bcrypt.hash(SEED_ADMIN_USER.password, 12);
  let admin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_USER.email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: SEED_ADMIN_USER.name,
        email: SEED_ADMIN_USER.email,
        passwordHash: adminPassword,
        role: "ADMIN",
        emailVerified: true,
      },
    });
  }

  console.log("管理者ユーザー作成完了:", admin.email);

  const eyebrow = categoriesBySlug.get("eyebrow");
  const lip = categoriesBySlug.get("lip");
  if (!eyebrow || !lip) {
    throw new Error("Required categories not found after seed upsert");
  }

  const artistsByIndex: Array<{ id: bigint; userId: bigint; displayName: string }> = [];
  // artistMenuMap[artistIndex][categorySlug] = menuId
  const artistMenuMap = new Map<number, Map<string, bigint>>();

  for (const [index, artistSeed] of DEMO_ARTISTS.entries()) {
    artistMenuMap.set(index, new Map());
    const passwordHash = await bcrypt.hash(artistSeed.user.password, 12);
    let user = await prisma.user.findUnique({ where: { email: artistSeed.user.email } });
    if (user) {
      user = await prisma.user.update({
        where: { email: artistSeed.user.email },
        data: {
          name: artistSeed.user.name,
          passwordHash,
          role: "ARTIST",
          emailVerified: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: artistSeed.user.name,
          email: artistSeed.user.email,
          passwordHash,
          role: "ARTIST",
          emailVerified: true,
        },
      });
    }

    const artistArea = createdAreas.find((area) => area.prefecture === artistSeed.areaPrefecture);
    if (!artistArea) {
      throw new Error(`Artist area not found: ${artistSeed.areaPrefecture}`);
    }

    let artist = await prisma.artist.findUnique({ where: { userId: user.id } });
    if (artist) {
      artist = await prisma.artist.update({
        where: { userId: user.id },
        data: {
          displayName: artistSeed.displayName,
          bio: artistSeed.bio,
          areaId: artistArea.id,
          profileImgUrl: artistSeed.profileImgUrl,
          isPublished: true,
        },
      });
    } else {
      artist = await prisma.artist.create({
        data: {
          userId: user.id,
          displayName: artistSeed.displayName,
          bio: artistSeed.bio,
          areaId: artistArea.id,
          profileImgUrl: artistSeed.profileImgUrl,
          isPublished: true,
        },
      });
    }

    artistsByIndex.push({ id: artist.id, userId: user.id, displayName: artist.displayName });

    await prisma.artistSkill.createMany({
      data: [
        { artistId: artist.id, categoryId: eyebrow.id, sortOrder: 1 },
        { artistId: artist.id, categoryId: lip.id, sortOrder: 2 },
      ],
      skipDuplicates: true,
    });

    for (const menu of artistSeed.menus) {
      const targetCategory = categoriesBySlug.get(menu.categorySlug);
      if (!targetCategory) {
        throw new Error(`Unknown category slug in menu seed: ${menu.categorySlug}`);
      }

      const existing = await prisma.menu.findFirst({
        where: {
          artistId: artist.id,
          name: menu.name,
        },
      });

      if (existing) {
        await prisma.menu.update({
          where: { id: existing.id },
          data: {
            categoryId: targetCategory.id,
            description: menu.description,
            price: menu.price,
            durationMin: menu.durationMin,
            isActive: menu.isActive,
            sortOrder: menu.sortOrder,
          },
        });
        artistMenuMap.get(index)!.set(menu.categorySlug, existing.id);
      } else {
        const createdMenu = await prisma.menu.create({
          data: {
            artistId: artist.id,
            categoryId: targetCategory.id,
            name: menu.name,
            description: menu.description,
            price: menu.price,
            durationMin: menu.durationMin,
            isActive: menu.isActive,
            sortOrder: menu.sortOrder,
          },
        });
        artistMenuMap.get(index)!.set(menu.categorySlug, createdMenu.id);
      }

    }

    console.log(`アーティスト作成完了: ${index + 1}/10 - ${artist.displayName}`);
  }

  const seededArtistIds = artistsByIndex.map((artist) => artist.id);
  // Remove deletion of cases to prevent burning IDs
  // await prisma.booking.deleteMany({ where: { artistId: { in: seededArtistIds } } });
  // await prisma.availability.deleteMany({ where: { artistId: { in: seededArtistIds } } });
  // await prisma.case.deleteMany({ where: { artistId: { in: seededArtistIds } } });

  const techniqueByName = new Map<string, bigint>();
  for (const t of SEED_TECHNIQUES) {
    const createdTechnique = await prisma.technique.findUnique({ where: { name: t.name } });
    if (createdTechnique) {
      techniqueByName.set(t.name, createdTechnique.id);
    }
  }

  for (const [index, caseSeed] of DEMO_CASES.entries()) {
    const artist = artistsByIndex[caseSeed.artistIndex];
    const category = categoriesBySlug.get(caseSeed.categorySlug);
    const techniqueId = techniqueByName.get(caseSeed.techniqueName);

    if (!artist) {
      throw new Error(`Case seed references missing artist index: ${caseSeed.artistIndex}`);
    }

    if (!category) {
      throw new Error(`Unknown category slug in case seed: ${caseSeed.categorySlug}`);
    }

    if (!techniqueId) {
      throw new Error(`Unknown technique name in case seed: ${caseSeed.techniqueName}`);
    }

    const existingCase = await prisma.case.findFirst({
        where: {
            artistId: artist.id,
            title: caseSeed.title,
            categoryId: category.id,
        }
    });

    const linkedMenuId = artistMenuMap.get(caseSeed.artistIndex)?.get(caseSeed.categorySlug) ?? null;

    if (existingCase) {
        await prisma.case.update({
          where: { id: existingCase.id },
          data: {
            techniqueId,
            menuId: linkedMenuId,
            description: caseSeed.description,
            beforeImgUrl: caseSeed.beforeImgUrl,
            afterImgUrl: caseSeed.afterImgUrl,
            sessionCount: caseSeed.sessionCount,
            downtimeDays: caseSeed.downtimeDays,
            downtimeNote: caseSeed.downtimeNote,
          },
        });
    } else {
        await prisma.case.create({
          data: {
            artistId: artist.id,
            categoryId: category.id,
            techniqueId,
            menuId: linkedMenuId,
            title: caseSeed.title,
            description: caseSeed.description,
            beforeImgUrl: caseSeed.beforeImgUrl,
            afterImgUrl: caseSeed.afterImgUrl,
            sessionCount: caseSeed.sessionCount,
            downtimeDays: caseSeed.downtimeDays,
            downtimeNote: caseSeed.downtimeNote,
            isPublished: true,
            viewCount: BigInt((index + 1) * 10),
            rankingScore: new Prisma.Decimal(index % 2 === 0 ? 50 + index : 100 - index),
          },
        });
    }
  }

  // ブログ
  for (const blog of SEED_BLOGS) {
    const category = categoriesBySlug.get(blog.categorySlug);
    if (!category) {
      throw new Error(`Unknown category slug in blog seed: ${blog.categorySlug}`);
    }

    const createdBlog = await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {
        title: blog.title,
        body: blog.body,
        excerpt: blog.excerpt,
        thumbnailUrl: blog.thumbnailUrl,
        isPublished: true,
        publishedAt: new Date(),
        authorId: admin.id,
      },
      create: {
        title: blog.title,
        slug: blog.slug,
        body: blog.body,
        excerpt: blog.excerpt,
        thumbnailUrl: blog.thumbnailUrl,
        isPublished: true,
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });

    await prisma.blogCategory.upsert({
      where: {
        blogId_categoryId: {
          blogId: createdBlog.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        blogId: createdBlog.id,
        categoryId: category.id,
      },
    });
  }
  console.log("ブログ記事作成完了");

  const sampleUserPassword = await bcrypt.hash(SEED_SAMPLE_USER.password, 12);
  let sampleUser = await prisma.user.findUnique({ where: { email: SEED_SAMPLE_USER.email } });
  if (sampleUser) {
    sampleUser = await prisma.user.update({
      where: { email: SEED_SAMPLE_USER.email },
      data: {
        name: SEED_SAMPLE_USER.name,
        passwordHash: sampleUserPassword,
        role: "USER",
        emailVerified: true,
      },
    });
  } else {
    sampleUser = await prisma.user.create({
      data: {
        name: SEED_SAMPLE_USER.name,
        email: SEED_SAMPLE_USER.email,
        passwordHash: sampleUserPassword,
        role: "USER",
        emailVerified: true,
      },
    });
  }

  const firstArtist = artistsByIndex[0];
  const firstArtistMenu = await prisma.menu.findFirst({
    where: {
      artistId: firstArtist.id,
      categoryId: eyebrow.id,
    },
  });

  if (!firstArtistMenu) {
    throw new Error("Could not find seed menu for initial booking");
  }

  let bookedAvailability = await prisma.availability.findFirst({
    where: {
      artistId: firstArtist.id,
      date: new Date("2026-05-20T10:00:00+09:00"),
    }
  });

  if (bookedAvailability) {
    bookedAvailability = await prisma.availability.update({
      where: { id: bookedAvailability.id },
      data: {
        startTime: new Date("2026-05-20T10:00:00+09:00"),
        endTime: new Date("2026-05-20T12:00:00+09:00"),
        status: "BOOKED",
      }
    });
  } else {
    bookedAvailability = await prisma.availability.create({
      data: {
        artistId: firstArtist.id,
        date: new Date("2026-05-20T10:00:00+09:00"),
        startTime: new Date("2026-05-20T10:00:00+09:00"),
        endTime: new Date("2026-05-20T12:00:00+09:00"),
        status: "BOOKED",
      },
    });
  }

  let availableSlot = await prisma.availability.findFirst({
    where: {
        artistId: firstArtist.id,
        date: new Date("2026-05-21T10:00:00+09:00"),
    }
  });

  if (availableSlot) {
    availableSlot = await prisma.availability.update({
      where: { id: availableSlot.id },
      data: {
        startTime: new Date("2026-05-21T10:00:00+09:00"),
        endTime: new Date("2026-05-21T12:00:00+09:00"),
        status: "AVAILABLE",
      }
    });
  } else {
    availableSlot = await prisma.availability.create({
      data: {
        artistId: firstArtist.id,
        date: new Date("2026-05-21T10:00:00+09:00"),
        startTime: new Date("2026-05-21T10:00:00+09:00"),
        endTime: new Date("2026-05-21T12:00:00+09:00"),
        status: "AVAILABLE",
      },
    });
  }

  let booking = await prisma.booking.findFirst({
    where: {
        userId: sampleUser.id,
        artistId: firstArtist.id,
        menuId: firstArtistMenu.id,
    }
  });

  if (booking) {
    booking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        availabilityId: bookedAvailability.id,
        status: "CONFIRMED",
        userNote: "デモ予約です。",
        artistNote: "初回カウンセリングを含めてご案内します。",
      }
    });
  } else {
    booking = await prisma.booking.create({
      data: {
        userId: sampleUser.id,
        artistId: firstArtist.id,
        availabilityId: bookedAvailability.id,
        menuId: firstArtistMenu.id,
        status: "CONFIRMED",
        userNote: "デモ予約です。",
        artistNote: "初回カウンセリングを含めてご案内します。",
      },
    });
  }

  const existingNotificationBooking = await prisma.notification.findFirst({
    where: { refId: booking.id, refType: "booking", userId: sampleUser.id }
  });

  if (existingNotificationBooking) {
      await prisma.notification.update({
        where: { id: existingNotificationBooking.id },
        data: {
          type: "booking_confirmed",
          title: "予約が確定しました",
          body: `${firstArtist.displayName} のデモ予約が確定しました。`,
          isRead: false,
        }
      });
  } else {
      await prisma.notification.create({
        data: {
          userId: sampleUser.id,
          type: "booking_confirmed",
          title: "予約が確定しました",
          body: `${firstArtist.displayName} のデモ予約が確定しました。`,
          refId: booking.id,
          refType: "booking",
          isRead: false,
        },
      });
  }

  const existingNotificationArtist = await prisma.notification.findFirst({
    where: { refId: booking.id, refType: "booking", userId: firstArtist.userId }
  });

  if (existingNotificationArtist) {
      await prisma.notification.update({
        where: { id: existingNotificationArtist.id },
        data: {
          type: "booking_created",
          title: "新しい予約が入りました",
          body: "デモ用の予約が作成されました。",
          isRead: false,
        }
      });
  } else {
      await prisma.notification.create({
        data: {
          userId: firstArtist.userId,
          type: "booking_created",
          title: "新しい予約が入りました",
          body: "デモ用の予約が作成されました。",
          refId: booking.id,
          refType: "booking",
          isRead: false,
        },
      });
  }

  console.log(`サンプル予約作成完了: ${sampleUser.email} -> ${firstArtist.displayName}`);
  console.log(`空き枠作成完了: ${availableSlot.id.toString()}`);

  console.log("サンプルユーザー作成完了");
  console.log("データベースシード完了！");
  console.log("\nテストアカウント:");
  console.log(`  管理者:       ${SEED_ADMIN_USER.email} / ${SEED_ADMIN_USER.password}`);
  console.log(`  アーティスト: ${SEED_ARTIST.user.email} / ${SEED_ARTIST.user.password}`);
  console.log(`  ユーザー:     ${SEED_SAMPLE_USER.email} / ${SEED_SAMPLE_USER.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
