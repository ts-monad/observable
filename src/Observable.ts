import { chain } from "./Chain";

export type Observer<T> = (value: T) => void;
export type Observation<T> = { value: T; unobserve: () => void };
export type Observe<T> = (observer: Observer<T>) => Observation<T>;
export type Observable<T> = { observe: Observe<T>; isObserved(): boolean };
export type ObservableSetup<T> = (update: Observer<T>) => Observation<T>;

export const observable = <T>(setup: ObservableSetup<T>): Observable<T> => {
  let observation: Observation<T> | null = null;
  const observers = chain<Observer<T>>();

  const initialize = () => {
    const update: Observer<T> = (value) => {
      if (value !== obn.value) {
        obn.value = value;
        observers.forEach((cb) => cb(value));
      }
      return value;
    };
    const obn: Observation<T> = (observation = setup(update));
    return obn;
  };

  const observe: Observe<T> = (observer) => {
    const obn = observation ?? initialize();
    const remove = observers.add(observer);
    const unobserve = () => {
      if (remove() && observers.isEmpty()) {
        obn.unobserve();
        observation = null;
      }
    };

    return { value: obn.value, unobserve };
  };
  const isObserved = () => !observers.isEmpty();

  return { observe, isObserved };
};
