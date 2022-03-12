import { zip, lift, pure } from "../Applicative";
import { mutable } from "../Mutable";
import { dec, inc } from "./TestHelper";

describe("Applicative", () => {
  describe("#zip", () => {
    it("should join multiple observables", () => {
      const x = mutable(1);
      const y = mutable(5);
      const joined = zip({ x, y });

      // Lazy observation
      expect(x.isObserved()).toBe(false);
      expect(y.isObserved()).toBe(false);

      const cb = jest.fn();
      const ob = joined.observe(cb);
      expect(x.isObserved()).toBe(true);
      expect(y.isObserved()).toBe(true);

      // Get zipped joined state
      expect(ob.state).toEqual({ x: 1, y: 5 });

      // Notify about changes on each field
      x.update(inc);
      expect(cb).toBeCalledTimes(1);
      expect(cb).toBeCalledWith({ x: 2, y: 5 });

      y.update(dec);
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
      expect(obn.state).toBe(42);
      obn.unobserve();
    });
  });

  describe("#lift", () => {
    it("should work correctly as an Applicative Functor lift", () => {
      const x = mutable(1);
      const y = mutable(5);

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
      expect(ob.state).toEqual(5);

      // Notify about changes on each field
      x.update(inc);
      expect(cb).toBeCalledTimes(1);
      expect(cb).toBeCalledWith(10);

      y.update(dec);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toBeCalledWith(8);

      // Unobserve all joined obervers
      ob.unobserve();
      expect(x.isObserved()).toBe(false);
      expect(y.isObserved()).toBe(false);
    });
  });
});
