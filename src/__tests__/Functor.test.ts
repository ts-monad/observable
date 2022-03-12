import { fmap } from "../Functor";
import { mutable } from "../Mutable";
import { inc } from "./TestHelper";

describe("Functor", () => {
  describe("#fmap", () => {
    it("should work correctly as a Functor map", () => {
      const unobserve = jest.fn();
      const counter = mutable({ state: 0, unobserve });
      const message = fmap((c: number) => `Current count is ${c}`)(counter);
      const cb = jest.fn();

      // Convert the value correctly
      const ob1 = message.observe(cb);
      expect(ob1.state).toBe("Current count is 0");

      // Multiple observation
      const ob2 = message.observe(cb);
      expect(ob2.state).toBe("Current count is 0");

      // Notify on change
      counter.update(inc);
      expect(cb).toBeCalledTimes(2);
      expect(cb).toBeCalledWith("Current count is 1");

      // Duplicated unobserve & cascaded unobserve
      ob1.unobserve();
      ob1.unobserve();
      ob2.unobserve();
      expect(unobserve).toBeCalledTimes(1);
    });
  });
});
