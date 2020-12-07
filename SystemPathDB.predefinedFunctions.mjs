/** Has access to the this keyword of the SystemPathDB class.
 * This function gets invoced inside of the SystemPathDB constructor.
 */
export default function SystemPathDBPredefinedFunctions() {
  this.skipUpdate = true;
  this.addStructureFunction("list", ({ getDatabaseStructure }) => {
    const copy = { ...getDatabaseStructure() };
    delete copy.extention;
    delete copy.path;
    delete copy.list;
    delete copy.getAbsolutePath;
    return Object.keys(copy);
  });
  this.addStructureFunction("getAbsolutePath", () => this.folderLocation);
  this.addDirFunction(
    "getAbsolutePath",
    ({ path }) => `${this.folderLocation}/${path}`
  );
  this.addDirFunction("isDirectory", () => true);
  this.addDirFunction("isFile", () => false);
  this.addDirFunction("list", (object) => {
    const copy = { ...this.get(object.path) };
    delete copy.key;
    delete copy.path;
    delete copy.isHidden;
    delete copy.extention;
    for (let func of this.functionNames.dir) {
      delete copy[func];
    }
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
        if (content) {
          fs.writeFile(
            `${this.folderLocation}/${path}/${name}`,
            content,
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
  this.addFileFunction(
    "getAbsolutePath",
    ({ path }) => `${this.folderLocation}/${path}`
  );
  this.addFileFunction("isDirectory", () => false);
  this.addFileFunction("isFile", () => true);
  this.addFileFunction("read", async function ({ path, extention }) {
    if (!this.cache[path]) {
      const data = await new Promise(async (resolve, reject) => {
        while (this.lock.includes(path)) {
          await new Promise((resolve) => setTimeout(() => resolve(), 100));
        }
        fs.readFile(`${this.folderLocation}/${path}`, (err, data) =>
          err
            ? reject(err)
            : resolve(
                typeof extention === "string" &&
                  extention.toLowerCase() === "json"
                  ? JSON.parse(data.toString())
                  : data
              )
        );
      });
      this.cache[path] = { data, extention };
    }
    return this.cache[path].data;
  });
  this.addFileFunction("write", function ({ path }, content) {
    return new Promise(async (resolve, reject) => {
      while (this.lock.includes(path)) {
        await new Promise((resolve) => setTimeout(() => resolve(), 100));
      }
      this.lock.push(path);
      fs.writeFile(`${this.folderLocation}/${path}`, content, (err) => {
        this.lock.splice(this.lock.indexOf(path), 1);
        err ? reject(err) : resolve(this.update());
      });
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