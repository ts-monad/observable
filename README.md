[[中文](./README.zh_CN.md)]

# Observable Monad

[![build status](https://github.com/ts-monad/observable/actions/workflows/node.js.yml/badge.svg)](https://github.com/ts-monad/observable/actions/workflows/node.js.yml)
[![npm](https://img.shields.io/npm/v/@ts-monad/observable)](https://www.npmjs.com/package/@ts-monad/observable)
[![Coverage Status](https://coveralls.io/repos/github/ts-monad/observable/badge.svg?branch=master)](https://coveralls.io/github/ts-monad/observable?branch=master)

## Observable

The formula `UI = F(state)` is a well known paradigm in modern frontend development. However, the `state` here is not a piece of static data, but chunk of data varies over time. In order to represent the dynamics of `state`, we introduced the generic type `Observable`, where `Observable<T>` means an variable object with value type `T`. Therefore, we can annotate the original formula with types as `UI: Observable<DOM> = F(state: Observable<S>)`.

A common misunderstanding is that the `Observable` is an extension of `Promise` which can resolve multiple times, or it's a synonym of `EventEmitter`. Indeed, there's a fundamental difference. Both `Promise` and `EventEmitter` represent future values, while `Observable` always has a current value. The `Observable` is a better concept for App state modeling, because wen a Web App is running, it has to constantly update the UI, even before the server side data is arrived. Even "fetching" is a valid state. Instead of thinking about the "future" states, it's easier to focus on the present.

As we have a `on: Observable<T>` object, we could call `ob.observe(callback)` to get its current value, and catch the future changes with the `callback` function.

## Monad

The `TypeScript` implementation of `Observable` is a uniparametric generic type. It represents a mapping from any type `T` to a `Observable<T>`. It also has the following charateristics.

### `Functor` and the `fmap` HOF (Higher Order Function)

For any unary function from type `S` to type `T`, there's a corresponding function from `Observable<S>` to `Observable<T>`, say `fmap(f)`. The `fmap` here is a Higher Order Functions maps a function to its `Observable` version. It's type is `<S, T>(f: (s: S) => T) => (obS: Observable<S>) => Observable<T>`.

A type mapping with a `fmap` HOF is called a `Functor`. Apparently, `Observable` is a `Functor`.

> `Array` is another well-known `Functor`, mapping type `T` to `T[]`. The `fmap` for `Array` looks like this
>
> ```typescript
> const fmap =
>   <S, T>(f: (s: S) => T) =>
>   (arr: S[]): T[] =>
>     arr.map(x => f(x));
> ```

### `Applicative` and the `lift` HOF

The `fmap` HOF can lift a unary function to its `Observable` version, but it doesn't work on functions with more than one parameters. A `Functor` that can have muli-parameter functions lifted are called `Applicative Functor`, or `Applicative` in short. A TypeScript implementation of `Applicative` requires a `lift` HOF as a more powerful `fmap`. It's type is `<R, T>(f: (r: R) =>T) => (obR: { [K in keyof R]: Observable<R[K]> }) => Observable<T>`.

For the 0-parameter functions or constant functions, they're usually lifted with a simpler HOF `pure`, whose type is `<T>(t: T) => Observable<T>`.

> `Array` is an `Applicative` as well. It has a simple `pure` HOF
>
> ```typescript
> const pure = <T>(t: T) => [t];
> ```
>
> The `lift` HOF of `Array` is a little complicated, I'm not going to put it here. The general idea is to return the combinations of all possible property values.

### `Monad` and the `bind` HOF

With an `Applicative`, we can lift any functions. Then, how about the functions returning an `Observable`? For example, we have a function to get the changing price of a stock from its symbol

```typescript
const stockPrice = (symbol: string): Observable<number> => {
  // some implementatiion
};
```

Then we want to make the stock symbol to be `Mutable` (`Mutable` is a kind of `Observable` people can change proactively).

```typescript
const watchingStockSymbol: Mutable<string> = mutable("MSFT");
```

Is there a way that we can lift the `stockPrice` to some `stockPriceM` so that `stockPriceM(watchingStockSymbol)` shows the realtime price of the selected stock? Obviously `fmap` is not for this case, because `fmap(stockPrice)` would return a `Observable<Observable<T>>` object.

We need an HOF typed `<S, T>(f: (s: S) => Observable<T>) => (obS: Observable<S>) => Observable<T>`. The function is called `bind` in Functional Programming. An `Applicative Functor` with a `bind` HOF is called `Monad`.

> `Array` is a `Monad` as well, whose `bind` HOF would be something like this
>
> ```typescript
> const bind =
>   <S, T>(f: (s: S) => T[]) =>
>   (arrS: S[]): T[] =>
>     [].concat(...arrS.map(s => f(s)));
> ```

### How Monad helps

The `Observable` is a `Monad` (of course `Applicative` and `Functor` as well). This means we can easily transform and compose `Observable`s to build complex data models. Let's continue with the stock price example. Say we have the function to get stock prices, `stockPrice: (symbol: string) => Observable<number>`, and the symbol of the user watching stock, `watchingStockSymbol: Observable<string>`. We can get the price of the watching stock as an `Observable` by

```typescript
const watchingStockPrice = bind(stockPrice)(watchingStockSymbol);
```

If we hava `render` function to turn `{ stockSymbol: string; stockPrice: number }` into a piece of HTML, then the `Observable` of the HTML is

```typescript
const html = lift(render)({
  stockSymbol: watchingStockSymbol,
  stockPrice: bind(stockPrice)(watchingStockSymbol),
});
```

Next step, we can mount the HTML into the Web Page, and keep it up to date

```typescript
const divStockInfo = document.getElementById("stock-info");
const { value } = html.observe(newHtml => {
  divStockInfo.innerHTML = newHtml;
});
divStockInfo.innerHTML = value;
```

## API

### `Observable<T>#observe(observer: (value: T) => void): { value: T, unobserve: () => void }`

Observe an `Observable` object.

The parameter is a callback for the future updates.

It returns a `Observation<T>` object, with property `value` being the current value, and property `unobserve` a callback to stop observation.

### `Observable<T>#isObserved(): boolean`

Check if the `Observable` object is observed by any `Observer`.

### `Mutable<T>#update(transition: (value: T) => T): T`

Update a `Mutable` object.

The parameter is a `Transition<T>` function, which takes the current value and returns the new value.

The return value of `update` is the new value of the `Mutable<T>` object.

> Note, if the value is not changed, `update` won't trigger notifications to the observers.

### `observable<T>(setup: ObservableSetup<T>): Observable<T>`

Create an `Observable` object with value type `T`.

Example, a counter count by 1 every 10 seconds, start from 0.

```typescript
const counter = observable(update => {
  const interval = setInterval(() => update(i => i + 1), 10000);
  return { value: 0, unobserve: () => clearInterval(interval) };
});
```

The parameter of `observable` is a `setup` function to start the `Observable`.

The parameter of the `setup` function is an `update` function. We call it to notify the `Observable` about the new values. It's similar to the `update` function of `mutable`, which takes `Transition` callback, reading the current value and returning the new value.

The `setup` function returns an `Observation<T>` object similar to `Observation#observe`. It's `state` property represents the initial value of the `Observable`, while the `unobserve` property is a callback called when there's no one observing the `Observable` object, so that we can do some clean up work.

#### Lazy evaluation

One thing requires special attention is that the `Observable` is lazy evaluated. The `setup` and `unobserve` is different from `constructor` and `finalize`. They can be called multiple times.

The `setup` function is called when the `Observable` is observed for the first time, or being observed again after the `unobserve` call. The `unobserve` callback returned by `setup` is called after the last observer is unregistered.

The `counter` in the above example is a "lazy counter". It pauses when there's no one observing, and resumes when someone observes again. If we need a "diligent counter", the code would be like this

```typescript
const timestamp = Date.now();
const counter = observable(update => {
  const now = Date.now();
  const value = Math.floor((now - timestamp) / 10);
  const callback = () => {
    update(i => i + 1);
    timeout = setTimeout(callback, 10000);
  };
  let timeout = setTimeout(callback, (value + 1) * 10000 - now);
  return {
    value: (Date.now() - timestamp) / 10,
    unobserve: () => clearTimeout(timeout),
  };
});
```

The lazy evaluation makes our `counter` more complicated, but for most time it can save us CPU cycles. When a value is no longer used (not on the screen or used in background computing), we should stop wasting CPU time on it.

### `mutable<T>(initialValue: T): Mutable<T>`

Create a `Mutable` object with value type `T`.

The parameter `initialValue` is its initial value.

### `fmap<S, T>(f: (s: S) => T) => (obS: Observable<S>) => Observable<T>`

The `fmap` HOF for `Observable` as a `Functor`.

It lifts the input function `f: (s: S) => T` to its `Observable` version.

### `zip<R>(obR: { [K in keyof R]: Observable<R[K]> }) => Observable<R>`

A helper function to implement `lift`.

It takes a record with values being `Observable`, return an `Observable` with record value type.

### `lift<R, T>(f: (r: R) => T) => (obR: { [K in keyof R]: Observable<R[K]> }) => Observable<T>`

The `lift` HOF for `Observable` as an `Applicative`.

It lifts a multi-parameter function (with structural parameters) to its `Observable` version.

### `pure<T>(value: T): Observable<T>`

The `pure` HOF for `Observable` as an `Applicative`.

It returns an `Observable` with constant value.

### `bind<S, T>(f: (s: S) => Observable<T>) => (obS: Observable<S>) => Observable<T>`

The `bind` HOF for `Observable` as a `Monad`.

It lifts the input function `f: (s: S) => Observable<T>` to its `Observable` version.
