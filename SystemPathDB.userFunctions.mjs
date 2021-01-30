import formatMail from "./modules/formatMail.mjs";
/** Has access to the this keyword of the SystemPathDB class.
 * This function gets invoced inside of the SystemPathDB constructor.
 */
export function updateUsers() {
  if (!this.updatingUsers) {
    this.updatingUsers = true;
    new Promise(
      async function (resolve) {
        const users = { ...this.structure.users };

        if (users) {
          for (let user in users) {
            if (
              ["key", "path", "isHidden", "extention"]
                .concat(this.functionNames.dir)
                .includes(user) ||
              this.userLock.includes(user)
            ) {
              continue;
            }
            new Promise(
              async function (resolved) {
                let readFunctionNotAvailable;
                let userData;
                do {
                  readFunctionNotAvailable = false;
                  try {
                    userData = await this.structure.users[user].read(true);
                  } catch (err) {
                    readFunctionNotAvailable = true;
                  }
                } while (readFunctionNotAvailable);

                // const userCacheData = this.userCache[user];
                // if (
                //   !this.userLock.includes(user) &&
                //   userCacheData &&
                //   JSON.stringify(userData) !== JSON.stringify(userCacheData)
                // ) {
                //   this.userLock.push(user);
                //   await users[user].write(JSON.stringify(userCacheData));
                //   this.userLock.splice(this.userLock.indexOf(user), 1);
                // } else {
                this.userCache[user] = userData;
                // }
                resolved();
              }.bind(this)
            );
          }
        }
        Object.keys(this.userCache).forEach((key) =>
          users.list().includes(key) ? null : delete this.userCache[key]
        );
        resolve((this.updatingUsers = false));
      }.bind(this)
    );
  }
}

export default function SystemPathDBUserFunctions() {
  this.addStructureFunction(
    "createUser",
    async ({ getDatabaseStructure }, email, registrationData = {}) => {
      if (!getDatabaseStructure().includes("users")) {
        await getDatabaseStructure().new("users");
      }
      if (!getDatabaseStructure().users.includes(`${email}_USER`)) {
        await getDatabaseStructure().users.new(`${email}.USER`, {
          email,
          ...registrationData,
        });
      }
      return getDatabaseStructure().users.includes(`${email}_USER`);
    }
  );
  this.addStructureFunction(
    "readUser",
    ({ getDatabaseStructure }, emailOrObjectKey) => {
      const emailOrObjectKeyCopy = formatMail(emailOrObjectKey);
      const users = getDatabaseStructure().users;
      if (users && users.includes(emailOrObjectKeyCopy)) {
        return getDatabaseStructure().users[emailOrObjectKeyCopy].read();
      }
    }
  );
  this.addStructureFunction(
    "updateUser",
    async (
      { getDatabaseStructure },
      emailOrObjectKey,
      registrationData = {}
    ) => {
      const emailOrObjectKeyCopy = formatMail(emailOrObjectKey);
      const users = getDatabaseStructure().users;
      if (users && users.includes(emailOrObjectKeyCopy)) {
        getDatabaseStructure().users[emailOrObjectKeyCopy].write({
          ...(await getDatabaseStructure().readUser(emailOrObjectKeyCopy)),
          ...registrationData,
        });
      }
    }
  );
  this.addStructureFunction(
    "deleteUserKeys",
    ({ getDatabaseStructure }, emailOrObjectKey, keysToDelete = []) => {
      const emailOrObjectKeyCopy = formatMail(emailOrObjectKey);
      const users = getDatabaseStructure().users;
      if (users && users.includes(emailOrObjectKeyCopy)) {
        const userCacheCopy = { ...this.userCache[emailOrObjectKeyCopy] };
        keysToDelete.forEach((key) => delete userCacheCopy[key]);
        getDatabaseStructure().users[emailOrObjectKeyCopy].write(userCacheCopy);
      }
    }
  );
  this.addStructureFunction(
    "deleteUser",
    ({ getDatabaseStructure }, emailOrObjectKey) => {
      const emailOrObjectKeyCopy = formatMail(emailOrObjectKey);
      const users = getDatabaseStructure().users;
      if (users && users.includes(emailOrObjectKeyCopy)) {
        delete this.userCache[emailOrObjectKeyCopy];
        getDatabaseStructure().users[emailOrObjectKeyCopy].delete();
      }
    }
  );
}
