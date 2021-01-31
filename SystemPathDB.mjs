import fs from "fs";
import formatPath from "./modules/formatPath.mjs";
import joinObjects from "./modules/joinObjects.mjs";
import getValueFromObjectStructure from "./modules/getValueFromObjectStructure.mjs";
import addPredefinedFunctions from "./SystemPathDB.predefinedFunctions.mjs";
import addUserFunctions, {
  updateUsers,
} from "./SystemPathDB.userFunctions.mjs";
import errors from "./SystemPathDB.errors.mjs";

export default class SystemPathDB {
  lock = [];
  cache = {};
  userLock = [];
  userCache = {};
  database = { paths: [], structure: {} };
  functions = {
    dir: [],
    file: [],
    structure: [],
  };
  functionNames = { dir: [], file: [], structure: [] };
  constructor(folderLocation) {
    this.errors = errors;
    this.folderLocation = folderLocation.replace("\\", "/");
    if (this.folderLocation.endsWith("/")) {
      this.folderLocation = this.folderLocation.substring(
        0,
        folderLocation.length - 1
      );
    }
    addPredefinedFunctions.bind(this)();
    addUserFunctions.bind(this)();
    this.initialRun = true;
    this.update();
    this.initialRun = false;
  }
  update() {
    if (!this.upating) {
      this.updating = true;
      new Promise(
        function (resolve) {
          if (!this.skipUpdate) {
            this.database.paths = map(this.folderLocation);
            this.database.structure = obj.bind(this)(
              this.database.paths,
              this.functions,
              this.folderLocation
            );
          }
          resolve((this.updating = false));
        }.bind(this)
      ).then(() => this.updateCache().then(() => updateUsers.bind(this)()));
    }
  }
  updateCache() {
    if (!this.updatingCache) {
      this.updatingCache = true;
      return new Promise(async (resolve, reject) => {
        for (let path in this.cache) {
          while (this.lock.includes(path)) {
            await new Promise((resolve) => setTimeout(() => resolve(), 100));
          }
          fs.readFile(`${this.folderLocation}/${path}`, (err, data) => {
            if (err) {
              reject(err);
            } else {
              this.cache[path].data =
                typeof this.cache[path].extention === "string" &&
                this.cache[path].extention.toLowerCase() === "json"
                  ? JSON.parse(data.toString())
                  : data;
            }
          });
        }
        resolve((this.updatingCache = false));
      });
    }
  }
  monitor(interval = 100) {
    if (!this.isMonitoring) {
      this.isMonitoring = true;
      this.interval = setInterval(() => {
        this.update();
      }, interval);
    }
  }
  stopMonitoring() {
    clearInterval(this.interval);
    this.isMonitoring = false;
  }
  operationIsLocked(key) {
    return this.lock.includes[key];
  }
  get paths() {
    return this.database.paths;
  }
  get structure() {
    for (let { funcName, func } of this.functions.structure) {
      this.database.structure[funcName] = func.bind(this, {
        getDatabaseStructure: () => this.database.structure,
        path: "/",
        extention: null,
      });
    }
    return this.database.structure;
  }
  get(path) {
    return getValueFromObjectStructure(this.structure, path);
  }
  create(
    path,
    filename = null,
    filecontent = null,
    options = { force: false }
  ) {
    const { force } = arguments[arguments.length - 1];
    path = formatPath(path);
    const pathEntrys = path.split("/");
    let potentialPath = `${this.folderLocation}`;
    for (let i = 0; i < pathEntrys.length; i++) {
      potentialPath = `${potentialPath}/${pathEntrys[i]}`;
      if (fs.existsSync(potentialPath)) {
        if (fs.lstatSync(potentialPath).isFile()) {
          try {
            if (!force) {
              throw new Error(
                `Creating path: '${path}' has not succeeded, path: '${potentialPath.replace(
                  this.folderLocation,
                  ""
                )}' is a file.\nSet attribute force to true to override blocking chains.`
              );
            } else {
              fs.unlinkSync(potentialPath, (err) => {
                if (err) throw new Error(err);
              });
              fs.mkdirSync(potentialPath);
            }
          } catch (err) {
            console.error(err);
            return false;
          }
        }
        continue;
      } else {
        fs.mkdirSync(potentialPath);
      }
    }
    if (typeof filename === "string") {
      fs.writeFileSync(
        `${this.folderLocation}/${path}/${filename}`,
        typeof filecontent === "object" &&
          filecontent.constructor.name === "Object"
          ? ""
          : filecontent
      );
    }
    return true;
  }
  delete(path) {
    path = formatPath(path);
    const deleteFolderRecursive = (path) => {
      try {
        if (fs.existsSync(path)) {
          for (let file of fs.readdirSync(path)) {
            const curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
              // recurse
              deleteFolderRecursive(curPath);
            } else {
              // delete file
              fs.unlinkSync(curPath);
            }
          }
          fs.rmdirSync(path);
        }
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    };
    let isRegisteredPath = false;
    for (let registeredPath of this.paths) {
      if (registeredPath.startsWith(path)) {
        isRegisteredPath = true;
        break;
      }
    }
    if (isRegisteredPath) {
      if (!fs.existsSync(`${this.folderLocation}/${path}`)) {
        this.database.paths = this.paths.filter(
          (registeredPath) => registeredPath !== path
        );
        return true;
      }
      if (fs.lstatSync(`${this.folderLocation}/${path}`).isDirectory()) {
        return deleteFolderRecursive(`${this.folderLocation}/${path}`);
      }
    }
    if (fs.lstatSync(`${this.folderLocation}/${path}`).isFile()) {
      fs.unlinkSync(`${this.folderLocation}/${path}`);
      return true;
    }
    return false;
  }
  addStructureFunction(funcName, func) {
    if (this.functionNames.structure.includes(funcName)) {
      const functionIndex = this.functionNames.indexOf(funcName);
      if (functionIndex >= 0) {
        this.functionNames.structure.splice(functionIndex, 1);
        this.functions.structure.splice(functionIndex, 1);
      }
    }
    this.functionNames.structure.push(funcName);
    this.functions.structure.push({ funcName, func });
    this.update();
  }
  addDirFunction(funcName, func, target=()=>true) {
    if (!this.functionNames.dir.includes(funcName)) {
      this.functionNames.dir.push(funcName);
    }
    this.functions.dir.push({ target, funcName, func });
    this.update();
  }
  addFileFunction(funcName, func, target=()=>true) {
    if (!this.functionNames.file.includes(funcName)) {
      this.functionNames.file.push(funcName);
    }
    this.functions.file.push({ target, funcName, func });
    this.update();
  }
}
function map(source, initialSource = null) {
  if (initialSource === null) {
    initialSource = source;
  }
  let mapped = [];
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    if (files.length === 0) {
      mapped = [...mapped, `${source.replace(initialSource, "")}`];
    } else {
      files.forEach(function (file) {
        try {
          if (fs.lstatSync(`${source}/${file}`).isDirectory()) {
            mapped = [...mapped, ...map(`${source}/${file}`, initialSource)];
          } else {
            mapped = [
              ...mapped,
              `${source.replace(initialSource, "")}/${file}`,
            ];
          }
        } catch (err) {
          console.error(err);
        }
      });
    }
  } else if (fs.lstatSync(source).isFile()) {
    mapped.push(
      source.startsWith(initialSource + "/")
        ? source.replace(initialSource + "/", "")
        : source.replace(initialSource, "")
    );
  }
  return mapped;
}

function obj(mapped, functions, folderLocation) {
  let objectified = [];
  let obj = {};
  for (let path of mapped) {
    const objectifiedPath = objectify.bind(this)(
      path,
      functions,
      folderLocation
    );
    if (objectifiedPath) {
      objectified.push(objectifiedPath);
    }
  }
  for (let object of objectified) {
    obj = joinObjects(obj, object);
  }
  return obj;
}

function objectify(
  path,
  functions,
  folderLocation = undefined,
  currentPath = ""
) {
  path = formatPath(path);
  currentPath = formatPath(currentPath);
  let key = undefined;
  if (path.includes("/")) {
    key = path.substring(0, path.indexOf("/") + 1).replace("/", "");
  } else {
    key = path;
  }
  if (!fs.existsSync(`${folderLocation}/${currentPath}/${key}`)) {
    return;
  }
  let objectKey = `${key}`;
  let isHidden = false;
  let extention = undefined;
  if (objectKey.startsWith(".")) {
    isHidden = true;
    objectKey = objectKey.substring(1, objectKey.length);
  }
  if (
    objectKey.includes(".") &&
    fs.lstatSync(`${folderLocation}/${currentPath}/${key}`).isFile()
  ) {
    extention = objectKey.substring(
      objectKey.lastIndexOf(".") + 1,
      objectKey.length
    );
    objectKey = objectKey
      .substring(0, objectKey.lastIndexOf("."))
      .concat("_")
      .concat(
        objectKey.substring(objectKey.lastIndexOf(".") + 1, objectKey.length)
      );
  }
  const requestedFunctions = {};
  const objectifiedPath = {
    [objectKey]: {
      key: objectKey,
      path: !`${currentPath}/${key}`.startsWith("/")
        ? `/${currentPath}/${key}`
        : `${currentPath}/${key}`,
      isHidden,
      extention,
      ...(key === path
        ? {}
        : (() => {
            const objectifiedPath = objectify.bind(this)(
              path.substring(path.indexOf("/") + 1, path.length),
              functions,
              folderLocation,
              `${currentPath}/${key}`
            );
            return objectifiedPath ? objectifiedPath : {};
          })()),
    },
  };
  if (typeof functions === "object" && typeof folderLocation === "string") {
    if (fs.lstatSync(`${folderLocation}/${currentPath}/${key}`).isDirectory()) {
      for (let i = 0; i < functions.dir.length; i++) {
        let { target, funcName, func } = functions.dir[i];
        if (typeof target === "function" && target(`${currentPath}/${key}`)
        ) {
          requestedFunctions[funcName] = func.bind(this, {
            ...objectifiedPath[objectKey],
            getDatabaseStructure: () => this.get(`${currentPath}/${key}`),
          });
        }
      }
    } else if (
      fs.lstatSync(`${folderLocation}/${currentPath}/${key}`).isFile()
    ) {
      for (let i = 0; i < functions.file.length; i++) {
        let { target, funcName, func } = functions.file[i];
        if (typeof target === "function" && target(`${currentPath}/${key}`) {
          requestedFunctions[funcName] = func.bind(this, {
            ...objectifiedPath[objectKey],
            getDatabaseStructure: () => this.get(`${currentPath}/${key}`),
          });
        }
      }
    }
  }
  objectifiedPath[objectKey] = {
    ...objectifiedPath[objectKey],
    ...requestedFunctions,
  };
  return objectifiedPath;
}
