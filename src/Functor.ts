import { Observable, observable } from "./Observable";

export const fmap =
  <S, T>(f: (src: S) => T) =>
  (ob: Observable<S>): Observable<T> =>
    observable((update) => {
      const { state, unobserve } = ob.observe((src) => update(() => f(src)));
      return { state: f(state), unobserve };
    });
