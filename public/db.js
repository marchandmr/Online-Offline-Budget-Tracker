let db;
// create request for a "budget" indexed database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    // create object store called "pending" and set autoIncrement to true
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // check if the user is online
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    // create a transaction on pending (readwrite allows for the pending  transaction to be altered)
    const transaction = db.transaction(["pending"], "readwrite");

    // access your pending object store
    const store = transaction.objectStore("pending");

    // add record to your store with add method.
    store.add(record);
}

// checks if app is online, if it is it sends everything in "pending" tot he database
function checkDatabase() {
    // open a transaction on your pending indexDB
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to getAll
    const getAll = store.getAll();

    // makes a post request sending all data in pending to the budget DB
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    const transaction = db.transaction(["pending"], "readwrite");

                    // access your pending object store
                    const store = transaction.objectStore("pending");

                    // clear all items in your store
                    store.clear();
                });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
