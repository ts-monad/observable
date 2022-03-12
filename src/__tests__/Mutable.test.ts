import { mutable } from "../Mutable";
import { inc } from "./TestHelper";

describe("Mutable", () => {
  it("should create a mutable observable object", () => {
    const unobserve = jest.fn();
    const mut = mutable({ state: 0, unobserve });

    // Update without observers
    expect(mut.update(inc)).toBe(1);

    // Observe
    const cb = jest.fn();
    const obn = mut.observe(cb);
    expect(obn.state).toBe(1);

    // Notify the change
    expect(mut.update(inc)).toBe(2);
    expect(cb).toBeCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith(2);

    // Cascaded unobserve
    obn.unobserve();
    expect(unobserve).toBeCalled();
  });
});
