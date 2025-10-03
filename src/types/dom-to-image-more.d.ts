declare module 'dom-to-image-more' {
  interface Options {
    width?: number
    height?: number
    quality?: number
    bgcolor?: string
    style?: Record<string, any>
    filter?: (node: any) => boolean
    imagePlaceholder?: string
    cacheBust?: boolean
  }

  interface DomToImage {
    toPng(node: HTMLElement, options?: Options): Promise<string>
    toJpeg(node: HTMLElement, options?: Options): Promise<string>
    toBlob(node: HTMLElement, options?: Options): Promise<Blob>
    toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>
    toSvg(node: HTMLElement, options?: Options): Promise<string>
  }

  const domtoimage: DomToImage
  export default domtoimage
}
