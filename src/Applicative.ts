import { fmap } from "./Functor";
import { Observable, observable } from "./Observable";

export type ObservableRecord<R> = { [K in keyof R]: Observable<R[K]> };

export const zip = <R extends Record<string, any>>(
  obr: ObservableRecord<R>
): Observable<R> =>
  observable(update => {
    const unobs: (() => void)[] = [];
    let value = Object.keys(obr).reduce((acc: R, key: keyof R) => {
      const ob = obr[key].observe(val => {
        value = { ...value, [key]: val };
        update(value);
      });
      acc[key] = ob.value;
      unobs.push(ob.unobserve);
      return acc;
    }, {} as R);
    const unobserve = () => unobs.forEach(unob => unob());
    return { value, unobserve };
  });

export const pure = <T>(value: T): Observable<T> =>
  observable(() => ({ value, unobserve: () => {} }));

export const lift =
  <R, T>(f: (rec: R) => T) =>
  (obr: ObservableRecord<R>) =>
    fmap(f)(zip(obr));
