/**
 * GDI (Global Dependency Index) Sorting
 * 简版实现：按信心度(Confidence)降序排列
 */

export interface GDIItem {
  id: string;
  confidence: number;
  blast_radius: number;
  success_rate?: number;
}

export function sortGDI(items: GDIItem[]): GDIItem[] {
  return [...items].sort((a, b) => {
    // 1. 优先按信心度降序
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    // 2. 信心度相同时，按影响半径(Blast Radius)升序（更保守）
    if (a.blast_radius !== b.blast_radius) {
      return a.blast_radius - b.blast_radius;
    }
    // 3. 兜底按 ID
    return a.id.localeCompare(b.id);
  });
}
