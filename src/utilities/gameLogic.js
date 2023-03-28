import config from "../constants/config";

class _PuzzelBlock {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

export class LinkedList {

    constructor() {
        this.head = null;
        this.tail = null;
        this.actifNode = null;
        this.mixedList = null;
        this.score = 0;
        this.hamleNumber = 0;
    }

    // adds an element to the list
    addElement(data) {
        const newNode = new _PuzzelBlock(data);

        // Adding the element in the list
        if (this.head === null) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail.next = newNode;
            this.tail = newNode;
        }
        this.length++;
    }

    // It looks for the position of element in the list or in the list's mixed list version.
    // Then, checks the element at that position are the same.
    isUrlAtCoorectPlace(nodeToCheckUrl) {

        let listCurrentElement = this.head;
        let mixedListCurrentElement = this.mixedList.head;

        while (!!listCurrentElement || !!mixedListCurrentElement) {
            // We compare the element of the same position in both lists
            if (listCurrentElement.data == nodeToCheckUrl && mixedListCurrentElement.data == nodeToCheckUrl) {
                return (true);
            }
            // We move to their respective next ones.
            listCurrentElement = listCurrentElement.next;
            mixedListCurrentElement = mixedListCurrentElement.next;
        }
        return (false);
    };

    // Takes a url and returns the node containing tha url.
    findNodePerUrl(url) {
        let currentElement = this.head;

        while (!!currentElement) {
            if (currentElement.data == url) {
                return currentElement;
            }
            currentElement = currentElement.next;
        }
        return (null);
    }

    // This function takes two list Nodes and mix swaps their data
    // NB: This function acffect the real list
    swap2Nodes(node1, node2) {
        const helper = node1.data;
        node1.data = node2.data;
        node2.data = helper;
    }

    // This function takes 2 urls, looks for the respective nodes and swaps the data of those nodes.
    // NB: This function acffects only the mixed version of the list.
    swap2NodesPerUrl(url1, url2) {
        const node1 = this.mixedList.findNodePerUrl(url1);
        const node2 = this.mixedList.findNodePerUrl(url2);

        if (!!node1 && !!node2) {
            this.mixedList.swap2Nodes(node1, node2);
        }
    }

    //This function mix the lists elements. (Karıştırma işlemi)
    mixElemnts() {

        // Since instead of dealing with a puzzle block as an object we wanna make things easier by
        // playing with the urls. And 'cause the urls are automaticaly generated by the browser, 
        // and because they have random letter composition, 
        // We can alphabeticaly sort those urls to have kind of mixed list [Karıştırma işlemi]
        let currentElement = this.head;
        let currentElementNext;

        while (!!currentElement) {
            currentElementNext = currentElement.next;
            while (!!currentElementNext) {
                if (!!currentElementNext.next && (currentElementNext.data < currentElementNext.next.data)) {
                    this.swap2Nodes(currentElementNext, currentElementNext.next);
                }
                currentElementNext = currentElementNext.next;
            }
            currentElement = currentElement.next;
        }
    }

    // this function updates and/or activate the mixed version of the current list
    genMixedList() {
        const listCopy = this.copy();
        listCopy.mixElemnts();
        this.mixedList = listCopy;
    }

    // This function mimics the classic arrays' map method
    map(callback) {
        // returns a classic list

        const array = [];
        let currentElement = this.head;

        while (!!currentElement) {
            array.push(callback(currentElement.data));
            currentElement = currentElement.next;
        }
        return (array);
    }

    // This function creates a copy of the current list and returns it.
    copy() {
        const newList = new LinkedList();
        let currentElement = this.head;

        while (!!currentElement) {
            newList.addElement(currentElement.data);
            currentElement = currentElement.next;
        }

        return (newList);
    }

    // Compares the real list with the mixed version and returns true if the are equal
    isGameFinished() {
        let thisListCurrentElement = this.head;
        let mixedList = this.mixedList.head;
        let areEqual = true; // In the begining we suppose both lists are equal

        while (!!thisListCurrentElement || !!mixedList) {
            // We compare the element of the same position in both lists
            if (thisListCurrentElement.data != mixedList.data) {
                // If the elements that position in both lists are different we set "areEqual" to false and stop looping
                areEqual = false;
                break;
            }

            // We move to their respective next ones.
            thisListCurrentElement = thisListCurrentElement.next;
            mixedList = mixedList.next;
        }
        return (areEqual);
    }

    hamle(url) {
        const activeNode = this.findNodePerUrl(url);
        if (this.actifNode == null) { // Sets the active node
            this.actifNode = activeNode;
        } else if (this.actifNode.data == url) { // Set the active node back to null
            this.actifNode = null;
        } else {

            // Swap the url's node with the active node
            // We only swap if both of them are not at the right place yet.
            const currentActiveNodeUrl = this.actifNode.data
            if (!this.isUrlAtCoorectPlace(url) && !this.isUrlAtCoorectPlace(currentActiveNodeUrl)) {
                this.swap2NodesPerUrl(url, currentActiveNodeUrl);

                // Check if the "hamle" is success is success hamle

                if (this.isUrlAtCoorectPlace(url) || this.isUrlAtCoorectPlace(currentActiveNodeUrl)) {
                    this.score += config.SUCCESS_HAMLE_GAIN;
                } else {
                    if(this.score > 0) this.score += config.FAIL_HAMLE_LOST;
                    if (this.score < 0) this.score = 0;
                }

                // - return the list's current state to allow React render screens.
                this.actifNode = null;
                this.hamleNumber += 1;
            }
        }
        return (this);
    }

}