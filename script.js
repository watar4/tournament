const games = [
  ["マンカラ", "ボードゲーム"], ["ドット&ボックス", "ボードゲーム"], ["ヨット", "ボードゲーム"],
  ["コネクトフォー", "ボードゲーム"], ["ヒット&ブロー", "ボードゲーム"], ["ナインメンズモリス", "ボードゲーム"],
  ["ヘックス", "ボードゲーム"], ["チェッカー", "ボードゲーム"], ["ウサギと猟犬", "ボードゲーム"],
  ["五目ならべ", "ボードゲーム"], ["ドミノ", "ボードゲーム"], ["チャイニーズチェッカー", "ボードゲーム"],
  ["ルドー", "ボードゲーム"], ["バックギャモン", "ボードゲーム"], ["リバーシ", "ボードゲーム"],
  ["チェス", "ボードゲーム"], ["将棋", "ボードゲーム"], ["5五将棋", "ボードゲーム"],
  ["花札", "カードゲーム"], ["麻雀", "ボードゲーム"], ["ラストカード", "カードゲーム"],
  ["ブラックジャック", "カードゲーム"], ["テキサスポーカー", "カードゲーム"], ["大富豪", "カードゲーム"],
  ["7ならべ", "カードゲーム"], ["スピード", "カードゲーム"], ["神経衰弱", "カードゲーム"],
  ["戦争", "カードゲーム"], ["たこやき", "カードゲーム"], ["ぶたのしっぽ", "カードゲーム"],
  ["ゴルフ", "スポーツ"], ["ビリヤード", "スポーツ"], ["ボウリング", "スポーツ"],
  ["ダーツ", "スポーツ"], ["キャロム", "ボードゲーム"], ["トイテニス", "スポーツ"],
  ["トイサッカー", "スポーツ"], ["トイカーリング", "スポーツ"], ["トイボクシング", "スポーツ"],
  ["トイベースボール", "スポーツ"], ["エアホッケー", "スポーツ"], ["スロットカー", "バラエティ"],
  ["フィッシング", "バラエティ"], ["VSタンク", "バラエティ"], ["協力タンク", "バラエティ"],
  ["的あて", "バラエティ"], ["6ボールパズル", "バラエティ"], ["スライドパズル", "バラエティ"],
  ["麻雀ソリティア", "ボードゲーム"], ["クロンダイク", "カードゲーム"], ["スパイダー", "カードゲーム"],
  ["ピアノ", "おまけ"]
].map(([name, category], index) => ({
  name,
  category,
  sourceUrl: "https://www.nintendo.com/jp/switch/as7ta/games/index.html",
  officialIndex: index + 1
}));

const state = { rounds: [], members: [], rouletteTimer: null, selectedGame: null };

const memberInput = document.querySelector("#memberInput");
const foodBudget = document.querySelector("#foodBudget");
const bracket = document.querySelector("#bracket");
const matchTemplate = document.querySelector("#matchTemplate");
const rouletteImage = document.querySelector("#rouletteImage");
const rouletteName = document.querySelector("#rouletteName");
const rouletteCategory = document.querySelector("#rouletteCategory");
const gameList = document.querySelector("#gameList");
const startRouletteButton = document.querySelector("#startRouletteButton");
const stopRouletteButton = document.querySelector("#stopRouletteButton");

document.querySelector("#sampleButton").addEventListener("click", () => {
  memberInput.value = ["渡会", "山田", "佐藤", "鈴木", "田中", "高橋", "伊藤", "中村"].join("\n");
});

document.querySelector("#createButton").addEventListener("click", createTournament);
document.querySelector("#resetWinnersButton").addEventListener("click", () => {
  if (state.members.length > 1) buildInitialRounds(state.members);
});
foodBudget.addEventListener("input", renderBracket);
startRouletteButton.addEventListener("click", startRoulette);
stopRouletteButton.addEventListener("click", stopRoulette);

function createTournament() {
  const members = memberInput.value.split(/\n|,/).map((name) => name.trim()).filter(Boolean);
  const uniqueMembers = [...new Set(members)];

  if (uniqueMembers.length < 2) {
    bracket.textContent = "2人以上の名前を入力してください。";
    bracket.className = "bracket empty-state";
    return;
  }

  state.members = shuffle(uniqueMembers);
  buildInitialRounds(state.members);
}

function buildInitialRounds(members) {
  const size = nextPowerOfTwo(members.length);
  const seeded = [...members, ...Array(size - members.length).fill("BYE")];
  const firstRound = [];

  for (let i = 0; i < seeded.length; i += 2) {
    const players = [seeded[i], seeded[i + 1]];
    firstRound.push({
      id: `r0m${i / 2}`,
      players,
      winner: players.includes("BYE") ? players.find((player) => player !== "BYE") : null
    });
  }

  const rounds = [firstRound];
  let matchCount = firstRound.length / 2;
  let roundIndex = 1;
  while (matchCount >= 1) {
    rounds.push(Array.from({ length: matchCount }, (_, index) => ({
      id: `r${roundIndex}m${index}`,
      players: [null, null],
      winner: null
    })));
    matchCount /= 2;
    roundIndex += 1;
  }

  state.rounds = rounds;
  propagateWinners();
  renderBracket();
}

function selectWinner(roundIndex, matchIndex, winner) {
  state.rounds[roundIndex][matchIndex].winner = winner;
  clearFollowing(roundIndex, matchIndex);
  propagateWinners();
  renderBracket();
}

function clearFollowing(roundIndex, matchIndex) {
  let nextRoundIndex = roundIndex + 1;
  let nextMatchIndex = Math.floor(matchIndex / 2);

  while (state.rounds[nextRoundIndex]) {
    state.rounds[nextRoundIndex][nextMatchIndex].winner = null;
    nextRoundIndex += 1;
    nextMatchIndex = Math.floor(nextMatchIndex / 2);
  }
}

function propagateWinners() {
  for (let roundIndex = 1; roundIndex < state.rounds.length; roundIndex += 1) {
    state.rounds[roundIndex].forEach((match, matchIndex) => {
      const left = state.rounds[roundIndex - 1][matchIndex * 2]?.winner || null;
      const right = state.rounds[roundIndex - 1][matchIndex * 2 + 1]?.winner || null;
      match.players = [left, right];
      if (match.winner && !match.players.includes(match.winner)) match.winner = null;
    });
  }
}

function renderBracket() {
  bracket.className = "bracket";
  bracket.innerHTML = "";

  if (!state.rounds.length) {
    bracket.className = "bracket empty-state";
    bracket.textContent = "メンバーを入力してトーナメントを作成してください。";
    return;
  }

  const totalBudget = Number(foodBudget.value || 0);
  const champion = state.rounds.at(-1)?.[0]?.winner;
  const shares = calculateShares(state.members, champion, totalBudget);

  state.rounds.forEach((round, roundIndex) => {
    const roundEl = document.createElement("div");
    roundEl.className = "round";
    const title = document.createElement("div");
    title.className = "round-title";
    title.textContent = roundName(roundIndex, state.rounds.length);
    roundEl.append(title);

    round.forEach((match, matchIndex) => {
      const card = matchTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector(".match-title").textContent = `MATCH ${matchIndex + 1}`;
      const playersEl = card.querySelector(".players");

      match.players.forEach((player) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "player-button";
        if (!player) {
          button.textContent = "勝者待ち";
          button.disabled = true;
        } else if (player === "BYE") {
          button.textContent = "シード";
          button.disabled = true;
          button.classList.add("bye");
        } else {
          const amount = shares.get(player) ?? 0;
          button.innerHTML = `<span>${escapeHtml(player)}</span><span class="share">¥${amount.toLocaleString()}</span>`;
          button.addEventListener("click", () => selectWinner(roundIndex, matchIndex, player));
          if (match.winner === player) button.classList.add("winner");
        }
        playersEl.append(button);
      });

      roundEl.append(card);
    });

    bracket.append(roundEl);
  });
}

function calculateShares(members, champion, totalBudget) {
  const map = new Map();
  if (!members.length) return map;

  const wins = new Map(members.map((member) => [member, 0]));
  state.rounds.flat().forEach((match) => {
    if (match.winner && wins.has(match.winner)) wins.set(match.winner, wins.get(match.winner) + 1);
  });

  const maxWins = Math.max(...wins.values(), 0);
  const weights = members.map((member) => ({ member, weight: Math.max(1, maxWins + 1 - wins.get(member)) }));
  const weightTotal = weights.reduce((sum, item) => sum + item.weight, 0);
  let assigned = 0;

  weights.forEach((item, index) => {
    const amount = index === weights.length - 1 ? totalBudget - assigned : Math.round((totalBudget * item.weight) / weightTotal);
    assigned += amount;
    map.set(item.member, Math.max(0, amount));
  });

  if (champion && members.length > 1) {
    const minShare = Math.min(...map.values());
    map.set(champion, minShare);
  }

  return map;
}

function startRoulette() {
  startRouletteButton.disabled = true;
  stopRouletteButton.disabled = false;
  state.rouletteTimer = window.setInterval(() => {
    setSelectedGame(games[Math.floor(Math.random() * games.length)]);
  }, 70);
}

function stopRoulette() {
  window.clearInterval(state.rouletteTimer);
  state.rouletteTimer = null;
  startRouletteButton.disabled = false;
  stopRouletteButton.disabled = true;
  setSelectedGame(games[Math.floor(Math.random() * games.length)]);
}

function setSelectedGame(game) {
  state.selectedGame = game;
  rouletteName.textContent = game.name;
  rouletteCategory.textContent = `${game.category} / No.${String(game.officialIndex).padStart(2, "0")}`;
  rouletteImage.innerHTML = `<a class="fallback-mark" href="${game.sourceUrl}" target="_blank" rel="noopener">${escapeHtml(game.name)}</a>`;

  document.querySelectorAll(".game-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.name === game.name);
  });
}

function renderGameList() {
  gameList.innerHTML = "";
  games.forEach((game) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "game-chip";
    chip.dataset.name = game.name;
    chip.textContent = game.name;
    chip.addEventListener("click", () => setSelectedGame(game));
    gameList.append(chip);
  });
}

function roundName(index, total) {
  if (index === total - 1) return "決勝";
  if (index === total - 2) return "準決勝";
  return `${index + 1}回戦`;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextPowerOfTwo(value) {
  return 2 ** Math.ceil(Math.log2(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

renderGameList();
setSelectedGame(games[Math.floor(Math.random() * games.length)]);
