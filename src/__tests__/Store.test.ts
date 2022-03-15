import { mutable, relay } from "../Store";
import { inc } from "./TestHelper";

describe("Store", () => {
  describe("mutable", () => {
    it("should create a mutable store", () => {
      const mut = mutable(0);

      // Update without observers
      expect(inc(mut)).toBe(1);
      expect(mut.isObserved()).toBe(false);

      // First observe
      const cb1 = jest.fn();
      const obn1 = mut.observe(cb1);
      expect(obn1.value).toBe(1);
      expect(mut.get()).toBe(1);
      expect(mut.isObserved()).toBe(true);

      // Notify the change
      expect(inc(mut)).toBe(2);
      expect(mut.get()).toBe(2);
      expect(cb1).toBeCalledTimes(1);
      expect(cb1).toHaveBeenLastCalledWith(2);

      // Cascaded unobserve
      obn1.unobserve();
      expect(mut.isObserved()).toBe(false);

      // Second observation
      const cb2 = jest.fn();
      const obn2 = mut.observe(cb2);
      expect(obn2.value).toBe(2);
      expect(mut.isObserved()).toBe(true);

      // Cascaded unobserve
      obn2.unobserve();
      expect(mut.isObserved()).toBe(false);
    });
  });

  describe("relay", () => {
    it("should create a relay store", () => {
      const mut = mutable(0);
      const rly = relay(mut);

      expect(mut.isObserved()).toBeTruthy();
      expect(rly.isObserved()).toBeFalsy();

      // Should relay the value
      const cb = jest.fn();
      const obn = rly.observe(cb);
      expect(obn.value).toBe(0);
      expect(rly.isObserved()).toBeTruthy();

      // Should relay the updates
      inc(mut);
      expect(cb).toHaveBeenLastCalledWith(1);
      inc(mut);
      expect(cb).toHaveBeenLastCalledWith(2);

      // Unobserve the relay
      obn.unobserve();
      expect(mut.isObserved()).toBeTruthy();
      expect(rly.isObserved()).toBeFalsy();

      rly.destroy();
      expect(mut.isObserved()).toBeFalsy();
    });
  });
});
