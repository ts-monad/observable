import { bind } from "../Monad";
import { store, Store } from "../Store";
import { add, inc } from "./TestHelper";

describe("Monad", () => {
  describe("#bind", () => {
    it("should work correctly as a Monad Functor bind", () => {
      const stoMs: Store<number>[] = [];
      const stoN = store(1);
      const obM = bind((n: number) => {
        const stoM = store(n * 10);
        stoMs.push(stoM);
        return stoM;
      })(stoN);

      // Lazy observation
      expect(stoN.isObserved()).toBe(false);
      expect(stoMs.length).toBe(0);

      const cb = jest.fn();
      const obn = obM.observe(cb);
      expect(obn.value).toBe(10);

      // Inner update
      expect(stoMs.length).toBe(1);
      inc(stoMs[0]);
      expect(cb).toBeCalledTimes(1);
      expect(cb).toHaveBeenLastCalledWith(11);

      // Outer update
      inc(stoN);
      expect(stoMs.length).toBe(2);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith(20);
      expect(stoMs[0].isObserved()).toBe(false);

      // Outer update without value change
      add(10)(stoMs[1]);
      expect(cb).toBeCalledTimes(3);
      expect(cb).toHaveBeenLastCalledWith(30);

      inc(stoN);
      expect(stoMs.length).toBe(3);
      expect(cb).toBeCalledTimes(3);
      expect(stoMs[1].isObserved()).toBe(false);

      // Cascaded unobserve
      obn.unobserve();
      expect(stoMs[2].isObserved()).toBe(false);
      expect(stoN.isObserved()).toBe(false);
    });
  });
});
