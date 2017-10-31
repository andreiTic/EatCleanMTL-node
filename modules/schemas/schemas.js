module.exports = {
    contrevenantSchema: {
        _id: "string",
        type: "object",
        required: true,
        additionalProperties: false,
        properties: {
            proprietaire: {
                type: "string",
                required: true
            },
            categorie: {
                type: "string",
                required: true
            },
            etablissement: {
                type: "string",
                required: true
            },
            adresse: {
                type: "string",
                required: true
            },
            ville: {
                type: "string",
                required: true
            },
            description: {
                type: "string",
                required: true
            },
            date_infraction: {
                type: "date",
                required: true
            },
            date_jugement: {
                type: "date",
                required: true
            },
            montant: {
                type: "string",
                required: true
            }
        }
    },

    survienantSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            nom: {
                type: "string",
                required: true
            },
            email: {
                type: "string",
                required: true
            },
            listeContrevenants: {
                type: "array",
                required: true,
                items: {
                    type: "string"
                }
            }
        }
    }
};
