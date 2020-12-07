/** Joins two objects of type Object.
 * @param {Object} obj1 obj2 will get joined to this object copy.
 * All key value pairs of object 1 will get replaced with object 2 key value pairs if there is a matching key at the same Object scope.
 * @param {Object} obj2 This object will get joined to obj1 copy and replace all matching key value pairs with it's value pairs.
 * @return {Object} returns a copy of obj1 with the joined obj2 key value pairs.
 */
export default function joinObjects(obj1, obj2) {
  let finalObject = { ...obj1 };
  for (let key in obj2) {
    if (typeof finalObject[key] !== "object") {
      finalObject[key] = {};
    }
    if (typeof obj2[key] === "object") {
      finalObject[key] = joinObjects(finalObject[key], obj2[key]);
    } else {
      finalObject[key] = obj2[key];
    }
  }
  return finalObject;
}
