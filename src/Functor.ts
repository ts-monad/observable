import { Observable, observable } from "./Observable";

export const fmap =
  <S, T>(f: (src: S) => T) =>
  (ob: Observable<S>): Observable<T> =>
    observable((observer) => {
      const { value, unobserve } = ob.observe((src) => observer(f(src)));
      return { value: f(value), unobserve };
    });
