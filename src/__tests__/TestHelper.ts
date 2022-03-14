import { Store } from "../Store";

export const add = (n: number) => (store: Store<number>) =>
  store.set(store.get() + n);
export const inc = add(1);
export const dec = add(-1);
