import { DocumentReference } from "@angular/fire/firestore";
import { Game } from "./Game.model";

export type Result = {
  answerDate: Date;
  points: number;
  game: string | DocumentReference<Game>;
};

export type Viewer = {
  viewerId?: string;
  nickname: string;
  results: Result[];
  totalPoints: number;
  birthdate?: Date;
  followingDate?: Date;
  isHuman?: boolean;
};
