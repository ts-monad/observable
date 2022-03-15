import { MutableStore } from "../Store";

export const add = (n: number) => (store: MutableStore<number>) =>
  store.set(store.get() + n);
export const inc = add(1);
export const dec = add(-1);
