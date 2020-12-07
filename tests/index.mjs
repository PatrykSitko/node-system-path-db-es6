import SystemPathDB from "../SystemPathDB.mjs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const testStructureLocation = `${dirname(
  fileURLToPath(import.meta.url)
)}/structure`;

const systemPathDb = new SystemPathDB(testStructureLocation);
systemPathDb.update();

console.log(systemPathDb.structure);
