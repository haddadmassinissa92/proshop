// controllers/assistant.controller.js
//
// Assistant d'achat conversationnel : le client décrit ce qu'il cherche en
// langage naturel ("un PC pour le montage vidéo, budget 150000 DA"), et
// l'IA interroge le VRAI catalogue produits (via function calling / tool
// use) avant de répondre — jamais de produit inventé, jamais de prix
// halluciné. C'est ce qui distingue cette fonctionnalité d'un simple
// "wrapper" autour d'un prompt : la réponse est toujours ancrée dans les
// données réelles de la base.
//
// Utilise Groq (https://groq.com) — compte gratuit, sans carte bancaire,
// compatible avec l'API OpenAI (voir .env.example pour la clé à configurer).

const Groq = require('groq-sdk');
const Product = require('../models/product.model');

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) return null;
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

// Le modèle a le droit d'appeler cet unique outil, autant de fois qu'il en
// a besoin, pour interroger le catalogue avant de répondre.
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'search_products',
            description: "Recherche des produits dans le catalogue ProShop selon un budget et/ou des mots-clés (nom, marque, type de matériel). À utiliser AVANT toute recommandation, pour ne jamais inventer de produit ou de prix.",
            parameters: {
                type: 'object',
                properties: {
                    keywords: {
                        type: 'string',
                        description: "Mots-clés à chercher dans le nom, la marque ou la description (ex: 'gaming', 'portable', 'clavier mécanique').",
                    },
                    maxPrice: {
                        type: 'number',
                        description: 'Budget maximum en Dinars Algériens (DA).',
                    },
                    minPrice: {
                        type: 'number',
                        description: 'Budget minimum en Dinars Algériens (DA), si pertinent.',
                    },
                },
            },
        },
    },
];

// Exécute réellement la recherche demandée par le modèle, contre MongoDB.
const runProductSearch = async ({ keywords, minPrice, maxPrice }) => {
    const query = {};

    if (keywords && keywords.trim() !== '') {
        query.$or = [
            { name: { $regex: keywords, $options: 'i' } },
            { brand: { $regex: keywords, $options: 'i' } },
            { description: { $regex: keywords, $options: 'i' } },
        ];
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
    }

    // On ne garde que les produits en stock, et un nombre limité de
    // résultats — pas la peine de saturer le contexte du modèle avec 40
    // produits, 8 bons candidats suffisent largement pour une recommandation.
    const products = await Product.find({ ...query, countInStock: { $gt: 0 } })
        .select('name brand price countInStock images description')
        .limit(8);

    return products;
};

// Modèle utilisé pour l'assistant. Groq fait évoluer régulièrement sa liste
// de modèles disponibles (dépréciations avec migration recommandée) — si
// cette constante se met un jour à renvoyer une erreur "model_not_found",
// va vérifier le modèle actuellement recommandé sur
// https://console.groq.com/docs/models (ou https://console.groq.com/docs/deprecations)
// et remplace la valeur ci-dessous.
const MODEL = 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `Tu es l'assistant d'achat du site ProShop, une boutique algérienne de matériel informatique.

Règles strictes :
- Utilise TOUJOURS l'outil search_products avant de recommander quoi que ce soit — ne recommande jamais un produit ou un prix que tu n'as pas vu dans les résultats de recherche.
- Si la recherche ne renvoie aucun résultat pertinent, dis-le honnêtement plutôt que d'inventer un produit.
- Réponds en français, de façon concise et chaleureuse (2-4 phrases maximum), comme un vendeur compétent, pas comme une notice technique.
- Les prix sont en Dinars Algériens (DA).
- Ne recommande jamais plus de 3 produits à la fois.`;

// @desc    Conversation avec l'assistant d'achat — le frontend envoie
//          l'historique complet des messages à chaque appel (pas de
//          session côté serveur, plus simple et sans état à gérer).
// @route   POST /api/assistant/chat
// @access  Public
const chatWithAssistant = async (req, res) => {
    try {
        const groq = getGroqClient();
        if (!groq) {
            return res.status(503).json({ message: "L'assistant n'est pas encore configuré côté serveur." });
        }

        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: 'Aucun message fourni.' });
        }

        const conversation = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
        ];

        // Premier appel : le modèle décide s'il a besoin de chercher des produits.
        let completion = await groq.chat.completions.create({
            model: MODEL,
            messages: conversation,
            tools: TOOLS,
            tool_choice: 'auto',
        });

        let responseMessage = completion.choices[0].message;
        let foundProducts = [];

        // Si le modèle a demandé à utiliser l'outil de recherche, on
        // l'exécute réellement, puis on lui renvoie les résultats pour
        // qu'il formule sa réponse finale à partir de vraies données.
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            conversation.push(responseMessage);

            for (const toolCall of responseMessage.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments || '{}');
                const products = await runProductSearch(args);
                foundProducts = products; // on garde la dernière recherche pour l'affichage frontend

                conversation.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(products.map(p => ({
                        id: p._id,
                        name: p.name,
                        brand: p.brand,
                        price: p.price,
                        countInStock: p.countInStock,
                    }))),
                });
            }

            // Deuxième appel : réponse finale, ancrée dans les résultats réels.
            completion = await groq.chat.completions.create({
                model: MODEL,
                messages: conversation,
            });
            responseMessage = completion.choices[0].message;
        }

        res.status(200).json({
            reply: responseMessage.content,
            products: foundProducts,
        });
    } catch (error) {
        console.error('Erreur assistant IA:', error);
        res.status(500).json({ message: "L'assistant a rencontré une erreur, réessaie dans un instant.", error: error.message });
    }
};

module.exports = { chatWithAssistant };
