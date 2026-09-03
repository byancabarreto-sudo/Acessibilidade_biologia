
/* =========================================================
   LABORATÓRIO DE BIOLOGIA OCULAR
   SISTEMA COMPLETO DE INTERAÇÃO E ACESSIBILIDADE

   Este arquivo utiliza o HTML e o CSS existentes.
   Não é necessário alterar o index.html ou style.css.
========================================================= */


/* =========================================================
   UTILIDADES
========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => document.querySelectorAll(selector);


/* =========================================================
   STATUS PARA LEITORES DE TELA
========================================================= */

const liveRegion = $("#liveRegion");


function announce(message) {

    if (!liveRegion || !message) {
        return;
    }

    liveRegion.textContent = "";

    /*
        Pequeno atraso para garantir que leitores de tela
        percebam uma nova mensagem mesmo que ela seja igual
        à anterior.
    */

    setTimeout(() => {

        liveRegion.textContent = message;

    }, 50);
}


/* =========================================================
   ACESSIBILIDADE — CONTRASTE
========================================================= */

const btnContrast = $("#btnContrast");


if (btnContrast) {

    btnContrast.addEventListener("click", () => {

        document.body.classList.toggle("high-contrast");

        const enabled =
            document.body.classList.contains("high-contrast");

        localStorage.setItem(
            "ocularHighContrast",
            enabled
        );

        announce(
            enabled
                ? "Alto contraste ativado."
                : "Alto contraste desativado."
        );

    });

}


/* =========================================================
   ACESSIBILIDADE — INVERSÃO
========================================================= */

const btnInvert = $("#btnInvert");


if (btnInvert) {

    btnInvert.addEventListener("click", () => {

        document.body.classList.toggle("inverted");

        const enabled =
            document.body.classList.contains("inverted");

        localStorage.setItem(
            "ocularInverted",
            enabled
        );

        announce(
            enabled
                ? "Inversão de cores ativada."
                : "Inversão de cores desativada."
        );

    });

}


/* =========================================================
   ACESSIBILIDADE — TAMANHO DA FONTE
========================================================= */

let fontScale =
    parseFloat(
        localStorage.getItem(
            "ocularFontScale"
        )
    ) || 1;


function applyFontScale() {

    /*
        Mantém a variável utilizada pelo CSS.
    */

    document.documentElement.style.setProperty(
        "--font-scale",
        fontScale
    );

    localStorage.setItem(
        "ocularFontScale",
        fontScale
    );

}


applyFontScale();


const btnFontPlus = $("#btnFontPlus");
const btnFontMinus = $("#btnFontMinus");
const btnFontReset = $("#btnFontReset");


if (btnFontPlus) {

    btnFontPlus.addEventListener("click", () => {

        fontScale =
            Math.min(
                1.6,
                +(fontScale + 0.1).toFixed(2)
            );

        applyFontScale();

        announce(
            `Tamanho do texto aumentado para ${Math.round(fontScale * 100)} por cento.`
        );

    });

}


if (btnFontMinus) {

    btnFontMinus.addEventListener("click", () => {

        fontScale =
            Math.max(
                0.8,
                +(fontScale - 0.1).toFixed(2)
            );

        applyFontScale();

        announce(
            `Tamanho do texto reduzido para ${Math.round(fontScale * 100)} por cento.`
        );

    });

}


if (btnFontReset) {

    btnFontReset.addEventListener("click", () => {

        fontScale = 1;

        applyFontScale();

        announce(
            "Tamanho do texto restaurado para 100 por cento."
        );

    });

}


/* =========================================================
   RESTAURAÇÃO DAS CONFIGURAÇÕES
========================================================= */

if (
    localStorage.getItem(
        "ocularHighContrast"
    ) === "true"
) {

    document.body.classList.add(
        "high-contrast"
    );

}


if (
    localStorage.getItem(
        "ocularInverted"
    ) === "true"
) {

    document.body.classList.add(
        "inverted"
    );

}


/* =========================================================
   SISTEMA DE VOZ
========================================================= */

const speechSupported =
    "speechSynthesis" in window;

let speechQueue = [];

let speechIndex = 0;

let isSpeaking = false;

let speechTimer = null;


/*
    Divide textos longos em partes menores.
*/

function splitTextForSpeech(text) {

    if (!text) {
        return [];
    }

    const cleanText =
        text
            .replace(/\s+/g, " ")
            .trim();

    if (!cleanText) {
        return [];
    }

    const sentences =
        cleanText.split(
            /(?<=[.!?])\s+/
        );

    const chunks = [];

    let currentChunk = "";

    const MAX_CHARS = 300;


    sentences.forEach(sentence => {

        sentence = sentence.trim();

        if (!sentence) {
            return;
        }


        if (sentence.length > MAX_CHARS) {

            const smaller =
                sentence.split(
                    /(?<=[,;:])\s+/
                );


            smaller.forEach(part => {

                part = part.trim();

                if (!part) {
                    return;
                }


                if (
                    currentChunk.length +
                    part.length >
                    MAX_CHARS
                ) {

                    if (currentChunk.trim()) {

                        chunks.push(
                            currentChunk.trim()
                        );

                    }

                    currentChunk = part;

                } else {

                    currentChunk +=
                        currentChunk
                            ? " " + part
                            : part;

                }

            });


        } else {

            if (
                currentChunk.length +
                sentence.length >
                MAX_CHARS
            ) {

                if (currentChunk.trim()) {

                    chunks.push(
                        currentChunk.trim()
                    );

                }

                currentChunk = sentence;

            } else {

                currentChunk +=
                    currentChunk
                        ? " " + sentence
                        : sentence;

            }

        }

    });


    if (currentChunk.trim()) {

        chunks.push(
            currentChunk.trim()
        );

    }


    return chunks;
}


/*
    Inicia uma leitura.
*/

function speak(text) {

    if (!speechSupported) {

        announce(
            "A síntese de voz não está disponível neste navegador."
        );

        return;

    }


    stopSpeech(false);


    speechQueue =
        splitTextForSpeech(text);

    speechIndex = 0;

    isSpeaking = true;

    speakNextChunk();

}


/*
    Lê o próximo bloco.
*/

function speakNextChunk() {

    if (
        !isSpeaking ||
        speechIndex >= speechQueue.length
    ) {

        isSpeaking = false;

        speechQueue = [];

        speechIndex = 0;

        return;

    }


    const utterance =
        new SpeechSynthesisUtterance(
            speechQueue[speechIndex]
        );


    utterance.lang = "pt-BR";

    utterance.rate = 0.85;

    utterance.pitch = 1;

    utterance.volume = 1;


    utterance.onend = () => {

        if (!isSpeaking) {
            return;
        }

        speechIndex++;


        speechTimer =
            setTimeout(
                speakNextChunk,
                250
            );

    };


    utterance.onerror = () => {

        if (!isSpeaking) {
            return;
        }

        speechIndex++;

        speechTimer =
            setTimeout(
                speakNextChunk,
                250
            );

    };


    window.speechSynthesis.speak(
        utterance
    );

}


/*
    Para a leitura.
*/

function stopSpeech(showMessage = true) {

    isSpeaking = false;

    speechQueue = [];

    speechIndex = 0;


    if (speechTimer) {

        clearTimeout(
            speechTimer
        );

        speechTimer = null;

    }


    if (speechSupported) {

        window.speechSynthesis.cancel();

    }


    if (showMessage) {

        announce(
            "Leitura interrompida."
        );

    }

}


/* =========================================================
   BOTÕES DE LEITURA
========================================================= */

const btnRead = $("#btnRead");

const btnStopSpeech =
    $("#btnStopSpeech");


if (btnRead) {

    btnRead.addEventListener(
        "click",
        () => {

            const main =
                document.querySelector("main");

            if (!main) {
                return;
            }

            speak(main.innerText);

            announce(
                "Iniciando leitura da página."
            );

        }
    );

}


if (btnStopSpeech) {

    btnStopSpeech.addEventListener(
        "click",
        () => {

            stopSpeech();

        }
    );

}


/* =========================================================
   LEITURA DOS CONCEITOS
========================================================= */

$$(".read-button").forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const target =
                document.getElementById(
                    button.dataset.readTarget
                );


            if (!target) {
                return;
            }


            speak(
                target.textContent
            );


            announce(
                `Lendo ${target.textContent}`
            );

        }
    );

});


/* =========================================================
   INFORMAÇÕES ANATÔMICAS
========================================================= */

const anatomyDescription =
    $("#anatomyDescription");


const anatomyInfo = {

    cornea: {
        name: "Córnea",
        text:
            "A córnea é a camada transparente localizada na parte anterior do olho. Ela protege as estruturas internas e participa da refração da luz."
    },


    iris: {
        name: "Íris",
        text:
            "A íris é a estrutura pigmentada localizada atrás da córnea. Seus músculos controlam o tamanho da pupila e ajudam a regular a quantidade de luz que entra no olho."
    },


    pupil: {
        name: "Pupila",
        text:
            "A pupila é a abertura central da íris. A luz atravessa essa abertura para entrar no interior do olho."
    },


    lens: {
        name: "Cristalino",
        text:
            "O cristalino é uma estrutura transparente localizada atrás da íris. Ele contribui para focalizar a luz sobre a retina e pode mudar de forma durante a acomodação."
    },


    retina: {
        name: "Retina",
        text:
            "A retina é um tecido neural localizado na parte interna posterior do olho. Ela contém cones, bastonetes e outros tipos de células envolvidos no processamento inicial das informações visuais."
    },


    macula: {
        name: "Mácula",
        text:
            "A mácula é uma região especializada da retina relacionada principalmente à visão central detalhada."
    },


    fovea: {
        name: "Fóvea",
        text:
            "A fóvea é uma pequena região localizada no centro da mácula. Ela apresenta alta concentração de cones e está associada à maior acuidade visual."
    },


    "optic-nerve": {
        name: "Nervo óptico",
        text:
            "O nervo óptico é formado principalmente pelos axônios das células ganglionares da retina. Ele conduz informações visuais da retina em direção ao cérebro."
    }

};


/* =========================================================
   INTERAÇÃO COM AS ESTRUTURAS DO OLHO
========================================================= */

$$(".eye-part[data-part]").forEach(part => {

    function explainAnatomy() {

        const key =
            part.dataset.part;

        const information =
            anatomyInfo[key];


        if (!information) {
            return;
        }


        if (anatomyDescription) {

            anatomyDescription.textContent =
                `${information.name}: ${information.text}`;

        }


        announce(
            `${information.name}. ${information.text}`
        );


        speak(
            `${information.name}. ${information.text}`
        );

    }


    part.addEventListener(
        "click",
        explainAnatomy
    );


    part.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.prevent
