import formatPath from "./formatPath.mjs";

/**
 * @param {Object} structure a json object that contains a structure.
 * @param {String} path the path that has to be found inside of the structure.
 * @return {Object || undefined} returns the objects value from within the structure of the matching path or undefined if object is not found.
 */
export default function getValueFromObjectStructure(structure, path) {
  path = formatPath(path);
  const [key, ...otherKeys] = path.split("/");
  if (structure[key] === undefined) {
    return undefined;
  } else if (otherKeys.length >= 1) {
    return getValueFromObjectStructure(structure[key], otherKeys.join("/"));
  } else {
    return structure[key];
  }
}
