export default class DB {
  constructor() {
    this.db = null; // The database object will eventually be stored here.
    this.description = "This database is used to store files locally."; // The description of the database.
    this.name = "localFileStorage"; // The name of the database.
    this.version = 1; // Must be >= 1. Be aware that a database of a given name may only have one version at a time, on the client machine.
    this.storeName = "fileObjects"; // The name of the database's object store. Each object in the object store is a file object.
    this.message = ""; // When useful, contains one or more HTML strings to display to the user in the 'messages' DIV box.
    this.empty = true; // Indicates whether or not there's one or more records in the database object store. The object store is initially empty, so set this to true.
  }

  isSupported() {
    switch (window.location.protocol) { // To work, IndexedDB pages must be served via the http or https protocol (or, for apps in the new Windows UI, the ms-wwa or ms-wwa-web protocols).
      case "http:":
        break;
      case "https:":
        break;
      case "ms-wwa-web:": // For apps in the new Windows UI, IndexedDB works in local content loaded in the web context.
        break;
      case "ms-wwa:": // For apps in the new Windows UI, IndexedDB works in the local context.
        break;
      default:
        console.log("<h3>IndexedDB pages must be served via the http:// or https:// protocol - resolve this issue and try again.</h3>");
        return false;
    } // switch

    if(window.File && window.FileReader && window.FileList && window.Blob) {
      console.log("File API is supported")
    } else {
      console.log("File API is not !!! supported")
      return false;
    }

    if (!window.indexedDB) {
      if (window.mozIndexedDB) {
        window.indexedDB = window.mozIndexedDB;
      } else if (window.webkitIndexedDB) {
        window.indexedDB = window.webkitIndexedDB;
        window.IDBCursor = window.webkitIDBCursor;
        window.IDBDatabaseException = window.webkitIDBDatabaseException;
        window.IDBRequest = window.webkitIDBRequest;
        window.IDBKeyRange = window.webkitIDBKeyRange;
        window.IDBTransaction = window.webkitIDBTransaction;
      } else {
        console.log("<h3>IndexedDB is not supported - upgrade your browser to the latest version.</h3>");
        return false;
      }
    } // if

    if (!window.indexedDB.deleteDatabase) { // Not all implementations of IndexedDB support this method, thus we test for it here.
      console.log("<h3>The required version of IndexedDB is not supported.</h3>");
      return false;
    }

    return true;
  }

  displayMessage(m) {
    console.log(m)
  }

  openDB() {
    return new Promise((resolve, reject) => {
      console.log("openDB()");
      this.displayMessage("<p>Your request has been queued.</p>"); // Normally, this will instantly blown away by the next displayMessage().

      if (!window.indexedDB.open) {
        console.log("window.indexedDB.open is null in openDB()");
        return;
      } // if

      try {
        var openRequest = window.indexedDB.open(this.name, this.version); // Also passing an optional version number for this database.

        openRequest.onerror = (evt) => {
          const message = "openRequest.onerror fired in openDB() - error: " + (evt.target.error ? evt.target.error : evt.target.errorCode)
          console.log(message)
          reject(message)
        } // Some browsers may only support the errorCode property.

        // Called if the database is opened via another process, or similar.
        openRequest.onblocked = (evt) => {
          console.log("openDB_onupgradeneeded()");

          var message = "<p>The database is blocked - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode) + "</p>";
          message += "</p>If this page is open in other browser windows, close these windows.</p>";

          this.displayMessage(message);
          reject(message)
        };

        // Called if the database doesn't exist or the database version values don't match.
        openRequest.onupgradeneeded = (evt) => {
          console.log("openDB_onupgradeneeded()");
          this.displayMessage("<p>Your request has been queued.</p>"); // Normally, this will instantly be blown away be the next displayMessage().

          var db = this.db = evt.target.result; // A successfully opened database results in a database object, which we place in our global IndexedDB variable.

          if (!db) {
            console.log("db (i.e., evt.target.result) is null in openDB_onupgradeneeded()");
            return;
          } // if

          try {
            db.createObjectStore(this.storeName, {
              keyPath: "ID",
              autoIncrement: true
            }); // Create the object store such that each object in the store will be given an "ID" property that is auto-incremented monotonically. Thus, files of the same name can be stored in the database.
          } catch (ex) {
            console.log("Exception in openDB_onupgradeneeded() - " + ex.message);
            return;
          }

          this.message = "<p>The database has been created.</p>"; // A means of communicating this information to the openDB_onsuccess handler.

          resolve(db)
        };

        // Attempts to open an existing database (that has a correctly matching version value).
        openRequest.onsuccess = (evt) => {
          console.log("openDB_onsuccess()");

          var db = this.db = evt.target.result; // A successfully opened database results in a database object, which we place in our global IndexedDB variable.

          if (!db) {
            console.log("db (i.e., evt.target.result) is null in openDB_onsuccess()");
            return;
          } // if

          console.log('The database has been opened.')

          resolve(db)
        };
      } catch (ex) {
        console.log("window.indexedDB.open exception in openDB() - " + ex.message);
      }
    })
  } // openDB

  storeFiles(files) {
    return new Promise((resolve, reject) => {
      if (!files || !files.length) {
        reject("please select at least a file")
        return;
      }

      var db = this.db;
      if (!db) {
        reject("db (i.e., this.db) is null in storeFiles()")
        return;
      } // if

      try {
        // This is either successful or it throws an exception. Note that the ternary operator is for browsers that only support the READ_WRITE value.
        var transaction = db.transaction(this.storeName, (window.IDBTransaction.READ_WRITE ? window.IDBTransaction.READ_WRITE : 'readwrite'));
      } // try
      catch (ex) {
        reject("db.transaction exception in storeFiles() - " + ex.message)
        return;
      } // catch

      transaction.onerror = (evt) => {
        console.log("transaction.onerror fired in storeFiles() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode));
      }
      transaction.onabort = () => {
        console.log("transaction.onabort fired in storeFiles()");
      }
      transaction.oncomplete = () => {
        console.log("transaction.oncomplete fired in storeFiles()");
      }

      try {
        const objectStore = transaction.objectStore(this.storeName); // Note that multiple put()'s can occur per transaction.

        const promises = Array.from(files).map(file => {
          return new Promise((rs, rj) => {
            const putRequest = objectStore.put(file); // The put() method will update an existing record, whereas the add() method won't.
            putRequest.onsuccess = () => {
              console.log("put file sucecss!!!");
              this.empty = false;
              rs()
            } // There's at least one object in the database's object store. This info (i.e., this.empty) is used in displayDB().
            putRequest.onerror = (evt) => {
              console.log("putRequest.onerror fired in storeFiles() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode));
              rj()
            }
            putRequest.onblocked = () => console.log('blocked')
            putRequest.onclose = () => console.log('close')
            putRequest.onabort = () => console.log('abort')
            console.log(putRequest)
          })
        })

        Promise.all(promises)
          .then(() => resolve())
          .catch(() => reject('oh no!!!'))
      } // try
      catch (ex) {
        console.log("Transaction and/or put() exception in storeFiles() - " + ex.message);
        reject()
        return;
      } // catch
    })
  }


  listFiles() {
    return new Promise((resolve, reject) => {
      var db = this.db;

      if (!db) {
        this.displayMessage("<p>There's no database to display.</p>");
        console.log("db (i.e., this.db) is null in listFiles()");
        reject()
        return;
      } // if

      try {
        var transaction = db.transaction(this.storeName, (window.IDBTransaction.READ_ONLY ? window.IDBTransaction.READ_ONLY : 'readonly')); // This is either successful or it throws an exception. Note that the ternary operator is for browsers that only support the READ_ONLY value.
      } // try
      catch (ex) {
        console.log("db.transaction() exception in listFiles() - " + ex.message);
        reject()
        return;
      } // catch

      const files = []

      try {
        var objectStore = transaction.objectStore(this.storeName);

        try {
          var cursorRequest = objectStore.openCursor();

          cursorRequest.onerror = (evt) => {
            console.log("cursorRequest.onerror fired in listFiles() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode));
          }

          cursorRequest.onsuccess = (evt) => {
            console.log("cursorRequest.onsuccess fired in listFiles()");

            var cursor = evt.target.result; // Get an object from the object store.


            if (cursor) {
              this.empty = false; // If we're here, there's at least one object in the database's object store (i.e., the database is not empty).

              console.log(cursor);
              files.push({
                name: cursor.value.name,
                lastModifiedDate: cursor.value.lastModifiedDate,
                size: cursor.value.size,
                blob: cursor.value.blob,
              })
              cursor.continue(); // Move to the next object (that is, file) in the object store.
            } else {
              resolve(files)
            }

            if (this.empty) {
              resolve(files)
            }
          } // cursorRequest.onsuccess
        } // inner try
        catch (innerException) {
          reject()
          console.log("Inner try exception in listFiles() - " + innerException.message);
        } // inner catch
      } // outer try
      catch (outerException) {
        reject()
        console.log("Outer try exception in listFiles() - " + outerException.message);
      } // outer catch
    })
  }
}
