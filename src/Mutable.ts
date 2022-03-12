import { observable, Observable, Update } from "./Observable";

export type Mutable<S> = Observable<S> & {
  update: Update<S>;
};

export const mutable = <S>(initialState: S): Mutable<S> => {
  let state = initialState;
  let innerUpdate: Update<S> | null = null;

  return {
    ...observable<S>((update) => {
      innerUpdate = update;
      const unobserve = () => (innerUpdate = null);
      return { state, unobserve };
    }),
    update(transition) {
      return (state = innerUpdate
        ? innerUpdate(transition)
        : transition(state));
    },
  };
};
