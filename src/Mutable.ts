import { observable, Observable, Update } from "./Observable";

export type Mutable<T> = Observable<T> & { update: Update<T> };

export const mutable = <T>(initialValue: T): Mutable<T> => {
  let value = initialValue;
  let innerUpdate: Update<T> | null = null;

  return {
    ...observable<T>((update) => {
      innerUpdate = update;
      const unobserve = () => (innerUpdate = null);
      return { value: value, unobserve };
    }),
    update(transition) {
      return (value = innerUpdate
        ? innerUpdate(transition)
        : transition(value));
    },
  };
};
