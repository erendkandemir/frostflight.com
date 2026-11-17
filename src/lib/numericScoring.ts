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
    q: 'How many women did Klaid talk to today?',
    answer: 2,
  },
  {
    q: 'What is Frosty\'s Vaults attendance this year (number of times)?',
    answer: 11,
  },
  {
    q: 'How many followers does Snowsports Exeter have on Instagram? (Guess to the nearest thousand.)',
    answer: 10000,
    answerLabel: '10,000',
  },
  {
    q: 'What house number on Pennsylvania Road does Austen live at?',
    answer: 97,
  },
  {
    q: 'How old is Klaid?',
    answer: 20,
  },
  {
    q: 'When was Timepiece Exeter founded?',
    answer: 1974,
  },
  {
    q: 'How many different drinks are served in the Impy?',
    answer: 184,
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
