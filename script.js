/* =========================================================
   SUBSTITUA SOMENTE O SISTEMA DE VOZ ORIGINAL POR ESTE
========================================================= */

const speechSupported =
    "speechSynthesis" in window;

let speechQueue = [];

let speechIndex = 0;

let isSpeaking = false;


/*
    Divide textos grandes em partes menores.
    Isso evita que o navegador corte textos extensos.
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


    /*
        Divide preferencialmente depois de
        pontuação para manter o sentido.
    */

    const sentences =
        cleanText.split(
            /(?<=[.!?])\s+/
        );


    const chunks = [];

    let currentChunk = "";

    const MAX_CHARS = 300;


    sentences.forEach(sentence => {

        if (
            sentence.length >
            MAX_CHARS
        ) {

            const smaller =
                sentence.split(
                    /(?<=[,;:])\s+/
                );


            smaller.forEach(part => {

                if (
                    currentChunk.length +
                    part.length >
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
                        " " + part;
                }

            });

        } else {

            if (
                currentChunk.length +
                sentence.length >
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
                    " " + sentence;
            }
        }

    });


    if (
        currentChunk.trim()
    ) {

        chunks.push(
            currentChunk.trim()
        );
    }


    return chunks;
}


/*
    Inicia a leitura.
*/

function speak(text) {

    if (!speechSupported) {

        announce(
            "A síntese de voz não está disponível neste navegador."
        );

        return;
    }


    /*
        Cancela qualquer leitura anterior.
    */

    window.speechSynthesis.cancel();


    speechQueue =
        splitTextForSpeech(text);

    speechIndex =
        0;

    isSpeaking =
        true;


    speakNextChunk();
}


/*
    Lê cada bloco automaticamente.
*/

function speakNextChunk() {

    if (
        !isSpeaking ||
        speechIndex >=
        speechQueue.length
    ) {

        isSpeaking =
            false;

        speechQueue =
            [];

        speechIndex =
            0;

        return;
    }


    const utterance =
        new SpeechSynthesisUtterance(
            speechQueue[
                speechIndex
            ]
        );


    utterance.lang =
        "pt-BR";


    /*
        Velocidade reduzida para melhorar
        a compreensão do conteúdo.
    */

    utterance.rate =
        0.85;


    utterance.pitch =
        1;


    utterance.volume =
        1;


    utterance.onend =
        () => {

            if (!isSpeaking) {
                return;
            }

            speechIndex++;

            /*
                Pequena pausa entre frases.
            */

            setTimeout(
                speakNextChunk,
                250
            );
        };


    utterance.onerror =
        () => {

            if (!isSpeaking) {
                return;
            }

            speechIndex++;

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
    Interrompe toda a fila.
*/

function stopSpeech() {

    isSpeaking =
        false;

    speechQueue =
        [];

    speechIndex =
        0;


    if (
        speechSupported
    ) {

        window.speechSynthesis.cancel();
    }


    announce(
        "Leitura interrompida."
    );
}


/* =========================================================
   LEITURA DA PÁGINA
========================================================= */

const btnRead =
    document.getElementById(
        "btnRead"
    );


const btnStopSpeech =
    document.getElementById(
        "btnStopSpeech"
    );


btnRead.addEventListener(
    "click",
    () => {

        const main =
            document.querySelector(
                "main"
            );

        speak(
            main.innerText
        );

    }
);


btnStopSpeech.addEventListener(
    "click",
    stopSpeech
);


/* =========================================================
   LEITURA DOS CONCEITOS
========================================================= */

document
    .querySelectorAll(
        ".read-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.readTarget
                    );

                if (target) {

                    speak(
                        target.textContent
                    );
                }

            }
        );

    });


/* =========================================================
   PARTES DO OLHO
========================================================= */

const anatomyDescription =
    document.getElementById(
        "anatomyDescription"
    );


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


document
    .querySelectorAll(
        ".eye-part[data-part]"
    )
    .forEach(part => {

        function explainAnatomy() {

            const key =
                part.dataset.part;

            const information =
                anatomyInfo[key];


            if (!information) {
                return;
            }


            anatomyDescription.textContent =
                `${information.name}: ${information.text}`;


            speak(
                `${information.name}. ${information.text}`
            );


            announce(
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

                    event.preventDefault();

                    explainAnatomy();
                }

            }
        );

    });