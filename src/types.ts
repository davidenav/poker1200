// types.ts
export interface Player {
  id: string;
  name: string;
}

export interface GamePlayer {
  player: Player;
}

export type RootStackParamList = {
  GamesList: undefined;
  GameStats: { gameId: string };
  Game: { gameId: string };
};
