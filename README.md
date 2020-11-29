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
