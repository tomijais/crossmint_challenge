export interface GoalResponse {
  goal: string[][];
}

export interface IBody {
  column: number;
  row: number;
  candidateId: string;
  color?: string;
  direction?: string;
}
