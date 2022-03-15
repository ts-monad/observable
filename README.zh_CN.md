[[English](./README.md)]

# Observable Monad

[![build status](https://github.com/ts-monad/observable/actions/workflows/node.js.yml/badge.svg)](https://github.com/ts-monad/observable/actions/workflows/node.js.yml)
[![npm](https://img.shields.io/npm/v/@ts-monad/observable)](https://www.npmjs.com/package/@ts-monad/observable)
[![Coverage Status](https://coveralls.io/repos/github/ts-monad/observable/badge.svg?branch=master)](https://coveralls.io/github/ts-monad/observable?branch=master)

## Observable

`UI = F(state)` 是现代前端应用的基本范式。然而，这个公式中的 `state` 并不是一个静态的数据，而是随着时间不断变化的。为了表达变化的数据，我们引入一个 `Observable` 的泛型，`Observable<T>` 就是代表一个持续变化的类型为 `T` 的对象。标定 `UI = F(state)` 的类型，就是 `UI: Observable<DOM> = F(state: Observable<S>)`。

一个常见的误解是 `Observable` 是多次返回的 `Promise`，或者 `EventEmitter`。`Observable` 与它们有一个根本区别，就是 `Observable` 是始终有值的，而 `Promise` 和 `EventEmitter` 只蕴含了未来的值。当我们在讨论应用的状态时，“数据获取中”也是一种状态。`UI` 要实时向用户呈现，于是 `state` 也要实时存在。

对于任何一个 `ob: Observable<T>` 对象，我们可以随时调用 `ob.observe(callback)` 获取当前值，同时通过 `callback` 回调，感知其未来的变化。

## Monad

实现层面上，`Observable` 是带一个参数的泛型，它表示了一种类型间的映射。任意数据类型 `T`，就存在一个对应的 `Observable<T>`。这种映射具有以下特性。

### `Functor` 与 `fmap` 高阶函数

任意给一个从类型 `S` 到类型 `T` 的函数 `f`，可以得到一个从类型 `Observable<S>` 到类型 `Observable<T>` 的函数 `fmap(f)`。即 `fmap` 可以将任何一个一元函数升格为对应的 `Observable` 类型的函数。`fmap` 的函数签名 `<S, T>(f: (s: S) => T) => (obS: Observable<S>) => Observable<T>`。
对于一个类型映射，如果实现了对应的 `fmap` 函数，我们称之为 `Functor`。显然 `Observable` 是一个 `Functor`。

> `Array` 也是一个常见的 `Functor`，任意类型 `T` 可以映射到 `T[]`，而对应的 `fmap` 方法其实就是
>
> ```typescript
> const fmap =
>   <S, T>(f: (s: S) => T) =>
>   (arr: S[]): T[] =>
>     arr.map(x => f(x));
> ```

### `Applicative` 与 `lift` 高阶函数

`fmap` 可以升格一元函数，但对于多元函数就无能为力了。能升格多元函数的 `Functor`，被称为 `Applicative Functor`，简称 `Applicative`。在 TypeScript 里，我们需要引入一个新的高阶函数 `lift`。`lift` 可以理解为一个更强大的 `fmap`，它的签名为 `<R, T>(f: (r: R) =>T) => (obR: { [K in keyof R]: Observable<R[K]> }) => Observable<T>`。

关于零元函数（也就是常函数）的升格，我们通常会用一个更简单的函数 `pure`，它的签名为 `<T>(t: T) => Observable<T>`。

> `Array` 同时也是 `Applicative`，对应 `pure` 的实现比较简单
>
> ```typescript
> const pure = <T>(t: T) => [t];
> ```
>
> 而 `Array` 的 `lift`，是各个属性所有取值的组合。实现相对复杂，不在此冗述了。

### `Monad` 与 `bind` 高阶函数

`Applicative` 可以将任何函数升格，但如果要升格的函数返回值就是一个 `Observable<T>` 呢？例如给你一个股票代码，返回它的价格，我们可能会有函数：

```typescript
const stockPrice = (symbol: string): Observable<number> => {
  // some implementatiion
};
```

假如我们关注的股票也会随着用户的操作而改变（`Mutable` 是一类用户可以主动修改的 `Observable`）

```typescript
const watchingStockSymbol: Mutable<string> = mutable("MSFT");
```

我们是否有办法对 `stockPrice` 升格得到 `stockPriceM`，使得 `stockPriceM(watchingStockSymbol)` 实时反映用户关注的股票的价格呢？`fmap` 显然不行，因为 `fmap(stockPrice)` 的返回值类型是 `Observable<Observable<T>>`。
这时我们需要的是一个签名为 `<S, T>(f: (s: S) => Observable<T>) => (obS: Observable<S>) => Observable<T>` 的高阶函数，通常称为 `bind`。而拥有 `bind` 函数的 `Functor`，被称为 `Monad`。

> `Array` 也是一个 `Monad`，对应的 `bind` 实现为
>
> ```typescript
> const bind =
>   <S, T>(f: (s: S) => T[]) =>
>   (arrS: S[]): T[] =>
>     [].concat(...arrS.map(s => f(s)));
> ```

### Observable 作为 Monad 的意义

`Observable` 是一个 `Monad`（当然，同时也是 `Applicative`，`Functor`），意味着我们可以方便的对 `Observable` 进行自由的转换与组合，从而构造出复杂的数据模型。还是股票价格的例子，如果我们有了获取股票价格的函数 `stockPrice: (symbol: string) => Observable<number>`，以及用户关注的股票代码 `watchingStockSymbol: Observable<string>`，我们可以轻易获得一个用户关注的股票价格的 `Observable`，即

```typescript
const watchingStockPrice = bind(stockPrice)(watchingStockSymbol);
```

倘若我们有一个 `render`，根据 `{ stockSymbol: string; stockPrice: number }` 生成一段 HTML，那么这段 HTML 的 `Observable` 就是

```typescript
const html = lift(render)({
  stockSymbol: watchingStockSymbol,
  stockPrice: bind(stockPrice)(watchingStockSymbol),
});
```

接下来，我们可以轻易的将其绘制在页面上

```typescript
const divStockInfo = document.getElementById("stock-info");
const { value } = html.observe(newHtml => {
  divStockInfo.innerHTML = newHtml;
});
divStockInfo.innerHTML = value;
```

## API

### 类型 `Observable<T>`

### 类型 `Store<T>`

### `Observable<T>#observe(observer: (value: T) => void): { value: T, unobserve: () => void }`

注册关注一个 `Observable` 对象。

入参是一个回调函数，用于接收后续的更新。

返回一个 `Observation<T>` 类型的对象。其中 `value` 为 `Observable` 的当前值；`unobserve` 为一个回调函数用来需取消关注。

### `Observable<T>#isObserved(): boolean`

判断一个 `Observable` 对象是否被任何 `Observer` 关注。

### `Mutable<T>#update(transition: (value: T) => T): T`

修改一个 `Mutable` 对象。

入参是一个 `Transition<T>` 类型的函数，接受 `Mutable<T>` 的当前值，返回新值。

`update` 的返回值是 `Mutable<T>` 对象的新值。

> 注意，如果 `update` 前后，`Mutable` 对象的值没有发生变化，关注该对象的 `observer` 不会被通知。

### `observable<T>(setup: ObservableSetup<T>): Observable<T>`

创建一个值类型 `T` 的 `Observable` 对象。

示例，创建一个初始为 0 每 10 秒自加 1 的计数器。

```typescript
const counter = observable(update => {
  const interval = setInterval(() => update(i => i + 1), 10000);
  return { value: 0, unobserve: () => clearInterval(interval) };
});
```

`observable` 接受一个 `setup` 回调函数，用来启动 `Observable`。

这个函数的输入是一个 `update` 函数，每当 `Observable` 的值发生改变时，调用 `update` 函数进行更新。`update` 函数的参数也是一个函数，接受 `Observable` 的当前值，返回新值。

`setup` 函数返回一个对象，其中 `state` 属性表示 `Observable` 对象的初始值；`unobserve` 属性是一个回调，通知该 `Observable` 已经无人关注，可以做一些清理。

#### 惰性求值

值得关注的是，`Observable` 采用了惰性求值的设计模式。`setup` 与 `unobserve` 虽然成对出现，但它们并不是 `constructor` 和 `finalize`，因为它们可能被多次调用。`setup` 在 `Observable` 被首次关注时，以及之后 `unobserve` 之后再次被关注时调用。而每次 `setup` 返回的 `unobserve` 会在最后一个观察者注销时被调用。上面 `counter` 的例子中，这个计数器实际上是会“停表”的，无人观察时，`counter` 就不再计数了。如果我们要实现一个不停表的 `counter`，代码逻辑如下

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

惰性求值虽然让我们的 `counter` 逻辑变得复杂，但却可以大幅提升前端应用的性能。当一个变化的数据不再被需要（显示在 UI 上，或者用于某些后台计算）时，我们应该停止对它的计算。

### `mutable<T>(initialValue: T): Mutable<T>`

创建一个值类型为 `T` 的 `Mutable` 对象。

入参 `initialValue` 为该对象的初始值。

### `fmap<S, T>(f: (s: S) => T) => (obS: Observable<S>) => Observable<T>`

`Observable` 作为 `Functor` 的 `fmap` 函数。

将输入的函数 `f: (s: S) => T`。升格为 `Observable` 的函数。

### `zip<R>(obR: { [K in keyof R]: Observable<R[K]> }) => Observable<R>`

实现 `lift` 的一个辅助函数。

将值为 `Observable` 的对象，映射为具有相同结构的对象的 `Observable` 类型。

### `lift<R, T>(f: (r: R) => T) => (obR: { [K in keyof R]: Observable<R[K]> }) => Observable<T>`

`Observable` 作为 `Applicative` 的 `lift` 函数。

将一个接收结构化参数的多元函数升格为对应的 `Observable` 的函数。

### `pure<T>(value: T): Observable<T>`

`Observable` 作为 `Applicative` 的 `pure` 函数。

返回一个定值 `Observable` 对象。

### `bind<S, T>(f: (s: S) => Observable<T>) => (obS: Observable<S>) => Observable<T>`

`Observable` 作为 `Monad` 的 `bind` 函数。

将输入的函数 `f: (s: S) => Observable<T>`。升格为 `Observable` 的函数。
