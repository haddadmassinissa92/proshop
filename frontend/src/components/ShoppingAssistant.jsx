// src/components/ShoppingAssistant.jsx
//
// Widget de chat flottant : assistant d'achat IA. Le client décrit ce
// qu'il cherche en langage naturel, l'assistant interroge le vrai
// catalogue (côté backend, via function calling) et répond avec de vraies
// recommandations, cliquables vers la fiche produit.

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCommentDots, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import '../styles/ShoppingAssistant.css';
import { API_URL, getMediaUrl } from '../api/api';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Salut 👋 Dis-moi ce que tu cherches (ton usage, ton budget...) et je te propose ce qui correspond dans notre catalogue.",
  products: [],
};

const ShoppingAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // On envoie l'historique complet à chaque appel (le backend n'a pas
      // de session/état — plus simple, et suffisant pour une conversation
      // courte comme celle-ci). On ne renvoie que role+content, sans les
      // "products" attachés côté affichage, que le backend n'attend pas.
      const history = nextMessages.map(({ role, content }) => ({ role, content }));
      const { data } = await axios.post(`${API_URL}/api/assistant/chat`, { messages: history });

      setMessages([...nextMessages, {
        role: 'assistant',
        content: data.reply,
        products: data.products || [],
      }]);
    } catch (err) {
      setMessages([...nextMessages, {
        role: 'assistant',
        content: err.response?.data?.message || "Désolé, je n'arrive pas à répondre pour le moment.",
        products: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant pour ouvrir/fermer le widget */}
      <button
        className="assistant-toggle-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ouvrir l'assistant d'achat"
      >
        {open ? <FaTimes /> : <FaCommentDots />}
      </button>

      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <FaRobot /> Assistant ProShop
          </div>

          <div className="assistant-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`assistant-msg ${msg.role}`}>
                <p>{msg.content}</p>

                {/* Recommandations produits, rendues comme de vraies cartes
                    cliquables — jamais juste du texte généré par l'IA. */}
                {msg.products && msg.products.length > 0 && (
                  <div className="assistant-product-list">
                    {msg.products.slice(0, 3).map((p) => (
                      <Link to={`/product/${p._id || p.id}`} key={p._id || p.id} className="assistant-product-card">
                        {p.images && p.images[0] && (
                          <img src={getMediaUrl(p.images[0])} alt={p.name} />
                        )}
                        <div>
                          <strong>{p.name}</strong>
                          <span>{p.price?.toLocaleString()} DA</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="assistant-msg assistant">
                <p className="assistant-typing">L'assistant réfléchit...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="assistant-input-row" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Ex: un PC pour le montage vidéo, 150000 DA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Envoyer">
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ShoppingAssistant;
