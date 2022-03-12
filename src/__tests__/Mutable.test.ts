import { mutable } from "../Mutable";
import { inc } from "./TestHelper";

describe("Mutable", () => {
  it("should create a mutable observable object", () => {
    const mut = mutable(0);

    // Update without observers
    expect(mut.update(inc)).toBe(1);
    expect(mut.isObserved()).toBe(false);

    // First observe
    const cb1 = jest.fn();
    const obn1 = mut.observe(cb1);
    expect(obn1.state).toBe(1);
    expect(mut.isObserved()).toBe(true);

    // Notify the change
    expect(mut.update(inc)).toBe(2);
    expect(cb1).toBeCalledTimes(1);
    expect(cb1).toHaveBeenLastCalledWith(2);

    // Cascaded unobserve
    obn1.unobserve();
    expect(mut.isObserved()).toBe(false);

    // Second observation
    const cb2 = jest.fn();
    const obn2 = mut.observe(cb2);
    expect(obn2.state).toBe(2);
    expect(mut.isObserved()).toBe(true);

    // Cascaded unobserve
    obn2.unobserve();
    expect(mut.isObserved()).toBe(false);
  });
});
