import { store } from "../Store";
import { inc } from "./TestHelper";

describe("Store", () => {
  it("should create a store object", () => {
    const sto = store(0);

    // Update without observers
    expect(inc(sto)).toBe(1);
    expect(sto.isObserved()).toBe(false);

    // First observe
    const cb1 = jest.fn();
    const obn1 = sto.observe(cb1);
    expect(obn1.value).toBe(1);
    expect(sto.get()).toBe(1);
    expect(sto.isObserved()).toBe(true);

    // Notify the change
    expect(inc(sto)).toBe(2);
    expect(sto.get()).toBe(2);
    expect(cb1).toBeCalledTimes(1);
    expect(cb1).toHaveBeenLastCalledWith(2);

    // Cascaded unobserve
    obn1.unobserve();
    expect(sto.isObserved()).toBe(false);

    // Second observation
    const cb2 = jest.fn();
    const obn2 = sto.observe(cb2);
    expect(obn2.value).toBe(2);
    expect(sto.isObserved()).toBe(true);

    // Cascaded unobserve
    obn2.unobserve();
    expect(sto.isObserved()).toBe(false);
  });
});
