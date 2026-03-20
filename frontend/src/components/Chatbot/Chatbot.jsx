// AI Chatbot Component — Context-aware health advisory assistant
import { useState, useRef, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { sendChatMessage } from '../../services/api';
import { FiMessageCircle, FiSend, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import './Chatbot.css';

// Local health knowledge for when backend is unavailable
const LOCAL_RESPONSES = {
    mask: `## 😷 Mask Recommendations\n\n| AQI | Mask Type | Filtration |\n|-----|-----------|------------|\n| 101-150 | N95 | 95% |\n| 151-200 | N95/KN95 | 95% |\n| 201-300 | N99/P100 | 99%+ |\n| 300+ | P100 Respirator | 99.97% |\n\n**Tip:** Ensure proper seal around nose and chin. Cloth masks are NOT effective against PM2.5.`,
    doctor: `## 🏥 When to See a Doctor\n\n- **Pulmonologist**: Persistent cough, wheezing, breathing difficulty\n- **Cardiologist**: Chest pain, palpitations during high AQI\n- **Allergist**: Recurring allergies, eye/nose irritation\n- **Pediatric Pulmonologist**: Children with breathing issues\n\n**Emergency (call 108):** Severe breathing difficulty, blue lips, chest pressure`,
    purifier: `## 🏠 Air Purifier Guide\n\n- Use **HEPA H13/H14** grade filters\n- Min CADR: 300 m³/h for 30m² rooms\n- Run 24/7 during high AQI\n- Replace filters every 3-6 months\n- Keep windows closed when running`,
    exercise: `## 🏃 Exercise During Bad Air Quality\n\n- AQI > 100: Move indoors\n- AQI > 150: Reduce intensity by 50%\n- AQI > 200: Avoid strenuous activity\n- Best time: early morning 5-7 AM\n- Indoor alternatives: yoga, swimming, light weights`,
    children: `## 👶 Protecting Children\n\n- Children breathe faster, more vulnerable to pollution\n- Keep indoors when AQI > 100\n- Use child-sized N95 masks\n- Watch for: coughing, wheezing, eye irritation\n- Ensure schools have HEPA filtration`,
};

function getLocalResponse(message, aqi, region) {
    const msg = message.toLowerCase();

    for (const [key, response] of Object.entries(LOCAL_RESPONSES)) {
        if (msg.includes(key)) {
            return `**📍 ${region}** | AQI: ${aqi}\n\n${response}`;
        }
    }

    // Default AQI info
    let level = 'Good';
    let advice = '✅ Air quality is satisfactory. Enjoy outdoor activities!';
    if (aqi > 300) { level = 'Hazardous'; advice = '🚨 STAY INDOORS. Use air purifiers. Avoid all outdoor activity.'; }
    else if (aqi > 200) { level = 'Very Unhealthy'; advice = '⚠️ Everyone should avoid outdoor exertion. Use N95 masks.'; }
    else if (aqi > 150) { level = 'Unhealthy'; advice = '😷 Everyone may experience health effects. Limit outdoor time.'; }
    else if (aqi > 100) { level = 'Unhealthy for Sensitive'; advice = '⚠️ Sensitive groups should limit outdoor activity.'; }
    else if (aqi > 50) { level = 'Moderate'; advice = 'Acceptable air quality. Sensitive individuals should be cautious.'; }

    return `**📍 ${region}** | **AQI: ${aqi}** — ${level}\n\n${advice}\n\n---\n\nI can help you with:\n- 😷 **Mask** recommendations\n- 🏥 **Doctor** consultation advice\n- 🏠 **Purifier** selection\n- 🏃 **Exercise** guidelines\n- 👶 **Children** protection\n\nJust ask about any topic!`;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '👋 Hello! I\'m your AQI Health Assistant. I know the air quality of your selected region. Ask me about health risks, masks, or medical advice!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { coordinates, regionName } = useLocation();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [currentAqi] = useState(85);  // Will be updated from context

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        // Try backend first
        const response = await sendChatMessage(
            userMessage,
            coordinates.lat,
            coordinates.lon,
            currentAqi,
            regionName
        );

        let assistantMessage;
        if (response?.response) {
            assistantMessage = response.response;
        } else {
            // Use local knowledge base
            assistantMessage = getLocalResponse(userMessage, currentAqi, regionName);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick prompts
    const quickPrompts = [
        '😷 Mask recommendations',
        '🏥 Which doctor?',
        '🌡️ Current air quality',
        '🏠 Air purifier guide',
        '👶 Child safety tips'
    ];

    if (!isOpen) {
        return (
            <button className="chatbot-fab" onClick={() => { setIsOpen(true); }} id="chatbot-toggle">
                <FiMessageCircle />
                <span className="fab-pulse" />
            </button>
        );
    }

    return (
        <div className={`chatbot-container ${isExpanded ? 'expanded' : ''}`}>
            {/* Header */}
            <div className="chatbot-header">
                <div className="chatbot-title">
                    <span className="chatbot-icon">🤖</span>
                    <div>
                        <strong>AQI Health Assistant</strong>
                        <span className="chatbot-region">📍 {regionName}</span>
                    </div>
                </div>
                <div className="chatbot-actions">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="chatbot-btn">
                        {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="chatbot-btn">
                        <FiX />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.content.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line.startsWith('##') ? <strong>{line.replace(/^#+\s*/, '')}</strong> :
                                        line.startsWith('- ') ? <span>• {line.slice(2)}</span> :
                                            line.startsWith('|') ? <span className="table-line">{line}</span> :
                                                line.startsWith('**') ? <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /> :
                                                    line}
                                    <br />
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="chat-message assistant">
                        <div className="message-bubble loading-bubble">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 2 && (
                <div className="quick-prompts">
                    {quickPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            className="quick-prompt-btn"
                            onClick={() => { setInput(prompt); handleSend(); setInput(prompt); }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="chatbot-input">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about health, masks, doctors..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    id="chatbot-input"
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    id="chatbot-send"
                >
                    <FiSend />
                </button>
            </div>
        </div>
    );
}
