# 型の重さ

同じ API を 3 つの形で書いて、`tsc --extendedDiagnostics`（TypeScript 7.0.2）で比べる。
1 リソース 5 本（一覧・登録・1 件・変更・削除、param と json の validator、200・201・204・404）。
クライアントのファイルで `hc<AppType>` から最初と最後のリソースを呼び、型が any に崩れていないことも確かめる。

```
pnpm tsx bench/make.ts 10 20 40 80 160
node_modules/.bin/tsc -p bench/out/<形>-<リソース数> --extendedDiagnostics
```

- chain: `new Hono().get(...).post(...)...` 1 本
- routed: リソースごとのチェーンを `.route()` でまとめる（Hono の docs のすすめ、hono-kit もこの形）
- flat: ファイルごとの `createHandlers` を `Endpoint<...> &` で並べる（src/lib/route-types.ts）

## 2026-10-21（Check time は 3 回の中央値）

| 本数 | 形 | Types | Instantiations | Memory | Check time |
|---:|---|---:|---:|---:|---:|
| 50 | chain | 127,234 | 331,867 | 87 MB | 0.078s |
| 50 | routed | 187,692 | 520,775 | 114 MB | 0.083s |
| 50 | flat | 105,655 | 322,805 | 85 MB | 0.073s |
| 100 | chain | 188,584 | 588,607 | 115 MB | 0.130s |
| 100 | routed | 251,935 | 737,467 | 146 MB | 0.123s |
| 100 | flat | 122,710 | 492,760 | 106 MB | 0.108s |
| 200 | chain | 311,284 | 1,315,087 | 172 MB | 0.264s |
| 200 | routed | 385,020 | 1,225,917 | 210 MB | 0.227s |
| 200 | flat | 156,820 | 832,670 | 146 MB | 0.186s |
| 400 | chain | 556,684 | 3,620,047 | 287 MB | 0.693s |
| 400 | routed | 651,190 | 2,378,017 | 338 MB | 0.456s |
| 400 | flat | 225,040 | 1,512,490 | 231 MB | 0.377s |
| 800 | chain | 1,047,484 | 11,637,967 | 522 MB | 2.087s |
| 800 | routed | 1,183,530 | 5,383,017 | 596 MB | 1.099s |
| 800 | flat | 361,480 | 2,872,130 | 398 MB | 0.890s |
