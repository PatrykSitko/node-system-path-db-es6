# Node-SystemPathDB

> SystemPathDB is a library for Node.js with focus on objectifying the specified path location.

## How to use:

### Instantiating an object:

    const databaseName = new SystemPathDB('/home/user');
    or
    const databaseName = new SystemPathDB('C:\\Users\\PatrykSitko');

After instantiation you need to start monitoring the directory.
<br>
The monitor accepts an optional attribute named interval
<br>
to describe at what intevals the database system has
<br>
to refresh the cashed structure The
<br>
default value is 100 (milliseconds).

    databaseName.monitor();
    or
    databaseName.monitor(25);

To acces the structure you start by calling an variable attached to the instance of the database called structure:

    const databaseStructure = databaseName.structure;

The SystemPathDB library has 3 basic functions called:

- addStructureFunction
- addDirFunction
- addFileFunction

Those functions are used for adding functionality to the database structure;

#### Functionality of; addStructureFunction:

The addStructureFunction is used to add functions to the structure variable that can be accessed by the SystemPathDB instance (as mentioned above).

This function has the following parameters:

1. function name.

   Is used to name the anonimous function (declared in the second parameter); This function name can be used to call the added anonimous function described by attributing this parameter.

2. anonimous function.

   The anonimous function of addStructureFunction recieves 3 arguments by default wrapped into an object from the SystemPathDB instance. Those arguments are as follow:

   - path (typeof string)

   The path argument by default returns an empty string.
   <br>
   As the structure variable accessed trough the SystemPathDB instance is the root path of the structure.

   - getDatabaseStructure (typeof function)

   The getDatabaseStructure function returns the database structure variable.
   <br>
   This function is made available to render easier access to the database structure from within the anonimous function.

   - extention (typeof string)

   The extention argument by default returns null.
   <br>
   (The root path has no extention.)
