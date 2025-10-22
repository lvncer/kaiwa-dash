"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type CharacterId,
  type ModeId,
  getCharacters,
  getModes,
} from "@/lib/constants/game-config";

export default function SelectPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterId | null>(null);

  const modes = getModes();
  const characters = getCharacters();

  const handleStart = () => {
    if (!selectedMode || !selectedCharacter) {
      alert("モードとキャラクターを選択してください");
      return;
    }

    router.push(`/play?mode=${selectedMode}&character=${selectedCharacter}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">ゲーム設定</h1>
          <p className="text-gray-600">
            モードとキャラクターを選んでスタート！
          </p>
        </div>

        {/* モード選択 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold">モード選択</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedMode === mode.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-3xl">{mode.icon}</span>
                  <h3 className="text-lg font-bold">{mode.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* キャラクター選択 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold">キャラクター選択</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {characters.map((character) => (
              <button
                key={character.id}
                type="button"
                onClick={() => setSelectedCharacter(character.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedCharacter === character.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-3xl">{character.icon}</span>
                  <h3 className="text-lg font-bold">{character.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{character.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* スタートボタン */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg border-2 border-gray-300 px-8 py-4 font-bold text-gray-700 hover:bg-gray-100"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={!selectedMode || !selectedCharacter}
            className="flex-1 rounded-lg bg-linear-to-r from-blue-500 to-purple-500 px-8 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            スタート！
          </button>
        </div>

        {/* 選択状態の表示 */}
        {(selectedMode || selectedCharacter) && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-center text-sm text-gray-700">
            {selectedMode &&
              `モード: ${getModes().find((m) => m.id === selectedMode)?.name}`}
            {selectedMode && selectedCharacter && " / "}
            {selectedCharacter &&
              `キャラクター: ${getCharacters().find((c) => c.id === selectedCharacter)?.name}`}
          </div>
        )}
      </div>
    </div>
  );
}

