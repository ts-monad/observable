import { Observable, observable } from "./Observable";

export const fmap =
  <S, T>(f: (s: S) => T) =>
  (ob: Observable<S>): Observable<T> =>
    observable(observer => {
      const { value, unobserve } = ob.observe(s => observer(f(s)));
      return { value: f(value), unobserve };
    });
