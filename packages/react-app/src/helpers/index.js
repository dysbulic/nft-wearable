export { default as Transactor } from "./Transactor";

export const httpURL = (uri) => {
  const match = uri.match(/^(ip[nf]s):\/\/(.+)$/)
  if(!match) {
    return uri
  } else {
    return `https://ipfs.io/${match[1]}/${match[2]}`
  }
}
