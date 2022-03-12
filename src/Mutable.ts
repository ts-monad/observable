import { observable, Observable, Observation, Update } from "./Observable";

export type MutableSetup<S> = Observation<S>;
export type Mutable<S> = Observable<S> & { update: Update<S> };

export const mutable = <S>(setup: MutableSetup<S>): Mutable<S> => {
  let { state } = setup;
  const { unobserve } = setup;
  let innerUpdate: Update<S>;
  const { observe } = observable<S>((update) => {
    innerUpdate = update;
    return { state, unobserve };
  });
  const update: Update<S> = (transit) =>
    (state = innerUpdate ? innerUpdate(transit) : transit(state));

  return { observe, update };
};
