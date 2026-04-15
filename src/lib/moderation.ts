const OBJECTIONABLE_PATTERNS = [
  /\b(?:porn|nude|sex|escort|rape|kill|murder|terror|scam|fraud|gambl(?:e|ing)?|drugs?)\b/i,
  /(?:色情|裸聊|约炮|成人|强奸|杀人|恐袭|诈骗|赌博|毒品)/i,
  /(?:https?:\/\/)?[^\s]+\.(?:xxx|adult|porn)\b/i,
];

/**
 * Basic client-side objectionable content filter.
 * Returns true if the input contains known objectionable patterns.
 */
export function containsObjectionableContent(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  return OBJECTIONABLE_PATTERNS.some((pattern) => pattern.test(text));
}