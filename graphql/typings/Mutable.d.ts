// eslint-disable-next-line functional/prefer-readonly-type
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
