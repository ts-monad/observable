import { observable, Observable, Observer } from "./Observable";

export type Store<T> = Observable<T> & { get(): T };

export type MutableStore<T> = Store<T> & {
  set(newValue: T): T;
};

export const mutable = <T>(initialValue: T): MutableStore<T> => {
  let value = initialValue;
  let observer: Observer<T> | null = null;
  return {
    ...observable(obr => {
      observer = obr;
      const unobserve = () => (observer = null);
      return { value, unobserve };
    }),
    set: newValue => {
      value = newValue;
      observer && observer(value);
      return value;
    },
    get: () => value,
  };
};

export type RelayStore<T> = Store<T> & {
  destroy(): void;
};

export const relay = <T>(ob: Observable<T>): RelayStore<T> => {
  const { value, unobserve: destroy } = ob.observe(v => set(v));
  const { observe, isObserved, get, set } = mutable(value);
  return { observe, isObserved, get, destroy };
};
