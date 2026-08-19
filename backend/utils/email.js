// utils/email.js
//
// Envoi de l'email de confirmation de commande, via Resend
// (https://resend.com — compte gratuit jusqu'à 3000 emails/mois).
//
// IMPORTANT à savoir avant la mise en prod :
// Tant que tu n'as pas vérifié ton propre nom de domaine sur Resend
// (Domains -> Add Domain, avec quelques enregistrements DNS à ajouter chez
// ton hébergeur de domaine), tu ne peux envoyer des emails QU'À l'adresse
// avec laquelle tu as créé ton compte Resend — impossible d'envoyer à de
// vrais clients. C'est volontaire de leur part (anti-spam). Pour un vrai
// lancement, il faudra donc un nom de domaine (ex: proshop-dz.com) et le
// vérifier sur Resend ; en attendant, EMAIL_FROM peut rester sur leur
// domaine de test "onboarding@resend.dev".

const { Resend } = require('resend');

const getResend = () => {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
};

// Construit le tableau HTML récapitulant les articles commandés.
const buildItemsHtml = (orderItems) => {
    return orderItems.map(item => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${item.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;">${item.price.toLocaleString('fr-FR')} DA</td>
        </tr>
    `).join('');
};

// @desc  Envoie l'email de confirmation d'une commande au client.
//        N'échoue jamais bruyamment : si Resend n'est pas configuré ou que
//        l'envoi échoue, on log l'erreur mais on ne bloque jamais la
//        commande elle-même (voir les appels dans order.controller.js /
//        payment.controller.js, toujours entourés d'un try/catch dédié).
const sendOrderConfirmationEmail = async ({ to, userName, order }) => {
    const resend = getResend();
    if (!resend) {
        console.warn("[email] RESEND_API_KEY non configuré — email de confirmation non envoyé.");
        return;
    }

    const orderUrl = `${process.env.CLIENT_URL}/order/${order._id}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h1 style="color: #6366f1;">Merci pour votre commande, ${userName} !</h1>
        <p>Votre commande <strong>#${order._id.toString().slice(-6)}</strong> a bien été enregistrée.</p>

        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background:#f8fafc;">
                    <th style="padding:8px 0; text-align:left;">Article</th>
                    <th style="padding:8px 0; text-align:center;">Qté</th>
                    <th style="padding:8px 0; text-align:right;">Prix</th>
                </tr>
            </thead>
            <tbody>
                ${buildItemsHtml(order.orderItems)}
            </tbody>
        </table>

        <p style="text-align:right; font-size: 1.1em;"><strong>Total : ${order.totalPrice.toLocaleString('fr-FR')} DA</strong></p>

        <p><strong>Adresse de livraison :</strong><br/>
        ${order.shippingAddress.address}, ${order.shippingAddress.city} (${order.shippingAddress.postalCode})</p>

        <p><strong>Mode de paiement :</strong> ${order.paymentMethod}</p>

        <p style="margin-top: 30px;">
            <a href="${orderUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
                Voir ma commande
            </a>
        </p>

        <p style="color:#94a3b8; font-size:0.85em; margin-top:40px;">ProShop — Merci de votre confiance.</p>
    </div>
    `;

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to,
            subject: `Confirmation de votre commande ProShop #${order._id.toString().slice(-6)}`,
            html,
        });
    } catch (error) {
        console.error("[email] Échec de l'envoi de l'email de confirmation :", error.message);
    }
};

module.exports = { sendOrderConfirmationEmail };
