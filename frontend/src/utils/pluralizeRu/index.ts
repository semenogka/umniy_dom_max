/**
 * Склоняет слово по правилам русского языка в зависимости от числа.
 *
 * @param value - число для склонения
 * @param words - три формы: 1 / 2–4 / 5+
 * @param withNumber - подставлять ли число в результат
 *
 * @example
 * pluralizeRu(1, ["дом", "дома", "домов"]) // "дом"
 * pluralizeRu(2, ["дом", "дома", "домов"], true) // "2 дома"
 */
export function pluralizeRu(
	value: number,
	words: [string, string, string],
	withNumber = false,
): string {
	const absValue = Math.abs(value) % 100;
	const lastDigit = absValue % 10;

	let word: string;

	if (absValue > 10 && absValue < 20) word = words[2];
	else if (lastDigit === 1) word = words[0];
	else if (lastDigit >= 2 && lastDigit <= 4) word = words[1];
	else word = words[2];

	return withNumber ? `${value} ${word}` : word;
}
