/* =========================================================
   LABORATÓRIO DE BIOLOGIA OCULAR
   SISTEMA DE INTERAÇÃO E ACESSIBILIDADE
   ========================================================= */

"use strict";

/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   REGIÃO PARA LEITORES DE TELA
   ========================================================= */

const liveRegion = $("#liveRegion");

function announce(message) {
    if (!liveRegion || !message) return;

    liveRegion.textContent = "";

    setTimeout(() => {
        liveRegion.textContent = message;
    }, 50);
}


/* =========================================================
   ACESSIBILIDADE — ALTO CONTRASTE
   ========================================================= */

const btnContrast = $("#btnContrast");

if (btnContrast) {

    btnContrast.addEventListener("click", () => {

        document.body.classList.toggle("high-contrast");

        const enabled =
            document.body.classList.contains("high-contrast");

        localStorage.setItem(
            "ocularHighContrast",
            String(enabled)
        );

        announce(
            enabled
                ? "Alto contraste ativado."
                : "Alto contraste desativado."
        );

    });

}


/* =========================================================
   ACESSIBILIDADE — INVERSÃO DE CORES
   ========================================================= */

const btnInvert = $("#btnInvert");

if (btnInvert) {

    btnInvert.addEventListener("click", () => {

        document.body.classList.toggle("inverted");

        const enabled =
            document.body.classList.contains("inverted");

        localStorage.setItem(
            "ocularInverted",
            String(enabled)
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
        localStorage.getItem("ocularFontScale")
    ) || 1;

fontScale = Math.max(
    0.8,
    Math.min(1.8, fontScale)
);


function applyFontScale() {

    /*
       Variável CSS
    */

    document.documentElement.style.setProperty(
        "--font-scale",
        String(fontScale)
    );


    /*
       Aplicação direta no body.
       Isso garante que o tamanho seja alterado
       mesmo que o CSS não utilize --font-scale.
    */

    document.body.style.fontSize =
        `${fontScale * 100}%`;


    localStorage.setItem(
        "ocularFontScale",
        String(fontScale)
    );

}


applyFontScale();


const btnFontPlus = $("#btnFontPlus");
const btnFontMinus = $("#btnFontMinus");
const btnFontReset = $("#btnFontReset");


/* AUMENTAR */

if (btnFontPlus) {

    btnFontPlus.addEventListener("click", () => {

        fontScale =
            Math.min(
                1.8,
                Number(
                    (fontScale + 0.1).toFixed(2)
                )
            );

        applyFontScale();

        announce(
            `Tamanho do texto aumentado para ${Math.round(fontScale * 100)} por cento.`
        );

    });

}


/* DIMINUIR */

if (btnFontMinus) {

    btnFontMinus.addEventListener("click", () => {

        fontScale =
            Math.max(
                0.8,
                Number(
                    (fontScale - 0.1).toFixed(2)
                )
            );

        applyFontScale();

        announce(
            `Tamanho do texto reduzido para ${Math.round(fontScale * 100)} por cento.`
        );

    });

}


/* RESTAURAR */

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
   RESTAURAR CONFIGURAÇÕES SALVAS
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

let isPaused = false;

let speechTimer = null;

let currentUtterance = null;


/* =========================================================
   DIVIDIR TEXTO EM BLOCOS
   ========================================================= */

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

    const MAX_CHARS = 250;


    sentences.forEach(
        (sentence) => {

            sentence =
                sentence.trim();


            if (!sentence) {
                return;
            }


            /*
               Frases muito grandes
            */

            if (
                sentence.length >
                MAX_CHARS
            ) {

                const parts =
                    sentence.split(
                        /(?<=[,;:])\s+/
                    );


                parts.forEach(
                    (part) => {

                        part =
                            part.trim();


                        if (!part) {
                            return;
                        }


                        if (
                            currentChunk.length +
                            part.length +
                            1 >
                            MAX_CHARS
                        ) {

                            if (
                                currentChunk.trim()
                            ) {

                                chunks.push(
                                    currentChunk.trim()
                                );

                            }


                            currentChunk =
                                part;

                        } else {

                            currentChunk +=
                                currentChunk
                                    ? " " + part
                                    : part;

                        }

                    }
                );


            } else if (
                currentChunk.length +
                sentence.length +
                1 >
                MAX_CHARS
            ) {

                if (
                    currentChunk.trim()
                ) {

                    chunks.push(
                        currentChunk.trim()
                    );

                }


                currentChunk =
                    sentence;


            } else {

                currentChunk +=
                    currentChunk
                        ? " " + sentence
                        : sentence;

            }

        }
    );


    if (
        currentChunk.trim()
    ) {

        chunks.push(
            currentChunk.trim()
        );

    }


    return chunks;
}


/* =========================================================
   STATUS DA LEITURA
   ========================================================= */

function updateSpeechStatus(message) {

    announce(message);


    const status =
        $("#speechStatus");


    if (
        status &&
        status !== liveRegion
    ) {

        status.textContent =
            message;

    }

}


/* =========================================================
   INICIAR LEITURA
   ========================================================= */

function speak(
    text,
    restart = true
) {

    if (!speechSupported) {

        updateSpeechStatus(
            "A síntese de voz não está disponível neste navegador."
        );

        return;
    }


    if (
        !text ||
        !text.trim()
    ) {

        updateSpeechStatus(
            "Não há texto para leitura."
        );

        return;
    }


    if (restart) {

        window.speechSynthesis.cancel();


        if (speechTimer) {

            clearTimeout(
                speechTimer
            );

            speechTimer = null;

        }


        speechQueue =
            splitTextForSpeech(
                text
            );


        speechIndex = 0;

        isPaused = false;

    }


    if (
        !speechQueue.length
    ) {

        updateSpeechStatus(
            "Não há texto para leitura."
        );

        return;
    }


    isSpeaking = true;

    isPaused = false;


    speakNextChunk();

}


/* =========================================================
   LER PRÓXIMO BLOCO
   ========================================================= */

function speakNextChunk() {

    if (
        !isSpeaking ||
        isPaused
    ) {

        return;
    }


    if (
        speechIndex >=
        speechQueue.length
    ) {

        isSpeaking = false;

        isPaused = false;

        currentUtterance = null;


        updateSpeechStatus(
            "Leitura concluída."
        );

        return;
    }


    const text =
        speechQueue[
            speechIndex
        ];


    currentUtterance =
        new SpeechSynthesisUtterance(
            text
        );


    currentUtterance.lang =
        "pt-BR";


    currentUtterance.rate =
        0.85;


    currentUtterance.pitch =
        1;


    currentUtterance.volume =
        1;


    currentUtterance.onend =
        () => {

            if (
                !isSpeaking ||
                isPaused
            ) {

                return;
            }


            speechIndex++;


            speechTimer =
                setTimeout(
                    () => {

                        speechTimer =
                            null;

                        speakNextChunk();

                    },
                    100
                );

        };


    currentUtterance.onerror =
        (event) => {

            if (
                event.error ===
                    "canceled" ||
                event.error ===
                    "interrupted"
            ) {

                return;
            }


            if (!isSpeaking) {
                return;
            }


            speechIndex++;


            speechTimer =
                setTimeout(
                    () => {

                        speechTimer =
                            null;

                        speakNextChunk();

                    },
                    100
                );

        };


    window.speechSynthesis.speak(
        currentUtterance
    );

}


/* =========================================================
   PAUSAR
   ========================================================= */

function pauseSpeech() {

    if (
        !speechSupported ||
        !isSpeaking
    ) {

        return;
    }


    if (
        window.speechSynthesis
            .speaking
    ) {

        window.speechSynthesis.pause();

        isPaused = true;


        updateSpeechStatus(
            "Leitura pausada."
        );

    }

}


/* =========================================================
   CONTINUAR
   ========================================================= */

function resumeSpeech() {

    if (
        !speechSupported ||
        !isSpeaking
    ) {

        return;
    }


    if (isPaused) {

        isPaused = false;


        window.speechSynthesis.resume();


        updateSpeechStatus(
            "Continuando a leitura."
        );


        /*
           Segurança para navegadores que
           não retomam automaticamente.
        */

        setTimeout(
            () => {

                if (
                    isSpeaking &&
                    !isPaused &&
                    !window.speechSynthesis
                        .speaking
                ) {

                    speakNextChunk();

                }

            },
            150
        );

    }

}


/* =========================================================
   PARAR
   ========================================================= */

function stopSpeech(
    showMessage = true
) {

    isSpeaking = false;

    isPaused = false;


    if (speechTimer) {

        clearTimeout(
            speechTimer
        );

        speechTimer = null;

    }


    if (speechSupported) {

        window.speechSynthesis.cancel();

    }


    currentUtterance = null;


    if (showMessage) {

        updateSpeechStatus(
            "Leitura interrompida."
        );

    }

}


/* =========================================================
   BOTÃO — LER PÁGINA
   ========================================================= */

const btnRead =
    $("#btnRead");


if (btnRead) {

    btnRead.addEventListener(
        "click",
        () => {

            const main =
                $("main");


            if (!main) {

                updateSpeechStatus(
                    "Não foi encontrado o conteúdo principal da página."
                );

                return;
            }


            const text =
                main.innerText ||
                main.textContent ||
                "";


            speak(
                text,
                true
            );


            updateSpeechStatus(
                "Iniciando leitura da página."
            );

        }
    );

}


/* =========================================================
   BOTÃO — PARAR
   ========================================================= */

const btnStopSpeech =
    $("#btnStopSpeech");


if (btnStopSpeech) {

    btnStopSpeech.addEventListener(
        "click",
        () => {

            stopSpeech(
                true
            );

        }
    );

}


/* =========================================================
   BOTÃO — PAUSAR
   ========================================================= */

const btnPauseSpeech =
    $("#btnPauseSpeech");


if (btnPauseSpeech) {

    btnPauseSpeech.addEventListener(
        "click",
        () => {

            pauseSpeech();

        }
    );

}


/* =========================================================
   BOTÃO — CONTINUAR
   ========================================================= */

const btnResumeSpeech =
    $("#btnResumeSpeech");


if (btnResumeSpeech) {

    btnResumeSpeech.addEventListener(
        "click",
        () => {

            resumeSpeech();

        }
    );

}


/* =========================================================
   LEITURA DOS CONCEITOS
   ========================================================= */

$$(".read-button")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset
                            .readTarget;


                    const target =
                        document.getElementById(
                            targetId
                        );


                    if (!target) {

                        announce(
                            "Não foi encontrado o texto solicitado."
                        );

                        return;
                    }


                    const text =
                        target.innerText ||
                        target.textContent ||
                        "";


                    speak(
                        text,
                        true
                    );


                    announce(
                        `Lendo ${text}`
                    );

                }
            );

        }
    );


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
   INTERAÇÃO COM AS PARTES DO OLHO
   ========================================================= */

$$(
    ".eye-part[data-part]"
)
.forEach(
    (part) => {


        function explainAnatomy() {

            const key =
                part.dataset.part;


            const information =
                anatomyInfo[key];


            if (!information) {
                return;
            }


            if (
                anatomyDescription
            ) {

                anatomyDescription.textContent =
                    `${information.name}: ${information.text}`;

            }


            announce(
                `${information.name}. ${information.text}`
            );


            speak(
                `${information.name}. ${information.text}`,
                true
            );

        }


        /*
           Clique
        */

        part.addEventListener(
            "click",
            explainAnatomy
        );


        /*
           Teclado
        */

        part.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " " ||
                    event.code === "Space"
                ) {

                    event.preventDefault();

                    explainAnatomy();

                }

            }
        );


        /*
           Permite acesso pelo teclado
        */

        if (
            !part.hasAttribute(
                "tabindex"
            )
        ) {

            part.setAttribute(
                "tabindex",
                "0"
            );

        }


        /*
           Informa ao leitor de tela
           que é um botão.
        */

        if (
            !part.hasAttribute(
                "role"
            )
        ) {

            part.setAttribute(
                "role",
                "button"
            );

        }

    }
);


/* =========================================================
   ATALHO DE TECLADO — SHIFT + Z
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        /*
           Shift + Z
        */

        if (
            event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();


            const main =
                $("main");


            if (!main) {
                return;
            }


            /*
               Se estiver pausado,
               continua de onde parou.
            */

            if (
                isSpeaking &&
                isPaused
            ) {

                resumeSpeech();

                return;
            }


            /*
               Caso contrário,
               começa uma nova leitura.
            */

            const text =
                main.innerText ||
                main.textContent ||
                "";


            speak(
                text,
                true
            );


            updateSpeechStatus(
                "Leitura iniciada pelo atalho Shift + Z."
            );

        }

    }
);


/* =========================================================
   ACESSIBILIDADE DOS BOTÕES
   ========================================================= */

function addButtonFeedback(
    button
) {

    if (!button) {
        return;
    }


    button.addEventListener(
        "focus",
        () => {

            const label =
                button.getAttribute(
                    "aria-label"
                ) ||
                button.textContent.trim();


            if (label) {

                announce(
                    label
                );

            }

        }
    );

}


[
    btnContrast,
    btnInvert,
    btnFontPlus,
    btnFontMinus,
    btnFontReset,
    btnRead,
    btnStopSpeech,
    btnPauseSpeech,
    btnResumeSpeech
]
.forEach(
    (button) => {

        addButtonFeedback(
            button
        );

    }
);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.documentElement.style.setProperty(
    "--font-scale",
    String(fontScale)
);


console.log(
    "Sistema de acessibilidade carregado com sucesso."
);