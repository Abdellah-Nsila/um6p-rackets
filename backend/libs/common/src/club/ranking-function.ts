export const rankingFunction = (my_score: number, opponent_score: number): number => {
  if (my_score > opponent_score) return 3; // Winner
  if (my_score === opponent_score) return 1; // Draw , useless but keep it
  return -1; // Loser
};