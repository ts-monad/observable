import { bind } from "../Monad";
import { mutable, Mutable } from "../Mutable";
import { add, inc } from "./TestHelper";

describe("Monad", () => {
  describe("#bind", () => {
    it("should work correctly as a Monad Functor bind", () => {
      const mutMs: Mutable<number>[] = [];
      const mutN = mutable(1);
      const obM = bind((n: number) => {
        const mutM = mutable(n * 10);
        mutMs.push(mutM);
        return mutM;
      })(mutN);

      // Lazy observation
      expect(mutN.isObserved()).toBe(false);
      expect(mutMs.length).toBe(0);

      const cb = jest.fn();
      const obn = obM.observe(cb);
      expect(obn.value).toBe(10);

      // Inner update
      expect(mutMs.length).toBe(1);
      mutMs[0].update(inc);
      expect(cb).toBeCalledTimes(1);
      expect(cb).toHaveBeenLastCalledWith(11);

      // Outer update
      mutN.update(inc);
      expect(mutMs.length).toBe(2);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith(20);
      expect(mutMs[0].isObserved()).toBe(false);

      // Outer update without value change
      mutMs[1].update(add(10));
      expect(cb).toBeCalledTimes(3);
      expect(cb).toHaveBeenLastCalledWith(30);

      mutN.update(inc);
      expect(mutMs.length).toBe(3);
      expect(cb).toBeCalledTimes(3);
      expect(mutMs[1].isObserved()).toBe(false);

      // Cascaded unobserve
      obn.unobserve();
      expect(mutMs[2].isObserved()).toBe(false);
      expect(mutN.isObserved()).toBe(false);
    });
  });
});
