# Node-SystemPathDB

> SystemPathDB is a library for Node.js with focus on objectifying the specified path location.

## How to use:

### Instantiating an object:

    const databaseName = new SystemPathDB('/home/user');
    or
    const databaseName = new SystemPathDB('C:\\Users\\PatrykSitko');

### Monitoring an instanced object:

After instantiation you need to start monitoring the directory.
<br>
The monitor function accepts an optional attribute named interval.
<br>
The interval attribute describes at what intevals the database system has to refresh the cashed structure.
<br>
The default value is 100 (milliseconds).

    databaseName.monitor();
    or
    databaseName.monitor(25);

### Accessing the monitored structure:

To acces the structure stored inside of the instance you start by calling an variable attached to the instance of the database called structure:

    const databaseStructure = databaseName.structure;

the structure variable is a get (syntax) function that returns an javascript object notation of underlying folders and files. Files have their extention trimmed if one was present; A file named text-file.txt will become text-file inside of the json structure.

### 3 basic functions to extend functionality of the structure:

The SystemPathDB library has 3 basic functions called:

- addStructureFunction
- addDirFunction
- addFileFunction

Those functions are used for adding functionality to the database structure;

---

#### Functionality of; addStructureFunction:

The addStructureFunction is used to add functions to the structure variable that can be accessed via the SystemPathDB instance ([as mentioned above](#accessing-the-monitored-structure)).

This function has the following 2 parameters:

1. function name.

   Is used to name the anonimous function (declared in the second parameter); This function name can be used to call the added anonimous function described by attributing this parameter.

2. anonimous function.

   The anonimous function of addStructureFunction recieves 3 arguments by default wrapped into an object from the SystemPathDB instance. Those arguments are as follow:

   - path (typeof string)

   The path argument by default returns an empty string.
   <br>
   As the structure variable accessed via the SystemPathDB instance is the root path of the structure.

   - getDatabaseStructure (typeof function)

   The getDatabaseStructure function returns the database structure variable.
   <br>
   This function is made available to render easier access to the database structure from within the anonimous function.

   - extention (typeof string)

   The extention argument by default returns null.
   <br>
   (The root path has no extention.)

---

#### Functionality of; addDirFunction:

The addDirFunction is used to add functions to variables of type directory located inside of the json structure. Those directory type variables can be located within the structure variable. The structure variable is accessible via the SystemPathDB instance ([as mentioned above](#accessing-the-monitored-structure)).

This function has the following 3 parameters:

1. function name.

   Is used to name the anonimous function (declared in the second parameter); This function name can be used to call the added anonimous function described by attributing this parameter.

2. anonimous function.

   The anonimous function of addDirFunction recieves 5 arguments by default wrapped into an object from the SystemPathDB instance. Those arguments are as follow:

- key (typeof string)
- path (typeof string)
- isHidden (typeof boolean)
- extention (typeof string)
- getObject (typeof function)

3. target.
