import { Observable, observable } from "./Observable";

export const fmap =
  <S, T>(f: (src: S) => T) =>
  (ob: Observable<S>): Observable<T> =>
    observable((update) => {
      const { value, unobserve } = ob.observe((src) => update(() => f(src)));
      return { value: f(value), unobserve };
    });
