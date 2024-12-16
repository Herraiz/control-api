export default function readFS(stream: {
  readonly on: (
    arg0: string,
    arg1: (data: Uint8Array) => number,
  ) => { readonly on: (arg0: string, arg1: () => void) => void };
}) {
  const chunkList: Uint8Array[] = [];
  return new Promise<Buffer>((resolve) => {
    stream
      .on("data", (data) => chunkList.push(data))
      .on("end", () => resolve(Buffer.concat(chunkList)));
  });
}
