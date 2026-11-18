export type NumericQuestion = {
  q: string;
  answer: number;
  answerLabel?: string;
};

export type NumericScoreResult = {
  valid: boolean;
  guess: number | null;
  answer: number;
  difference: number | null;
  distance: number;
  label: string;
  explanation: string;
};


export const numericQuestions: NumericQuestion[] = [
  {
    q: "How many years ago was the SSX ski trip that inspired Jubel?",
    answer: 11,
  },
  {
    q: "How much does Uncle Austen weigh (in kg)?",
    answer: 73,
  },
  {
    q: "How many tonnes of snow were imported for Chill Hill 2024?",
    answer: 50,
  },
  {
    q: "How many TP cups are at 97 Pennsylvania Road?",
    answer: 29,
  },
  {
    q: "How much money did SSX raise for Movember in 2023 (in £)?",
    answer: 3200,
    answerLabel: "£3,200",
  },
  {
    q: "How many Instagram followers did Josh McGann have on 18 November 2026 at 18:36?",
    answer: 1537,
    answerLabel: "1,537",
  },
];


export function parseGuess(input: string): number | null {
  const cleaned = input.replace(/,/g, '').trim();
  if (!cleaned) return null;
  if (!/^[-+]?\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString('en-GB') : value.toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

export function evaluateGuess(round: number, input: string): NumericScoreResult {
  const question = numericQuestions[round];
  const answer = question.answer;
  const guess = parseGuess(input);

  if (guess === null) {
    return {
      valid: false,
      guess: null,
      answer,
      difference: null,
      distance: 0,
      label: 'No valid number entered',
      explanation: `The correct answer was ${question.answerLabel ?? formatValue(answer)}. Enter a number to launch a scored jump.`,
    };
  }

  const difference = Math.abs(guess - answer);
  const relativeError = difference / Math.max(Math.abs(answer), 1);

  let distance = 45;
  let label = 'Way off';

  if (difference === 0) {
    distance = 230;
    label = 'Bullseye';
  } else if (relativeError <= 0.02) {
    distance = 215;
    label = 'Almost exact';
  } else if (relativeError <= 0.05) {
    distance = 195;
    label = 'Excellent guess';
  } else if (relativeError <= 0.10) {
    distance = 175;
    label = 'Very close';
  } else if (relativeError <= 0.20) {
    distance = 150;
    label = 'Close';
  } else if (relativeError <= 0.35) {
    distance = 120;
    label = 'Decent guess';
  } else if (relativeError <= 0.50) {
    distance = 95;
    label = 'Not bad';
  } else if (relativeError <= 0.75) {
    distance = 70;
    label = 'A long way off';
  }

  const percent = Math.round(relativeError * 1000) / 10;
  return {
    valid: true,
    guess,
    answer,
    difference,
    distance,
    label,
    explanation: `Your guess was ${formatValue(guess)}. The correct answer was ${question.answerLabel ?? formatValue(answer)}. You were off by ${formatValue(difference)} (${percent}% error).`,
  };
}
