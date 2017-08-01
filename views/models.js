class SimpleResponse {
    constructor(initialiser) {
        this.text = undefined;
        this.moreButton = undefined;
        this.nextButtons = undefined;

        Object.assign(this, initialiser);
    }
}

class ListResponse extends SimpleResponse {
    constructor(initialiser) {
        super(initialiser);

        this.list = undefined;
        Object.assign(this, initialiser);
    }
}

class CardResponse {
    constructor(initialiser) {
        this.title = undefined;
        this.subTitle = undefined;
        this.imageUrl = undefined;
        this.linkUrl = undefined;
        this.buttons = undefined;

        Object.assign(this, initialiser);
    }
}

class ListItem {
    constructor(initialiser) {
        this.title = undefined;
        this.subTitle = undefined;
        this.imageUrl = undefined;
        this.linkUrl = undefined;
        this.button = undefined;

        Object.assign(this, initialiser);
    }
}

class Button {
    constructor() {
        this.title = undefined;
    }
}

class LinkButton extends Button {
    constructor(initialiser) {
        super(initialiser);

        this.linkUrl = undefined;

        Object.assign(this, initialiser);
    }
}

class CallButton extends Button {
    constructor(initialiser) {
        super(initialiser);

        this.phoneNumber = undefined;

        Object.assign(this, initialiser);
    }
}

module.exports = {SimpleResponse, ListResponse, CardResponse, ListItem, LinkButton, CallButton};