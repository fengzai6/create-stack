/**
 * 返回移除指定 key 后的新对象（不修改原对象）。
 * 使用泛型推导 key，并约束 key 必须存在于原对象上。
 */
export function omit<
  T extends Record<string, unknown>,
  const K extends readonly (keyof T)[],
>(source: T, keys: K): Omit<T, K[number]> {
  const next = structuredClone(source) as T;
  for (const key of keys) {
    delete next[key];
  }

  return next as Omit<T, K[number]>;
}
