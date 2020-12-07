/**
 * @param {String} path accepts a string and formats it to the right path structure.
 * @returns {String} returns a validly formatted path.
 */
export default function checkPath(path) {
  let pathCopy = `${path}`;
  do {
    pathCopy = pathCopy.replace("\\", "/");
  } while (pathCopy.includes("\\"));
  if (pathCopy.startsWith("/")) {
    pathCopy = pathCopy.substring(1, pathCopy.length);
  }
  if (pathCopy.endsWith("/")) {
    pathCopy = pathCopy.substring(0, pathCopy.length - 1);
  }
  return pathCopy;
}
