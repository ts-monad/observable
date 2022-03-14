import { fmap } from "../Functor";
import { store } from "../Store";
import { inc } from "./TestHelper";

describe("Functor", () => {
  describe("#fmap", () => {
    it("should work correctly as a Functor map", () => {
      const counter = store(0);
      const message = fmap((c: number) => `Current count is ${c}`)(counter);

      // Lazy observation
      expect(counter.isObserved()).toBe(false);

      // Convert the value correctly
      const cb = jest.fn();
      const ob1 = message.observe(cb);
      expect(ob1.value).toBe("Current count is 0");
      expect(counter.isObserved()).toBe(true);

      // Multiple observation
      const ob2 = message.observe(cb);
      expect(ob2.value).toBe("Current count is 0");

      // Notify on change
      inc(counter);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toBeCalledWith("Current count is 1");

      // Duplicated unobserve & cascaded unobserve
      ob1.unobserve();
      ob1.unobserve();
      ob2.unobserve();
      expect(counter.isObserved()).toBe(false);
    });
  });
});
