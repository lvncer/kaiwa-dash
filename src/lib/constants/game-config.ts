/**
 * ゲームモード・キャラクター設定
 */

export type ModeId = "first-meeting" | "casual-sprint" | "pinch-recovery" | "freetalk-hell";
export type CharacterId = "serious" | "cheerful" | "otaku" | "calm";

export type Mode = {
  id: ModeId;
  name: string;
  description: string;
  icon: string;
  // 将来的な拡張用（現状は使用しない）
  turns?: number;
  timeLimit?: number;
};

export type Character = {
  id: CharacterId;
  name: string;
  description: string;
  icon: string;
  personality: string; // AI プロンプト用の性格設定
  responseStyle: string; // 返答スタイルの説明
};

/**
 * モード設定
 */
export const MODES: Record<ModeId, Mode> = {
  "first-meeting": {
    id: "first-meeting",
    name: "初対面チャレンジ",
    description: "はじめまして系の雑談。自己紹介や共通点探しを練習",
    icon: "👋",
  },
  "casual-sprint": {
    id: "casual-sprint",
    name: "雑談スプリント",
    description: "日常的なテーマで気軽にトーク。会話のテンポを鍛える",
    icon: "💬",
  },
  "pinch-recovery": {
    id: "pinch-recovery",
    name: "ピンチ返し",
    description: "気まずいシーンや返しにくい発言への対応力を磨く",
    icon: "😅",
  },
  "freetalk-hell": {
    id: "freetalk-hell",
    name: "フリートークHELL",
    description: "話題ランダム。瞬発力を限界まで試す超反射練習",
    icon: "🔥",
  },
};

/**
 * キャラクター設定
 */
export const CHARACTERS: Record<CharacterId, Character> = {
  serious: {
    id: "serious",
    name: "真面目くん",
    description: "丁寧で論理的な会話スタイル",
    icon: "🧑‍💼",
    personality:
      "真面目で丁寧な性格。論理的に考えて話す。社会人として適切な言葉遣いを心がける。",
    responseStyle:
      "丁寧語を使い、相手の話を真剣に聞いて適切に返答する。質問も具体的で建設的。",
  },
  cheerful: {
    id: "cheerful",
    name: "明るい女子",
    description: "リアクション豊か、ノリ重視の雑談系",
    icon: "🎨",
    personality:
      "明るく元気な性格。リアクションが豊かで、相手の話に対して共感的。テンポの良い会話を好む。",
    responseStyle:
      "フランクで親しみやすい口調。「わかる〜！」「マジで！？」など感情表現が豊か。絵文字も使う。",
  },
  otaku: {
    id: "otaku",
    name: "オタク仲間",
    description: "マニアックな話題に詳しい",
    icon: "🤓",
    personality:
      "オタク気質で、アニメ・ゲーム・技術など様々な分野に詳しい。好きなことになると熱く語る。",
    responseStyle:
      "カジュアルな口調で、専門的な話題にも対応できる。「それな」「草」などネットスラングも自然に使う。",
  },
  calm: {
    id: "calm",
    name: "冷静タイプ",
    description: "クールで淡々、難易度高め",
    icon: "😏",
    personality:
      "冷静でクールな性格。感情表現は控えめ。的確だが淡々とした返答をする。会話の難易度が高い。",
    responseStyle:
      "簡潔で無駄のない返答。共感表現が少なく、質問も少なめ。相手から話題を広げる必要がある。",
  },
};

/**
 * デフォルト設定
 */
export const DEFAULT_GAME_SETTINGS = {
  turns: 5,
  timeLimit: 30, // 秒
};

/**
 * モード一覧を配列で取得
 */
export function getModes(): Mode[] {
  return Object.values(MODES);
}

/**
 * キャラクター一覧を配列で取得
 */
export function getCharacters(): Character[] {
  return Object.values(CHARACTERS);
}

/**
 * モードIDからモード情報を取得
 */
export function getModeById(id: ModeId): Mode {
  return MODES[id];
}

/**
 * キャラクターIDからキャラクター情報を取得
 */
export function getCharacterById(id: CharacterId): Character {
  return CHARACTERS[id];
}

