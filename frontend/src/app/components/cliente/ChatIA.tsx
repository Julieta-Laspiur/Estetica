import { useState } from 'react';
import { Send, Sparkles, User, Bot } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export function ChatIA() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: '¡Hola! Soy tu asistente de belleza con IA. Puedo ayudarte a encontrar los productos y tratamientos perfectos para tu tipo de piel. ¿Qué tipo de piel tienes? (seca, grasa, mixta, sensible)',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const respuestasIA: { [key: string]: string } = {
        'seca': 'Para piel seca te recomiendo:\n\n✨ Crema Hidratante Premium de La Roche-Posay - Hidratación profunda 24h\n💧 Sérum con Ácido Hialurónico - Retiene la humedad\n🧴 Facial Hidratante - Tratamiento intensivo\n\n¿Te gustaría saber más sobre alguno de estos productos?',
        'grasa': 'Para piel grasa te recomiendo:\n\n🎭 Máscara Facial Purificante de Natura - Control de brillo\n💧 Sérum Vitamina C - Regula la producción de sebo\n✨ Limpieza Facial Profunda - Limpia poros en profundidad\n\n¿Necesitas más información sobre estos productos?',
        'mixta': 'Para piel mixta te recomiendo:\n\n🧴 Crema equilibrante - Hidrata sin engrasar\n💧 Tónico Facial - Equilibra el pH\n☀️ Protector Solar FPS 50+ - Textura ligera\n\n¿Te interesa algún tratamiento facial específico?',
        'sensible': 'Para piel sensible te recomiendo:\n\n🧴 Crema calmante sin fragancia\n💧 Sérum con ingredientes naturales\n✨ Facial Hidratante suave\n\n¿Tienes alguna alergia o ingrediente que debas evitar?',
        'arrugas': 'Para tratamiento antiarrugas te recomiendo:\n\n👑 Tratamiento Antiarrugas - Tecnología de última generación\n💧 Sérum Vitamina C - Antioxidante potente\n✨ Radiofrecuencia facial - Resultados visibles\n\n¿Qué zona te gustaría tratar específicamente?',
        'acne': 'Para tratar el acné te recomiendo:\n\n🎭 Limpieza Facial Profunda - Elimina impurezas\n💧 Tratamiento con ácido salicílico\n✨ Máscara Purificante - Controla brillo\n\n¿El acné es leve, moderado o severo?'
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const lowerInput = inputMessage.toLowerCase();
            let botResponse = 'Entiendo. ¿Podrías darme más detalles sobre tu tipo de piel o preocupaciones específicas? Por ejemplo: seca, grasa, mixta, sensible, arrugas, acné, manchas, etc.';

            // Check for keywords
            for (const [key, response] of Object.entries(respuestasIA)) {
                if (lowerInput.includes(key)) {
                    botResponse = response;
                    break;
                }
            }

            // Special cases
            if (lowerInput.includes('precio') || lowerInput.includes('costo') || lowerInput.includes('cuanto')) {
                botResponse = 'Los precios de nuestros productos varían:\n\n• Cremas: $1,800 - $3,200\n• Sérums: $2,500 - $3,500\n• Tratamientos faciales: $1,100 - $2,200\n\n¿Te gustaría reservar un turno para algún tratamiento?';
            } else if (lowerInput.includes('turno') || lowerInput.includes('reserva') || lowerInput.includes('cita')) {
                botResponse = '¡Perfecto! Puedes reservar tu turno fácilmente desde la sección "Reservar Turno" del menú. ¿Necesitas ayuda con algo más?';
            } else if (lowerInput.includes('hola') || lowerInput.includes('ayuda')) {
                botResponse = '¡Hola! Estoy aquí para ayudarte. Puedo:\n\n✨ Recomendarte productos según tu tipo de piel\n💆 Sugerirte tratamientos adecuados\n📅 Ayudarte con la reserva de turnos\n💡 Responder dudas sobre cuidado de la piel\n\n¿Qué necesitas?';
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-200px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Consultorio con IA</h1>
                <p className="text-muted-foreground">Recibe recomendaciones personalizadas para tu piel</p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-white rounded-xl shadow-md border border-border flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.sender === 'bot' && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.sender === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-secondary text-foreground'
                                    }`}
                            >
                                <p className="whitespace-pre-line">{message.text}</p>
                                <p
                                    className={`text-xs mt-1 ${message.sender === 'user' ? 'text-purple-200' : 'text-muted-foreground'
                                        }`}
                                >
                                    {message.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {message.sender === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-primary-foreground" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-secondary rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-border p-4 bg-secondary/30">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim()}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {['Piel seca', 'Piel grasa', 'Antiarrugas', 'Acné'].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => setInputMessage(suggestion)}
                                className="px-3 py-1 bg-white border border-border rounded-full text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">Asistente Inteligente</h3>
                </div>
                <p className="text-sm opacity-90">
                    Este asistente utiliza inteligencia artificial para brindarte recomendaciones personalizadas basadas en tu tipo de piel y necesidades específicas.
                </p>
            </div>
        </div>
    );
}
