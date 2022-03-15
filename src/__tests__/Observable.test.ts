import { Observable, observable, Observer } from "../Observable";

describe("Observable", () => {
  const unobserve = jest.fn();
  const setup = jest.fn((up: Observer<number>) => {
    update = val => {
      value = val;
      up(val);
    };
    return { value, unobserve };
  });

  let value: number;
  let update: Observer<number>;
  let counter: Observable<number>;
  beforeEach(() => {
    unobserve.mockClear();
    setup.mockClear();
    value = 0;
    counter = observable(setup);
  });

  it("should create an observable object", () => {
    // Lazy initialization
    expect(setup).not.toBeCalled();
    expect(counter.isObserved()).toBe(false);

    // Observe
    const cb1 = jest.fn();
    const ob1 = counter.observe(cb1);
    expect(ob1.value).toBe(0);
    expect(setup).toBeCalled();
    expect(counter.isObserved()).toBe(true);

    // Notify the changes
    update(1);
    expect(cb1).toBeCalledTimes(1);
    expect(cb1).toBeCalledWith(1);

    // Cascaded unobserve
    ob1.unobserve();
    expect(unobserve).toBeCalledTimes(1);
    expect(counter.isObserved()).toBe(false);

    // Re-observe
    const cb2 = jest.fn();
    const ob2 = counter.observe(cb2);
    expect(ob2.value).toBe(1);
    expect(counter.isObserved()).toBe(true);

    update(2);
    expect(cb1).toBeCalledTimes(1);
    expect(cb2).toBeCalledTimes(1);
    expect(cb2).toBeCalledWith(2);

    // No notification when update without change
    update(2);
    expect(cb2).toBeCalledTimes(1);

    // Cascaded unobserve
    ob2.unobserve();
    expect(unobserve).toBeCalledTimes(2);
    expect(counter.isObserved()).toBe(false);
  });

  it("should allow multiple observation", () => {
    const cb = jest.fn();
    const ob1 = counter.observe(cb);
    const ob2 = counter.observe(cb);

    // Notify the changes
    update(1);
    expect(cb).toBeCalledTimes(2);
    expect(cb).toBeCalledWith(1);

    // No unobserve while there're observers
    ob1.unobserve();
    expect(unobserve).not.toBeCalled();
    expect(counter.isObserved()).toBe(true);

    // Duplicated unobserve does nothing
    ob1.unobserve();
    expect(unobserve).not.toBeCalled();
    expect(counter.isObserved()).toBe(true);

    // Unobserve when all observers are removed
    ob2.unobserve();
    expect(unobserve).toBeCalledTimes(1);
    expect(counter.isObserved()).toBe(false);
  });
});
