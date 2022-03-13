import { fmap } from "./Functor";
import { Observable, observable, Observation } from "./Observable";

export type ObservableRecord<R> = { [K in keyof R]: Observable<R[K]> };

export const zip = <R extends Record<string, any>>(
  obr: ObservableRecord<R>
): Observable<R> =>
  observable((update) =>
    Object.keys(obr).reduce(
      ({ value, unobserve }, key: keyof R) => {
        const ob = obr[key].observe((value) =>
          update((rec) => ({ ...rec, [key]: value }))
        );
        value[key] = ob.value;
        return {
          value,
          unobserve: () => {
            ob.unobserve();
            unobserve();
          },
        };
      },
      { value: {}, unobserve: () => {} } as Observation<R>
    )
  );

export const pure = <T>(value: T): Observable<T> =>
  observable(() => ({ value, unobserve: () => {} }));

export const lift =
  <R, T>(f: (rec: R) => T) =>
  (obr: ObservableRecord<R>) =>
    fmap(f)(zip(obr));
