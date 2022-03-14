import { zip, lift, pure } from "../Applicative";
import { store } from "../Store";
import { dec, inc } from "./TestHelper";

describe("Applicative", () => {
  describe("#zip", () => {
    it("should join multiple observables", () => {
      const x = store(1);
      const y = store(5);
      const joined = zip({ x, y });

      // Lazy observation
      expect(x.isObserved()).toBe(false);
      expect(y.isObserved()).toBe(false);

      const cb = jest.fn();
      const ob = joined.observe(cb);
      expect(x.isObserved()).toBe(true);
      expect(y.isObserved()).toBe(true);

      // Get zipped joined value
      expect(ob.value).toEqual({ x: 1, y: 5 });

      // Notify about changes on each field
      inc(x);
      expect(cb).toBeCalledTimes(1);
      expect(cb).toBeCalledWith({ x: 2, y: 5 });

      dec(y);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toBeCalledWith({ x: 2, y: 4 });

      // Unobserve all joined obervers
      ob.unobserve();
      expect(x.isObserved()).toBe(false);
      expect(y.isObserved()).toBe(false);
    });
  });

  describe("#pure", () => {
    it("should return a constant observable", () => {
      const value = pure(42);
      const obn = value.observe(() => {});
      expect(obn.value).toBe(42);
      obn.unobserve();
    });
  });

  describe("#lift", () => {
    it("should work correctly as an Applicative Functor lift", () => {
      const x = store(1);
      const y = store(5);

      const prodXY = ({ x, y }: { x: number; y: number }) => x * y;
      const prod = lift(prodXY)({ x, y });

      // Lazy observation
      expect(x.isObserved()).toBe(false);
      expect(y.isObserved()).toBe(false);

      const cb = jest.fn();
      const ob = prod.observe(cb);
      expect(x.isObserved()).toBe(true);
      expect(y.isObserved()).toBe(true);

      // Do the initial calculation
      expect(ob.value).toEqual(5);

      // Notify about changes on each field
      inc(x);
      expect(cb).toBeCalledTimes(1);
      expect(cb).toBeCalledWith(10);

      dec(y);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toBeCalledWith(8);

      // Unobserve all joined obervers
      ob.unobserve();
      expect(x.isObserved()).toBe(false);
      expect(y.isObserved()).toBe(false);
    });
  });
});
