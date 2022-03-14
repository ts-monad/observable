import { observable, Observable, Observer } from "./Observable";

export type Store<T> = Observable<T> & {
  set(newValue: T): T;
  get(): T;
};

export const store = <T>(initialValue: T): Store<T> => {
  let value = initialValue;
  let observer: Observer<T> | null = null;
  return {
    ...observable((ob) => {
      observer = ob;
      const unobserve = () => (observer = null);
      return { value, unobserve };
    }),
    set: (newValue) => {
      value = newValue;
      observer && observer(value);
      return value;
    },
    get: () => value,
  };
};
