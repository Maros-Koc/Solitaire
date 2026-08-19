import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const scene = new THREE.Scene();

const width = window.innerWidth;
const height = window.innerHeight;
const zoomLevel = 10;
const aspectRatio = width / height;

const camera = new THREE.OrthographicCamera(
    -aspectRatio * zoomLevel,
    aspectRatio * zoomLevel,
    zoomLevel,
    -zoomLevel,
    1,
    1000
);

camera.position.set(0, 40, 0);
camera.lookAt(0, 0, 0);

const sounds = {
    Turn: [],
    Lift: [],
    Drop: [],
    Shuffle: []
};

const manager = new THREE.LoadingManager();
manager.onLoad = () => console.log('Sounds loaded:', sounds);

const listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();

const mp3s = {
    Turn: ["Turn1", "Turn2", "Turn3"],
    Lift: ["Lift1", "Lift2", "Lift3"],
    Drop: ["Drop1", "Drop2", "Drop3"],
    Shuffle: ["Shuffle1", "Shuffle2", "Shuffle3"]
};
const victorySound = new THREE.Audio(listener);
audioLoader.load('./Sounds/Victory.mp3', function(buffer) {
    victorySound.setBuffer(buffer);
    victorySound.setLoop(false);
    victorySound.setVolume(0.5);
});
const backgroundMusic = new THREE.Audio(listener);
audioLoader.load('./Sounds/Music.mp3', (buffer) => {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5);
    backgroundMusic.play();
});

Object.keys(mp3s).forEach(action => {
    mp3s[action].forEach(name => {
        const sound = new THREE.Audio(listener);
        sound.name = name;

        sounds[action].push(sound);

        audioLoader.load(`./Sounds/${name}.mp3`, function (buffer) {
            sound.setBuffer(buffer);
        });
    });
});

const originalVolumes = {};

let isMuted = false;
const muteButton = document.getElementById("muteButton");
muteButton.addEventListener("click", () => {
    isMuted = !isMuted;

    Object.keys(sounds).forEach(action => {
        sounds[action].forEach(sound => {
            if (isMuted) {

                if (!originalVolumes[sound.name]) {
                    originalVolumes[sound.name] = sound.getVolume();
                }
                sound.setVolume(0);
                volumeSlider.disabled =true;
            } else {

                const originalVolume = originalVolumes[sound.name] || 1;
                sound.setVolume(originalVolume);
                volumeSlider.disabled =false;
            }
        });
    });

    muteButton.textContent = isMuted ? "Unmute" : "Mute";
});

const volumeSlider = document.getElementById("volumeSlider");
const volumeLabel = document.getElementById("volumeLabel");

volumeSlider.addEventListener("input", (event) => {
    const volume = event.target.value;
    Object.keys(sounds).forEach(action => {
        sounds[action].forEach(sound => {
            sound.setVolume(volume);
        });
    });
    volumeLabel.textContent = `Volume: ${Math.trunc(volume*100)}%`;
});

let isMusicMuted = false;
let musicVolume = backgroundMusic.getVolume();
const muteMusic = document.getElementById("muteMusic");
muteMusic.addEventListener('click', () => {
    if (isMusicMuted) {

        backgroundMusic.setVolume(musicVolume);
        muteMusic.textContent = "Mute";
        volumeMusicSlider.disabled =false;
    } else {

        musicVolume = backgroundMusic.getVolume();
        backgroundMusic.setVolume(0);
        muteMusic.textContent = "Unmute";
        volumeMusicSlider.disabled =true;
    }


    isMusicMuted = !isMusicMuted;
});

const volumeMusicSlider = document.getElementById('volumeMusicSlider');
const volumeMusicLabel = document.getElementById("volumeMusicLabel");
volumeMusicSlider.addEventListener('input', (event) => {
    const volume = event.target.value;
    backgroundMusic.setVolume(volume);
    volumeMusicLabel.textContent = `Volume: ${Math.trunc(volume*100)}%`;
});


function playRandomSound(action) {
    const actionSounds = sounds[action];
    if (actionSounds && actionSounds.length > 0) {
        const randomIndex = Math.floor(Math.random() * actionSounds.length);
        const sound = actionSounds[randomIndex];
        sound.detune = Math.floor(Math.random() * 400 - 200);
        sound.play();
    } else {
        console.warn(`No sounds available for action: ${action}`);
    }

}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);

outlinePass.edgeStrength = 5;
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 7.5;
outlinePass.pulsePeriod = 5;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x000000);

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.left = -aspectRatio * zoomLevel;
    camera.right = aspectRatio * zoomLevel;
    camera.top = zoomLevel;
    camera.bottom = -zoomLevel;
    camera.updateProjectionMatrix();
});

const tableGeometry = new THREE.PlaneGeometry(42, 20);
const tableTexture = new THREE.TextureLoader().load('Images/Karty/BG.png');
const tableMaterial = new THREE.MeshBasicMaterial({map: tableTexture});
const table = new THREE.Mesh(tableGeometry, tableMaterial);

table.rotation.x = -Math.PI / 2;
table.position.y = -2;
scene.add(table);

const textureLoader = new THREE.TextureLoader();
const cardTextures = {};
const cardBackTexture = textureLoader.load('Images/Karty/Back-1.png');

suits.forEach((suit) => {
    const suitPrefix = suit[0].toUpperCase();
    values.forEach((value) => {
        const texturePath = `Images/Karty/${suitPrefix}-${value}.png`;
        cardTextures[`${suit}-${value}`] = textureLoader.load(texturePath);
    });
});

const placeholderTextures = {
    hearts: new THREE.TextureLoader().load('Images/Karty/PH-H.png'),
    diamonds: new THREE.TextureLoader().load('Images/Karty/PH-D.png'),
    clubs: new THREE.TextureLoader().load('Images/Karty/PH-C.png'),
    spades: new THREE.TextureLoader().load('Images/Karty/PH-S.png'),
    king: new THREE.TextureLoader().load('Images/Karty/PHK.png'),
    draw: new THREE.TextureLoader().load('Images/Karty/PHDP.png'),
};

function createRandomDeck() {
    const deck = [];
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({ suit, value });
        });
    });

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

function createCard(suit, value, isFaceUp = false) {
    const cardGeometry = new THREE.PlaneGeometry(3, 4.5);

    const frontTexture = cardTextures[`${suit}-${value}`];
    const backTexture = cardBackTexture;

    const cardMaterial = new THREE.ShaderMaterial({
        uniforms: {
            frontTexture: { value: frontTexture },
            backTexture: { value: backTexture },
            flip: { value: isFaceUp ? 1 : 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D frontTexture;
            uniform sampler2D backTexture;
            uniform float flip;
            varying vec2 vUv;

            void main() {
                vec2 frontUV = vec2(1.0 - vUv.x, vUv.y);
                vec4 frontColor = texture2D(frontTexture, frontUV);
                vec4 backColor = texture2D(backTexture, vUv);
                gl_FragColor = mix(backColor, frontColor, flip);
            }
        `,
        side: THREE.DoubleSide,
    });

    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.userData = { suit, value, isFaceUp };
    return card;
}

function flipCard(card, faceUp = true) {
    card.material.uniforms.flip.value = faceUp ? 1 : 0;
    card.userData.isFaceUp = faceUp;
}

const tableauPlaceholderGeometry = new THREE.PlaneGeometry(3, 4.5);
const tableauPlaceholderMaterial = new THREE.MeshBasicMaterial({
    map: placeholderTextures.king,
    side: THREE.DoubleSide,
});

const deck = createRandomDeck();

const tableauPiles = Array(7).fill(null).map((_, i) => ({
    cards: [],
    position: new THREE.Vector3(i * 4 - 7, 1.02, 0),
}));

const placeholderToPileMap = new Map();
const placeholderK = [];

tableauPiles.forEach((pile, index) => {
    const placeholder = new THREE.Mesh(tableauPlaceholderGeometry, tableauPlaceholderMaterial);
    placeholder.position.copy(pile.position);
    placeholder.position.y = 1.01;
    placeholder.rotation.set(-Math.PI / 2, Math.PI, 0);
    placeholderK[index] = placeholder;
    placeholderToPileMap.set(placeholder, pile);
    scene.add(placeholder);
});

tableauPiles.forEach((pile, i) => {
    for (let j = 0; j <= i; j++) {
        const cardInfo = deck.pop();
        const isFaceUp = j === i;
        const card = createCard(cardInfo.suit, cardInfo.value, isFaceUp);

        card.position.set(pile.position.x, 1.02 + j * 0.2, j * 0.49);
        card.rotation.set(-Math.PI / 2, isFaceUp ? Math.PI : 0, 0);
        scene.add(card);
        pile.cards.push(card);
    }
});

let drawPile = [];
deck.forEach((cardInfo, index) => {
    const card = createCard(cardInfo.suit, cardInfo.value, false);
    card.position.set(-17, 1.1 + index * 0.2, -6);
    card.rotation.set(-Math.PI / 2, 0, 0);
    scene.add(card);
    drawPile.push(card);
});

let activeDrawCard = null;

const drawPilePlaceholderGeometry = new THREE.PlaneGeometry(3, 4.5);
const drawPilePlaceholderMaterial = new THREE.MeshBasicMaterial({
    map: placeholderTextures.draw ,
    side: THREE.DoubleSide,
});

const drawPilePlaceholder = new THREE.Mesh(drawPilePlaceholderGeometry, drawPilePlaceholderMaterial);
drawPilePlaceholder.position.set(-17, 1.01, -6);
drawPilePlaceholder.rotation.set(-Math.PI / 2, 0, 0);
scene.add(drawPilePlaceholder);

let revealedCards = [];
let isAnimating = false;
const drawPilePosition = new THREE.Vector3(-17, 10, -6);

function revealNextCard() {
    if (isAnimating || drawPile.length === 0) {
        return;
    }
    isAnimating = true;

    const activeDrawCard = drawPile.pop();
    const revealedPilePosition = new THREE.Vector3(-13, 1 + revealedCards.length * 0.3, -6);

    activeDrawCard.rotation.y = 0;

    animateCardFlip(activeDrawCard, drawPilePosition, revealedPilePosition, 400, () => {
            activeDrawCard.position.copy(revealedPilePosition);
            revealedCards.push(activeDrawCard);
            isAnimating = false;
        }
    );
}

function resetDrawPile() {
    if (isAnimating) return;
    isAnimating = true;

    const animationDuration = 500;
    const startTime = performance.now();

    const cardsToAnimate = revealedCards.slice();


    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        cardsToAnimate.forEach((card, index) => {
            const targetPosition = new THREE.Vector3(
                -17,
                1.1 + index * 2,
                -6
            );
            card.position.lerpVectors(card.position, targetPosition, progress);
            card.rotation.y = THREE.MathUtils.lerp(card.rotation.y, 0, progress);

            if (progress >= 0.25 && card.userData.isFaceUp) {
                flipCard(card, false);
            }
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            revealedCards.reverse().forEach((card, index) => {
                card.position.set(-17, 1.1 + index * 0.2, -6);
                drawPile.push(card);
            });
            revealedCards = [];
            isAnimating = false;
        }
    }
    playRandomSound("Shuffle");
    animate();
}

document.addEventListener('click', (event) => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([...drawPile, drawPilePlaceholder]);
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject === drawPilePlaceholder) {
            resetDrawPile();
            cardShuffle.stop();
            cardShuffle.detune = Math.floor(Math.random() * 1600 - 800);
            cardShuffle.play();
        } else if (drawPile.includes(clickedObject)) {
            revealNextCard();
            cardTurn.stop();
            cardTurn.detune = Math.floor(Math.random() * 1600 - 800);
            cardTurn.play();
        }
    }
});

const victoryPiles = [
    { cards: [], suit: 'hearts', position: new THREE.Vector3(5,  1.02, -6) },
    { cards: [], suit: 'diamonds', position: new THREE.Vector3(9,  1.02, -6) },
    { cards: [], suit: 'clubs', position: new THREE.Vector3(13,  1.02, -6) },
    { cards: [], suit: 'spades', position: new THREE.Vector3(17,  1.02, -6) }
];
const placeholderToVictoryMap = new Map();
const placeholderV = [];

victoryPiles.forEach((pile, index) => {
    const placeholderGeometry = new THREE.PlaneGeometry(3, 4.5);

    const placeholderMaterial = new THREE.MeshBasicMaterial({
        map: placeholderTextures[pile.suit],
        side: THREE.DoubleSide,

    });

    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.position.copy(pile.position);
    placeholder.position.y = 0.2
    placeholder.rotation.set(-Math.PI / 2, 0, 0);
    placeholderV[index] = placeholder;
    placeholderToVictoryMap.set(placeholder, pile);
    scene.add(placeholder);
});

let isDragging = false;
let selectedCard = null;
let originalPosition = new THREE.Vector3();
let offset = new THREE.Vector3();

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let cardsToDrag = [];

document.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || isAnimating || gameWon) return;

    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);

    const tableauCards = tableauPiles.flatMap((pile) => pile.cards);
    const intersects = raycaster.intersectObjects([...tableauCards, ...revealedCards, activeDrawCard].filter(Boolean));

    if (intersects.length > 0) {
        playRandomSound("Lift");
        const potentialCard = intersects[0].object;


        if (potentialCard.userData.isAnimating){
            return;
        }

        if (revealedCards.includes(potentialCard)) {
            if (potentialCard !== revealedCards[revealedCards.length - 1]) {
                return;
            }
            selectedCard = potentialCard;
            originalPosition.copy(selectedCard.position);
            offset.copy(selectedCard.position).sub(intersects[0].point);
            isDragging = true;
            cardsToDrag = [selectedCard];
            outlinePass.selectedObjects = [selectedCard];
            return;
        }

        if (potentialCard.userData.isFaceUp) {
            const pile = tableauPiles.find((pile) => pile.cards.includes(potentialCard));
            if (!pile) {
                return;
            }

            const cardIndex = pile.cards.indexOf(potentialCard);
            if (cardIndex === -1) {
                return;
            }

            selectedCard = potentialCard;
            originalPosition.copy(selectedCard.position);

            cardsToDrag = pile.cards.slice(cardIndex);
            offset.copy(selectedCard.position).sub(intersects[0].point);

            cardsToDrag.forEach((card) => (card.position.y += 5));
            isDragging = true;
            outlinePass.selectedObjects = cardsToDrag;
        }
    }
});

document.addEventListener('mousemove', (event) => {
    if (!isDragging || !cardsToDrag.length || gameWon) return;

    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(table);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const dragPosition = new THREE.Vector3(
            intersectionPoint.x + offset.x,
            intersectionPoint.y + 10,
            intersectionPoint.z + offset.z
        );

        cardsToDrag.forEach((card, index) => {
            card.position.set(
                dragPosition.x,
                dragPosition.y + index * 0.2,
                dragPosition.z + index * 0.49,
            );
        });
        outlinePass.selectedObjects = cardsToDrag;
    }
});

let gameWon = false;

document.addEventListener('mouseup', (event) => {
    if (!isDragging || !selectedCard || gameWon) return;

    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);

    outlinePass.selectedObjects = [];

    playRandomSound("Drop");
    const tableauIntersects = raycaster.intersectObjects(tableauPiles.flatMap(pile => pile.cards));
    const emptyIntersects = raycaster.intersectObjects(placeholderK);
    const victoryIntersects = raycaster.intersectObjects(victoryPiles.flatMap(pile => pile.cards));
    const aceIntersects = raycaster.intersectObjects(placeholderV);

    let validPile = null;

    if (emptyIntersects.length > 0 && selectedCard.userData.value === 'K') {
        const placeholder = emptyIntersects[0].object;
        const targetPile = placeholderToPileMap.get(placeholder);
        if (targetPile && targetPile.cards.length === 0) {
            addCardToTableau(selectedCard, targetPile);
            validPile = targetPile;
        }
    }

    if (aceIntersects.length > 0 && selectedCard.userData.value === 'A') {
        const placeholder = aceIntersects[0].object;
        const targetPile = placeholderToVictoryMap.get(placeholder);
        if (targetPile && targetPile.cards.length === 0 && targetPile.suit === selectedCard.userData.suit) {
            addCardToTableau(selectedCard, targetPile);
            validPile = targetPile;
        }
    }

    if (victoryIntersects.length > 0) {
        const targetCard = victoryIntersects[0].object;
        const targetPile = victoryPiles.find(pile => pile.cards.includes(targetCard));
        if (isValidForVictoryPile(selectedCard, targetPile.cards) && (cardsToDrag.length === 1)) {
            validPile = targetPile;
            addCardToVictoryPile(selectedCard, targetPile);
        }
    }

    if (tableauIntersects.length > 1 && selectedCard === tableauIntersects[0].object) {
        const targetCard = tableauIntersects[1].object;
        const targetPile = tableauPiles.find(pile => pile.cards.includes(targetCard));
        if (isValidForTableauPile(selectedCard, targetPile.cards)) {
            validPile = targetPile;
            addCardToTableau(selectedCard, targetPile);
        }
    }

    else if (tableauIntersects.length > 0 && !aceIntersects.length) {
        const targetCard = tableauIntersects[0].object;
        const targetPile = tableauPiles.find(pile => pile.cards.includes(targetCard));
        if (isValidForTableauPile(selectedCard, targetPile.cards)){
            validPile = targetPile;
            addCardToTableau(selectedCard, targetPile);
        }
    }

    if (!validPile) {
        cardsToDrag.forEach((card, index) => {
            const snapPosition = originalPosition.clone();
            snapPosition.y += index * 0.2;
            snapPosition.z += index * 0.49;
            snapCardToPosition(card, snapPosition);
        });
    }

    const allVictoryComplete = victoryPiles.every(pile => pile.cards.length === 13);

    if (allVictoryComplete) {
        gameWon = true;
        backgroundMusic.setVolume(0);
        muteMusic.textContent = "Unmute";
        volumeMusicSlider.disabled = true;
        isMusicMuted = true;

        victorySound.play();
        animateVictoryCards();
        displayVictoryUI();
    }

    selectedCard = null;
    isDragging = false;
});

function updateMousePosition(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function removeCardFromTableau(card) {
    tableauPiles.forEach((pile) => {
        const index = pile.cards.indexOf(card);
        if (index !== -1) {
            pile.cards.splice(index, 1);

            if (pile.cards.length > 0) {
                const nextCard = pile.cards[pile.cards.length - 1];
                const nextPosition = nextCard.position.clone();
                if (!nextCard.userData.isFaceUp) {
                    const higherCard = nextCard.position.clone();
                    higherCard.y = 10;
                    animateCardFlip(nextCard, higherCard, nextPosition, 400, () => {
                        isAnimating = false;
                    });
                }
            }
        }
    });
}

function addCardToVictoryPile(card, pile) {
    if (revealedCards.includes(card)) {
        removeCardFromDrawPile(card);
    } else {
        removeCardFromTableau(card);
    }
    pile.cards.push(card);
    const targetPosition = pile.position.clone();
    targetPosition.y += pile.cards.length * 0.2;

    snapCardToPosition(card, targetPosition);

    if (!card.userData.isFaceUp) {
        flipCard(card, true);
    }
}

function addCardToTableau(card, pile) {
    cardsToDrag.forEach((card, index) => {
        if (revealedCards.includes(card)) {
            removeCardFromDrawPile(card);
        } else {
            removeCardFromTableau(card);
        }
        const targetPosition = pile.position.clone();
        targetPosition.y += (pile.cards.length ) * 0.2;
        targetPosition.z += (pile.cards.length ) * 0.49;
        snapCardToPosition(card, targetPosition);
        pile.cards.push(card);
    });
}

function removeCardFromDrawPile(card) {
    const index = revealedCards.indexOf(card);
    if (index !== -1) {
        revealedCards.splice(index, 1);
    }
}

function isValidForVictoryPile(card, pile) {
    const firstCard = cardsToDrag[0];
    if (pile.length === 0) {
        return firstCard.userData.value === 'A' && firstCard.userData.suit === pile.suit;
    }
    const topCard = pile[pile.length - 1];
    return card.userData.suit === topCard.userData.suit && values.indexOf(card.userData.value) - 1 === values.indexOf(topCard.userData.value);
}

function isOppositeColor(card1, card2) {
    if ((card1.suit === "hearts" || card1.suit === "diamonds") && (card2.suit === "clubs" || card2.suit === "spades")) {
        return true;
    }
    if((card1.suit === "clubs" || card1.suit === "spades") && (card2.suit === "hearts" || card2.suit === "diamonds")) {
        return true;
    }
    else return false;
}

function isValidForTableauPile(card, pile) {
    const firstCard = cardsToDrag[0];
    if (pile.length === 0) {
        return firstCard.userData.value === 'K';
    }
    const topCard = pile[pile.length - 1];
    return isOppositeColor(card.userData, topCard.userData) &&
        values.indexOf(card.userData.value) + 1 === values.indexOf(topCard.userData.value);
}

function displayVictoryUI() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 1s';

    const victoryMessage = document.createElement('div');
    victoryMessage.style.display = 'flex';
    victoryMessage.style.justifyContent = 'center';
    victoryMessage.style.alignItems = 'center';
    victoryMessage.style.flexDirection = 'column';
    victoryMessage.style.height = '100%';
    victoryMessage.style.fontSize = '3em';
    victoryMessage.style.color = '#f7cf91';
    victoryMessage.style.padding = '20px';
    victoryMessage.style.borderRadius = '10px';
    victoryMessage.style.textAlign = 'center';
    victoryMessage.style.opacity = '0';
    victoryMessage.style.transition = 'opacity 1s';

    victoryMessage.textContent = 'Victory!';

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.classList.add('button', 'restart-button', 'restart-text');
    restartButton.style.marginTop = '20px';
    restartButton.addEventListener('click', () => {
        overlay.remove();
        resetGame();
    });

    victoryMessage.appendChild(restartButton);
    overlay.appendChild(victoryMessage);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
        victoryMessage.style.opacity = '1';
    }, 50);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    composer.render();
}

function animateCardFlip(card, startPosition, endPosition, duration = 300, onComplete = null) {
    const initialRotationY = card.rotation.y;
    const targetRotationY = initialRotationY + Math.PI;

    const startTime = performance.now();
    let flipped = false;

    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutQuad(progress);
        card.rotation.y = THREE.MathUtils.lerp(initialRotationY, targetRotationY, easedProgress);
        card.position.lerpVectors(startPosition, endPosition, easedProgress);

        if (!flipped && progress >= 0.5) {

            flipCard(card, true);
            flipped = true;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (onComplete) {
            onComplete();
        }
    }
    playRandomSound("Turn");
    animate();
}

function animateCardJump(card, startPosition, targetPosition, duration, onComplete) {
    const clock = new THREE.Clock();
    const startTime = clock.getElapsedTime();

    function easeOutBounce(t) {
        if (t < (1 / 2.75)) {
            return 7.5625 * t * t;
        } else if (t < (2 / 2.75)) {
            t -= (1.5 / 2.75);
            return 7.5625 * t * t + 0.8;
        } else if (t < (2.5 / 2.75)) {
            t -= (2.25 / 2.75);
            return 7.5625 * t * t + 0.9;
        } else {
            t -= (2.625 / 2.75);
            return 7.5625 * t * t + 0.985;
        }
    }

    function animate() {
        const elapsed = clock.getElapsedTime() - startTime;
        const t = Math.min(elapsed / (duration / 1000), 1);
        let bounceProgress = easeOutBounce(t);

        const currentX = startPosition.x + (targetPosition.x - startPosition.x) * t;

        const currentY = startPosition.y + (targetPosition.y - startPosition.y) * t;

        const currentZ = startPosition.z + (targetPosition.z - startPosition.z) * (bounceProgress);

        card.position.set(currentX, currentY, currentZ);

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }

    animate();
}

function animateVictoryCards() {
    victoryPiles.forEach((pile, pileIndex) => {
        const pileStartPosition = new THREE.Vector3(0, 10, 0);

        for (let i = 12; i >= 0; i--) {
            const card = pile.cards[i];
            let targetPosition = new THREE.Vector3(
                pileStartPosition.x - 25,
                pileStartPosition.y + (2 + (i * 0.1) - (0.1 * pileIndex)),
                pileStartPosition.z + 7
            );

            let startPosition = card.position.clone();
            const duration = 750;

            const finalTargetPosition = new THREE.Vector3(
                pileStartPosition.x + 50,
                pileStartPosition.y + (5 + (i * 0.1) - (0.1 * pileIndex)),
                pileStartPosition.z + 7
            );

            const nextPosition = new THREE.Vector3(
                pileStartPosition.x - 25,
                pileStartPosition.y + (7 + (i * 0.1) - (0.1 * pileIndex)),
                pileStartPosition.z - 6
            );

            const lastPosition = new THREE.Vector3(
                pileStartPosition.x - 12 + (i * 2.5),
                pileStartPosition.y + (7 + (i * 0.1) - (0.1 * pileIndex)),
                pileStartPosition.z - 6.5 + (pileIndex * 4.5)
            );

            setTimeout(() => {
                animateCardJump(card, startPosition, targetPosition, duration, () => {
                    animateCardJump(card, nextPosition, finalTargetPosition, duration, () => {
                        animateCardJump(card, finalTargetPosition, lastPosition, duration);
                    });
                });
            }, ((pileIndex + 1) * 650 - i * 50));
        }
    });
}

function snapCardToPosition(card, targetPosition, duration = 300) {
    if (card.userData.isAnimating) {
        return;
    }

    card.userData.isAnimating = true;
    const startPosition = card.position.clone();
    const buffTargetPosition = targetPosition.clone();
    const startTime = performance.now();

    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        card.position.lerpVectors(startPosition, buffTargetPosition, progress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            card.userData.isAnimating = false;
        }
    }
    animate();
}

function win() {
    tableauPiles.forEach(pile => {
        pile.cards.forEach(card => {
            scene.remove(card);
        });
        pile.cards = [];
    });

    drawPile.forEach(card => {
        scene.remove(card);
    });
    drawPile = [];

    revealedCards.forEach(card => {
        scene.remove(card);
    });
    revealedCards = [];

    victoryPiles.forEach(pile => {
        pile.cards = [];

        for (let index = 0; index < 13; index++) {
            const card = createCard(pile.suit, values[index], true);

            let newPosition = pile.position.clone();
            newPosition.y += index * 0.05;

            card.position.set(newPosition.x, newPosition.y, newPosition.z);
            card.rotation.set(-Math.PI / 2, Math.PI, 0);

            pile.cards.push(card);
            scene.add(card);
        }
    });
    gameWon = true;
    backgroundMusic.setVolume(0);
    muteMusic.textContent = "Unmute";
    volumeMusicSlider.disabled = true;
    isMusicMuted = true;

    victorySound.play();
    animateVictoryCards();
    displayVictoryUI();
}

window.win = win;

function resetGame() {
    location.reload();
}

animate();
