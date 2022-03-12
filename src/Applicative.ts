import { fmap } from "./Functor";
import { Observable, observable, Observation } from "./Observable";

export type ObservableRecord<R> = { [K in keyof R]: Observable<R[K]> };

export const zip = <R extends Record<string, any>>(
  obr: ObservableRecord<R>
): Observable<R> =>
  observable((update) =>
    Object.keys(obr).reduce(
      ({ state, unobserve }, key: keyof R) => {
        const ob = obr[key].observe((value) =>
          update((rec) => ({ ...rec, [key]: value }))
        );
        state[key] = ob.state;
        return {
          state,
          unobserve: () => {
            ob.unobserve();
            unobserve();
          },
        };
      },
      { state: {}, unobserve: () => {} } as Observation<R>
    )
  );

export const pure = <S>(state: S): Observable<S> =>
  observable(() => ({ state, unobserve: () => {} }));

export const lift =
  <R, T>(f: (rec: R) => T) =>
  (obr: ObservableRecord<R>) =>
    fmap(f)(zip(obr));
