import { chain } from "./Chain";

export type Observer<S> = (state: S) => void;
export type Transition<S> = (state: S) => S;
export type Observation<S> = { state: S; unobserve: () => void };
export type Observe<S> = (observer: Observer<S>) => Observation<S>;
export type Update<S> = (transition: Transition<S>) => S;
export type Observable<S> = { observe: Observe<S> };
export type ObservableSetup<S> = (update: Update<S>) => Observation<S>;

export const observable = <S>(setup: ObservableSetup<S>): Observable<S> => {
  let obn: Observation<S>;
  const observers = chain<Observer<S>>();

  const observe: Observe<S> = (observer) => {
    if (!obn || observers.isEmpty()) {
      obn = setup((transit) => {
        const state = transit(obn.state);
        if (state !== obn.state) {
          obn.state = state;
          observers.forEach((cb) => cb(state));
        }
        return state;
      });
    }
    const remove = observers.add(observer);
    const unobserve = () => remove() && observers.isEmpty() && obn.unobserve();
    return { state: obn.state, unobserve };
  };

  return { observe };
};
