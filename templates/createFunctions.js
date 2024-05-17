/* functions used in create.ejs */

let currIdx = 0;
let timeout;

function setImage(type, idx) {
    let img = document.querySelector("#" + type + "Img");
    img.setAttribute("src", `images/${type}/${type}${idx}.png`);
    currIdx = idx;
}

function previous(type) {
    if (currIdx == 0) { /* first img, go back to last */
        setImage(type, 9);
    } else {
        setImage(type, currIdx - 1);
    }
}

function next(type) {
    if (currIdx == 9) { /* last img, go back to first */
        setImage(type, 0);
    } else {
        setImage(type, currIdx + 1);
    }
}

function shuffleItems() {
    const random = () => Math.floor(Math.random() * 10);
    setImage("tops", random());
    setImage("bottoms", random());
    setImage("shoes", random());
    setImage("purses", random());
}

function saveThisOutfit() {
    showSavedMsg();
    fetch("/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/JSON"
        },
        body: JSON.stringify({
            top: document.querySelector("#topsImg").getAttribute("src"),
            bottoms: document.querySelector("#bottomsImg").getAttribute("src"),
            shoes: document.querySelector("#shoesImg").getAttribute("src"),
            purse: document.querySelector("#pursesImg").getAttribute("src"),
        })
    })
    .catch(e => {
        console.error("Error:", error);
    })
}

/* notifies user that the outfit has been saved */
function showSavedMsg() {
    const msg = document.querySelector("#saved");
    msg.style.display = "block";
    setTimeout(hideSavedMsg, 1000);
}

function hideSavedMsg() {
    const msg = document.querySelector("#saved");
    msg.style.display = "none";
}
