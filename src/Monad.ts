import { Observable, observable } from "./Observable";

export const bind =
  <S, T>(f: (src: S) => Observable<T>) =>
  (obSrc: Observable<S>): Observable<T> =>
    observable((observer) => {
      let unobserveTar = () => {};
      const setSrc = (src: S) => {
        const obnTar = f(src).observe(observer);
        unobserveTar();
        unobserveTar = obnTar.unobserve;
        return obnTar.value;
      };
      const obnSrc = obSrc.observe((src) => observer(setSrc(src)));
      const value = setSrc(obnSrc.value);
      return {
        value,
        unobserve: () => {
          unobserveTar();
          obnSrc.unobserve();
        },
      };
    });
