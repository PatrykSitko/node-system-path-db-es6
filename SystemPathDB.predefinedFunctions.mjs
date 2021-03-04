import fs from "fs";
/** Has access to the this keyword of the SystemPathDB class.
 * This function gets invoced inside of the SystemPathDB constructor.
 */
export default function SystemPathDBPredefinedFunctions() {
  this.skipUpdate = true;
  this.addStructureFunction("list", ({ getDatabaseStructure }) => {
    const copy = { ...getDatabaseStructure() };
    delete copy.extention;
    delete copy.path;
    this.functionNames.structure.forEach((funcName) => {
      delete copy[funcName];
    });
    return Object.keys(copy);
  });
  this.addStructureFunction("includes", ({ getDatabaseStructure }, key) =>
    getDatabaseStructure().list().includes(key)
  );
  this.addStructureFunction("getAbsolutePath", () => {
    let absolutePath = `${this.folderLocation}`;
    do {
      absolutePath = absolutePath.replace("\\", "/");
    } while (absolutePath.includes("\\"));
    return absolutePath;
  });
  this.addStructureFunction("new", function ({}, name, content = null) {
    return new Promise((resolve, reject) => {
      const lockKey = `/${name}`;
      const location = `${this.folderLocation}/${name}`;
      if (!this.lock.includes(lockKey)) {
        this.lock.push(lockKey);
        if (typeof content === "string" || content) {
          fs.writeFile(`${this.folderLocation}/${name}`, content, (err) => {
            this.lock.splice(this.lock.indexOf(location), 1);
            err ? reject(err) : resolve(this.update());
          });
        } else {
          fs.mkdir(`${this.folderLocation}/${name}`, (err) => {
            this.lock.splice(this.lock.indexOf(location), 1);
            err ? reject(err) : resolve(this.update());
          });
        }
      } else {
        reject({
          type: this.errors.OPERATION_LOCKED,
          message: "Already creating a new object at given location.",
          lock: { key: lockKey },
        });
      }
    });
  });
  this.addDirFunction("getAbsolutePath", ({ path }) => {
    let absolutePath = `${this.folderLocation}${path}`;
    do {
      absolutePath = absolutePath.replace("\\", "/");
    } while (absolutePath.includes("\\"));
    return absolutePath;
  });
  this.addDirFunction("isDirectory", () => true);
  this.addDirFunction("isFile", () => false);
  this.addDirFunction("list", (object) => {
    const copy = { ...this.get(object.path) };
    delete copy.key;
    delete copy.path;
    delete copy.isHidden;
    delete copy.extention;
    this.functionNames.dir.forEach((funcName) => {
      delete copy[funcName];
    });
    return Object.keys(copy);
  });
  this.addDirFunction("includes", ({ getDatabaseStructure }, key) =>
    getDatabaseStructure().list().includes(key)
  );
  this.addDirFunction("new", function ({ path }, name, content = null) {
    return new Promise((resolve, reject) => {
      const lockKey = `/${path}/${name}`;
      const location = `${this.folderLocation}/${path}/${name}`;
      if (!this.lock.includes(lockKey)) {
        this.lock.push(lockKey);
        if (typeof content === "string" || content) {
          fs.writeFile(
            `${this.folderLocation}/${path}/${name}`,
            typeof content === "object" ? JSON.stringify(content) : content,
            (err) => {
              this.lock.splice(this.lock.indexOf(location), 1);
              err ? reject(err) : resolve(this.update());
            }
          );
        } else {
          fs.mkdir(`${this.folderLocation}/${path}/${name}`, (err) => {
            this.lock.splice(this.lock.indexOf(location), 1);
            err ? reject(err) : resolve(this.update());
          });
        }
      } else {
        reject({
          type: this.errors.OPERATION_LOCKED,
          message: "Already creating a new object at given location.",
          lock: { key: lockKey },
        });
      }
    });
  });
  this.addDirFunction("delete", ({ path }) => {
    const deleteFolderRecursive = (path) => {
      return new Promise(async (resolve, reject) => {
        try {
          if (fs.existsSync(path)) {
            for (let file of fs.readdirSync(path)) {
              const curPath = `${path}/${file}`;
              if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                await deleteFolderRecursive(curPath);
              } else {
                // delete file
                fs.unlinkSync(curPath);
              }
            }
            fs.rmdirSync(path);
            resolve(this.update());
          }
        } catch (err) {
          reject(err);
        }
      });
    };
    return deleteFolderRecursive(`${this.folderLocation}/${path}`);
  });
  this.addFileFunction("getAbsolutePath", ({ path }) => {
    let absolutePath = `${this.folderLocation}${path}`;
    do {
      absolutePath = absolutePath.replace("\\", "/");
    } while (absolutePath.includes("\\"));
    return absolutePath;
  });
  this.addFileFunction("isDirectory", () => false);
  this.addFileFunction("isFile", () => true);
  this.addFileFunction(
    "read",
    async function (
      { key, path, extention },
      skipCashe_ForceReadFromFile = false
    ) {
      if (
        !this.cache[path] ||
        !this.userCache[key] ||
        skipCashe_ForceReadFromFile
      ) {
        const data = await new Promise(async (resolve, reject) => {
          while (this.lock.includes(path) || this.userLock.includes(key)) {
            await new Promise((resolve) => setTimeout(() => resolve(), 100));
          }
          fs.readFile(`${this.folderLocation}/${path}`, (err, data) =>
            err
              ? reject(err)
              : resolve(
                  typeof extention === "string" &&
                    (extention.toLowerCase() === "json" ||
                      extention.toLowerCase() === "user")
                    ? (() => {
                        try {
                          return JSON.parse(data.toString());
                        } catch (err) {
                          console.error(err);
                          return {};
                        }
                      })()
                    : data
                )
          );
        });
        if (
          typeof extention === "string" &&
          extention.toLowerCase() === "user"
        ) {
          this.userCache[key] = data;
        } else {
          this.cache[path] = { data, extention };
        }
      }
      return extention.toLowerCase() === "user"
        ? this.userCache[key]
        : this.cache[path].data;
    }
  );
  this.addFileFunction("write", function ({ path, key }, content) {
    return new Promise(async (resolve, reject) => {
      while (this.lock.includes(path)) {
        await new Promise((resolve) => setTimeout(() => resolve(), 100));
      }
      if (key.includes("_USER")) {
        this.userLock.push(key);
      } else {
        this.lock.push(path);
      }
      fs.writeFile(
        `${this.folderLocation}/${path}`,
        typeof content === "object" ? JSON.stringify(content) : content,
        (err) => {
          if (key.includes("_USER")) {
            this.userLock.splice(this.lock.indexOf(key), 1);
          } else {
            this.lock.splice(this.lock.indexOf(path), 1);
          }
          err ? reject(err) : resolve(this.update());
        }
      );
    });
  });
  this.addFileFunction("delete", function ({ path }) {
    return new Promise((resolve, reject) =>
      fs.unlink(`${this.folderLocation}/${path}`, (err) =>
        err ? reject(err) : resolve(this.update())
      )
    );
  });
  this.skipUpdate = false;
}
