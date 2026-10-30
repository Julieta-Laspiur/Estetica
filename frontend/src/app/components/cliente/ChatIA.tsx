import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Sparkles,
    User,
    Bot,
    Calendar,
    ShoppingCart,
    ShieldAlert,
    Clock,
    Check,
    AlertCircle,
    SlidersHorizontal,
    RefreshCw,
    Heart,
    Package
} from 'lucide-react';
import {
    chatIAApi,
    type RecomendacionPersonalizadaDto,
    type ProductoDto,
    type ServicioDto,
    type AuthUser
} from '../../../services/api';

interface MessageUI {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    esAclaracionMedicaOExterna?: boolean;
    productosRelacionados?: ProductoDto[];
    serviciosRelacionados?: ServicioDto[];
}

interface ChatIAProps {
    currentUser?: AuthUser | null;
    onAddToCart?: (productId: string, customItem?: { nombre: string; marca: string; precio: number; imagen?: string }) => void;
    onSelectService?: (serviceId: string) => void;
    wishlistIds?: string[];
    onToggleWishlist?: (productId: string, itemData?: { nombre: string; marca: string; precio: number; imagenUrl?: string; descripcion?: string }) => void;
}

const PROMPT_SUGGESTIONS = [
    {
        title: 'Piel Seca & Deshidratada',
        prompt: 'Tengo la piel seca con sensación de tirantez, ¿qué rutina y productos con hidratación profunda me recomiendan?',
        badge: 'Hidratación'
    },
    {
        title: 'Piel Grasa & Brillo',
        prompt: 'Tengo piel grasa y poros dilatados en zona T, ¿qué limpiadores y sérums seboreguladores tienen en stock?',
        badge: 'Control Sebo'
    },
    {
        title: 'Limpieza Facial Profunda',
        prompt: '¿Qué incluye la limpieza facial profunda en cabina y cuánto dura el turno?',
        badge: 'Servicio Estrella'
    },
    {
        title: 'Marcas Externas (Guardrail)',
        prompt: '¿Tienen cremas de CeraVe, Bioderma o La Roche-Posay para comprar hoy?',
        badge: 'Guardrail Catálogo'
    },
    {
        title: 'Consulta Médica (Guardrail)',
        prompt: '¿Me pueden recetar antibióticos o Roacután para curar un brote de acné severo?',
        badge: 'Guardrail Médico'
    }
];

export function ChatIA({ currentUser, onAddToCart, onSelectService, wishlistIds = [], onToggleWishlist }: ChatIAProps) {
    const [activeTab, setActiveTab] = useState<'chat' | 'perfil'>('chat');

    // Estado del Chatbot Conversacional
    const [messages, setMessages] = useState<MessageUI[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [addedCartIds, setAddedCartIds] = useState<Record<string, boolean>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Estado de Recomendaciones Personalizadas (HU-11)
    const [recomendacion, setRecomendacion] = useState<RecomendacionPersonalizadaDto | null>(null);
    const [loadingRecomendacion, setLoadingRecomendacion] = useState(false);
    const [errorRecomendacion, setErrorRecomendacion] = useState<string | null>(null);

    // Modal de Actualización de Biotipo / Diagnóstico de Piel
    const [showDiagModal, setShowDiagModal] = useState(false);
    const [selectedTipoPiel, setSelectedTipoPiel] = useState<string>('Mixta');
    const [alergiasInput, setAlergiasInput] = useState('');
    const [observacionInput, setObservacionInput] = useState('');
    const [savingDiag, setSavingDiag] = useState(false);

    // Scroll automático al final de los mensajes
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Cargar historial de chat si está autenticado
    useEffect(() => {
        let mounted = true;

        if (currentUser) {
            chatIAApi.getHistorial(20)
                .then(history => {
                    if (!mounted) return;
                    if (history && history.length > 0) {
                        const historyMsgs: MessageUI[] = [];
                        // El historial viene en orden descendente o cronológico; aseguramos orden temporal
                        const sorted = [...history].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

                        sorted.forEach(c => {
                            historyMsgs.push({
                                id: `hist-user-${c.conversacionId}`,
                                text: c.pregunta,
                                sender: 'user',
                                timestamp: new Date(c.fecha)
                            });
                            historyMsgs.push({
                                id: `hist-bot-${c.conversacionId}`,
                                text: c.respuesta,
                                sender: 'bot',
                                timestamp: new Date(c.fecha),
                                esAclaracionMedicaOExterna: c.esAclaracionMedicaOExterna,
                                productosRelacionados: c.productosRelacionados,
                                serviciosRelacionados: c.serviciosRelacionados
                            });
                        });
                        setMessages(historyMsgs);
                    } else {
                        setMessages([
                            {
                                id: 'initial-welcome',
                                text: `¡Hola ${currentUser.nombre}! Soy tu Asistente Dermatológico Inteligente 24/7 de nuestro centro.

Cuento con acceso en tiempo real a nuestro catálogo de servicios, inventario verificado en stock y tu perfil cutáneo. ¿En qué puedo orientarte hoy?`,
                                sender: 'bot',
                                timestamp: new Date()
                            }
                        ]);
                    }
                })
                .catch(() => {
                    if (mounted) {
                        setMessages([
                            {
                                id: 'initial-default',
                                text: `¡Hola ${currentUser.nombre}! Soy tu Asistente Inteligente de cuidado facial y corporal. ¿En qué tratamiento o producto puedo ayudarte hoy?`,
                                sender: 'bot',
                                timestamp: new Date()
                            }
                        ]);
                    }
                });
        } else {
            setMessages([
                {
                    id: 'guest-welcome',
                    text: '¡Hola! Te damos la bienvenida a nuestro centro estético. Soy el Asistente Dermatológico con Inteligencia Artificial.\n\nPuedo asesorarte sobre nuestros tratamientos en cabina, productos en stock y rutinas ideales para tu tipo de piel. ¡Escríbeme o elije una de las sugerencias rápidas!',
                    sender: 'bot',
                    timestamp: new Date()
                }
            ]);
        }

        return () => {
            mounted = false;
        };
    }, [currentUser]);

    // Cargar recomendaciones personalizadas cuando se abre la pestaña (HU-11)
    const cargarRecomendacion = () => {
        if (!currentUser) return;
        setLoadingRecomendacion(true);
        setErrorRecomendacion(null);

        chatIAApi.getRecomendacion()
            .then(data => {
                setRecomendacion(data);
                setSelectedTipoPiel(data.tipoPiel || 'Mixta');
                setAlergiasInput(data.alergiasRegistradas || '');
                setObservacionInput(data.observacionDiagnostico || '');
            })
            .catch(err => {
                const msg = err instanceof Error ? err.message : 'Aún no posees un diagnóstico registrado.';
                setErrorRecomendacion(msg);
            })
            .finally(() => {
                setLoadingRecomendacion(false);
            });
    };

    useEffect(() => {
        if (activeTab === 'perfil') {
            cargarRecomendacion();
        }
    }, [activeTab]);

    // Envío de consulta al asistente RAG
    const handleSendMessage = async (customPrompt?: string) => {
        const textToSend = (customPrompt || inputMessage).trim();
        if (!textToSend || isTyping) return;

        const userMsg: MessageUI = {
            id: `user-${Date.now()}`,
            text: textToSend,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customPrompt) setInputMessage('');
        setIsTyping(true);

        try {
            const res = await chatIAApi.consultar(textToSend, currentUser?.usuarioId);

            const botMsg: MessageUI = {
                id: `bot-${res.conversacionId || Date.now()}`,
                text: res.respuesta,
                sender: 'bot',
                timestamp: new Date(res.fecha || Date.now()),
                esAclaracionMedicaOExterna: res.esAclaracionMedicaOExterna,
                productosRelacionados: res.productosRelacionados,
                serviciosRelacionados: res.serviciosRelacionados
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: MessageUI = {
                id: `bot-err-${Date.now()}`,
                text: 'Lo siento, ocurrió un inconveniente momentáneo al procesar tu consulta con el motor de Inteligencia Artificial. Por favor, reintenta en unos instantes.',
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleAddProductToCart = (prod: ProductoDto) => {
        if (onAddToCart) {
            onAddToCart(prod.productoId.toString(), {
                nombre: prod.nombre,
                marca: prod.marca,
                precio: prod.precio,
                imagen: prod.imagenUrl || '🧴'
            });

            setAddedCartIds(prev => ({ ...prev, [prod.productoId]: true }));
            setTimeout(() => {
                setAddedCartIds(prev => ({ ...prev, [prod.productoId]: false }));
            }, 2500);
        }
    };

    // Guardar actualización de diagnóstico dermatológico
    const handleSaveDiagnostico = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingDiag(true);

        try {
            await chatIAApi.registrarDiagnostico(
                selectedTipoPiel,
                observacionInput.trim() || `Diagnóstico actualizado por el usuario para piel ${selectedTipoPiel}`,
                alergiasInput.trim() || undefined,
                currentUser?.usuarioId
            );

            setShowDiagModal(false);
            cargarRecomendacion();
        } catch (err) {
            alert('No se pudo guardar el diagnóstico. Intenta nuevamente.');
        } finally {
            setSavingDiag(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            {/* Header del Consultorio IA */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE8E1] pb-5">
                <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7A3B3B] to-[#3C3530] text-white flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5 text-[#F7F4F0]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#2A2825] tracking-tight">
                            Consultorio Dermocosmético IA
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#7A3B3B]/10 text-[#7A3B3B] border border-[#7A3B3B]/20 uppercase tracking-wider">
                            RAG Activo
                        </span>
                    </div>
                    <p className="text-sm text-[#8A7F74]">
                        Asistente 24/7 con recuperación en tiempo real de catálogo, disponibilidad de cabinas y biotipo cutáneo.
                    </p>
                </div>

                {/* Tabs de Navegación */}
                <div className="flex bg-[#F5F2EB] p-1 rounded-xl border border-[#EDE8E1]">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'chat'
                            ? 'bg-white text-[#3C3530] shadow-sm'
                            : 'text-[#8A7F74] hover:text-[#3C3530]'
                            }`}
                    >
                        <Bot className="w-4 h-4 text-[#7A3B3B]" />
                        Chatbot 24/7
                    </button>
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'perfil'
                            ? 'bg-white text-[#3C3530] shadow-sm'
                            : 'text-[#8A7F74] hover:text-[#3C3530]'
                            }`}
                    >
                        <Heart className="w-4 h-4 text-[#7A3B3B]" />
                        Mi Rutina Personalizada
                    </button>
                </div>
            </div>

            {/* TAB 1: CHATBOT CONVERSACIONAL (HU-12, RF-09, RNF-04) */}
            {activeTab === 'chat' && (
                <div className="flex flex-col h-[720px] bg-white rounded-2xl shadow-sm border border-[#EDE8E1] overflow-hidden">
                    {/* Barra de estado superior */}
                    <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#EDE8E1] flex items-center justify-between text-xs text-[#8A7F74]">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-medium text-[#3C3530]">Motor de Inferencia RAG Conectado</span>
                            <span className="text-[#DDD5C8]">|</span>
                            <span>Stock y Servicios en tiempo real</span>
                        </div>
                        {currentUser ? (
                            <span className="text-[11px] font-semibold text-[#7A3B3B]">
                                Sesión: {currentUser.nombre} {currentUser.apellido}
                            </span>
                        ) : (
                            <span className="text-[11px] text-[#A69C90] italic">
                                Modo Invitado (Inicia sesión para guardar historial)
                            </span>
                        )}
                    </div>

                    {/* Contenedor de mensajes */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#FAF8F5]/40">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7A3B3B] to-[#3C3530] flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                                        <Bot className="w-5 h-5 text-[#F7F4F0]" />
                                    </div>
                                )}

                                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[78%]`}>
                                    {/* Alerta de Guardrail (HU-12) */}
                                    {msg.esAclaracionMedicaOExterna && msg.sender === 'bot' && (
                                        <div className="mb-2.5 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900 shadow-sm w-full">
                                            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                            <span>
                                                <strong>Guardrail Profesional Activado (HU-12):</strong> Orientación cosmecéutica responsable. Para diagnósticos clínicos o recetas, consulte a un médico dermatólogo.
                                            </span>
                                        </div>
                                    )}

                                    {/* Burbuja de Texto */}
                                    <div
                                        className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-line ${msg.sender === 'user'
                                            ? 'bg-[#3C3530] text-white rounded-tr-none'
                                            : 'bg-white text-[#2A2825] border border-[#EDE8E1] rounded-tl-none'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>

                                    {/* Tarjetas interactivas de Productos Relacionados */}
                                    {msg.productosRelacionados && msg.productosRelacionados.length > 0 && (
                                        <div className="mt-3 w-full">
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A3B3B] mb-2 flex items-center gap-1.5">
                                                <Package className="w-3.5 h-3.5" />
                                                Productos sugeridos en tienda con stock:
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {msg.productosRelacionados.map(prod => (
                                                    <div
                                                        key={`prod-card-${prod.productoId}`}
                                                        className="bg-white p-3 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B]/40 transition-all shadow-sm flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7F74]">
                                                                    {prod.marca}
                                                                </span>
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    Stock: {prod.stockActual}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xs font-bold text-[#2A2825] mt-1 line-clamp-1">
                                                                {prod.nombre}
                                                            </h4>
                                                            <p className="text-[11px] text-[#8A7F74] mt-1 line-clamp-2">
                                                                {prod.paraQueSirve || prod.descripcion || 'Fórmula cosmecéutica certificada.'}
                                                            </p>
                                                        </div>

                                                        <div className="mt-3 pt-2.5 border-t border-[#F5F2EB] flex items-center justify-between">
                                                            <span className="text-xs font-bold text-[#7A3B3B]">
                                                                ${prod.precio.toLocaleString('es-AR')}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                {onToggleWishlist && (
                                                                    <button
                                                                        onClick={() => onToggleWishlist(prod.productoId.toString(), {
                                                                            nombre: prod.nombre,
                                                                            marca: prod.marca,
                                                                            precio: prod.precio,
                                                                            imagenUrl: prod.imagenUrl,
                                                                            descripcion: prod.paraQueSirve || prod.descripcion
                                                                        })}
                                                                        className={`p-1.5 rounded-lg border transition-all ${
                                                                            wishlistIds.includes(prod.productoId.toString())
                                                                                ? 'bg-[#7A3B3B] text-white border-[#7A3B3B]'
                                                                                : 'bg-white text-[#8A7F74] hover:text-[#7A3B3B] border-[#EDE8E1]'
                                                                        }`}
                                                                        title={wishlistIds.includes(prod.productoId.toString()) ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
                                                                    >
                                                                        <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(prod.productoId.toString()) ? 'fill-current' : ''}`} />
                                                                    </button>
                                                                )}
                                                                {onAddToCart && (
                                                                    <button
                                                                        onClick={() => handleAddProductToCart(prod)}
                                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${addedCartIds[prod.productoId]
                                                                            ? 'bg-emerald-600 text-white'
                                                                            : 'bg-[#3C3530] text-white hover:bg-[#7A3B3B]'
                                                                            }`}
                                                                    >
                                                                        {addedCartIds[prod.productoId] ? (
                                                                            <>
                                                                                <Check className="w-3.5 h-3.5" />
                                                                                ¡Agregado!
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                                                Agregar
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tarjetas interactivas de Servicios Relacionados */}
                                    {msg.serviciosRelacionados && msg.serviciosRelacionados.length > 0 && (
                                        <div className="mt-3 w-full">
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A3B3B] mb-2 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Tratamientos sugeridos en cabina:
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {msg.serviciosRelacionados.map(serv => (
                                                    <div
                                                        key={`serv-card-${serv.servicioId}`}
                                                        className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B]/40 transition-all shadow-sm flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between text-[11px] text-[#8A7F74]">
                                                                <span className="flex items-center gap-1 font-medium">
                                                                    <Clock className="w-3 h-3 text-[#7A3B3B]" />
                                                                    {serv.duracionMin} min
                                                                </span>
                                                                <span className="font-bold text-[#7A3B3B]">
                                                                    ${serv.precio.toLocaleString('es-AR')}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xs font-bold text-[#2A2825] mt-1.5 line-clamp-1">
                                                                {serv.nombre}
                                                            </h4>
                                                            <p className="text-[11px] text-[#8A7F74] mt-1 line-clamp-2">
                                                                {serv.paraQueSirve || serv.descripcion || 'Tratamiento profesional en cabina.'}
                                                            </p>
                                                        </div>

                                                        <div className="mt-3 pt-2 border-t border-[#EDE8E1]">
                                                            {onSelectService && (
                                                                <button
                                                                    onClick={() => onSelectService(serv.servicioId.toString())}
                                                                    className="w-full py-1.5 bg-white border border-[#DDD5C8] hover:border-[#7A3B3B] text-[#3C3530] hover:text-[#7A3B3B] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                                                                >
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    Reservar Turno
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Marca de tiempo */}
                                    <span className="text-[10px] text-[#A69C90] mt-1 px-1">
                                        {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {msg.sender === 'user' && (
                                    <div className="w-9 h-9 rounded-full bg-[#3C3530] text-white flex items-center justify-center flex-shrink-0 shadow-sm text-xs font-bold uppercase">
                                        {currentUser ? currentUser.nombre.charAt(0) : <User className="w-5 h-5" />}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Indicador de escribiendo */}
                        {isTyping && (
                            <div className="flex gap-3 items-center">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7A3B3B] to-[#3C3530] flex items-center justify-center shadow-sm text-white">
                                    <Bot className="w-5 h-5 text-[#F7F4F0]" />
                                </div>
                                <div className="bg-white border border-[#EDE8E1] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-[#7A3B3B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-[#7A3B3B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-[#7A3B3B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    <span className="text-xs text-[#8A7F74] ml-2 italic">Consultando catálogo y stock...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chips de Preguntas Frecuentes / Sugerencias */}
                    <div className="px-5 py-2.5 bg-[#FAF8F5] border-t border-[#EDE8E1] flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <span className="text-[10px] font-bold uppercase text-[#8A7F74] whitespace-nowrap flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#7A3B3B]" /> Sugerencias:
                        </span>
                        {PROMPT_SUGGESTIONS.map((item, idx) => (
                            <button
                                key={`chip-${idx}`}
                                onClick={() => handleSendMessage(item.prompt)}
                                disabled={isTyping}
                                className="px-3 py-1 rounded-full bg-white border border-[#EDE8E1] hover:border-[#7A3B3B] text-[11px] font-medium text-[#3C3530] hover:text-[#7A3B3B] transition-all whitespace-nowrap shadow-2xs hover:bg-[#F7F4F0]"
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>

                    {/* Caja de Input */}
                    <div className="p-4 bg-white border-t border-[#EDE8E1]">
                        <div className="flex gap-2.5 items-center">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Escribe tu consulta sobre tu piel, tratamientos o productos en stock..."
                                disabled={isTyping}
                                className="flex-1 px-4 py-3 text-sm bg-[#FAF8F5] border border-[#DDD5C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]/30 focus:border-[#7A3B3B] transition-all placeholder:text-[#A69C90]"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputMessage.trim() || isTyping}
                                className="px-5 py-3 bg-[#7A3B3B] text-white rounded-xl hover:bg-[#602D2D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:inline">Consultar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MI PERFIL DERMATOLÓGICO & RUTINA PERSONALIZADA (HU-11) */}
            {activeTab === 'perfil' && (
                <div className="space-y-6">
                    {!currentUser ? (
                        <div className="bg-white p-8 rounded-2xl border border-[#EDE8E1] text-center max-w-xl mx-auto shadow-sm">
                            <div className="w-14 h-14 bg-[#F7F4F0] text-[#7A3B3B] rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-[#2A2825] mb-2">Inicia Sesión para tu Diagnóstico</h3>
                            <p className="text-sm text-[#8A7F74] mb-6">
                                El módulo de recomendaciones inteligentes (HU-11) asocia tu biotipo cutáneo, alergias registradas y compras previas para formular tu rutina científica personalizada.
                            </p>
                        </div>
                    ) : loadingRecomendacion ? (
                        <div className="bg-white p-12 rounded-2xl border border-[#EDE8E1] text-center shadow-sm">
                            <RefreshCw className="w-8 h-8 text-[#7A3B3B] animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-[#3C3530]">Calculando recomendación dermatológica en tiempo real...</p>
                            <p className="text-xs text-[#8A7F74] mt-1">Filtrando alérgenos y verificando stock en almacén</p>
                        </div>
                    ) : errorRecomendacion ? (
                        <div className="bg-white p-8 rounded-2xl border border-[#EDE8E1] text-center max-w-xl mx-auto shadow-sm">
                            <AlertCircle className="w-12 h-12 text-[#7A3B3B] mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-[#2A2825] mb-2">Completá tu Ficha Dermatológica</h3>
                            <p className="text-sm text-[#8A7F74] mb-6">
                                {errorRecomendacion} Registrá tu biotipo de piel para que el Asistente IA formule tu rutina a medida.
                            </p>
                            <button
                                onClick={() => setShowDiagModal(true)}
                                className="px-5 py-2.5 bg-[#7A3B3B] text-white rounded-xl text-xs font-semibold hover:bg-[#602D2D] transition-colors shadow-sm"
                            >
                                Realizar Test de Piel (1 Minuto)
                            </button>
                        </div>
                    ) : recomendacion ? (
                        <>
                            {/* Card Resumen de Biotipo */}
                            <div className="bg-gradient-to-r from-[#2A2825] to-[#3C3530] text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#7A3B3B] text-white tracking-wider uppercase">
                                            Biotipo: Piel {recomendacion.tipoPiel}
                                        </span>
                                        <span className="text-xs text-white/60">
                                            Actualizado: {new Date(recomendacion.fechaGeneracion).toLocaleDateString('es-AR')}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">
                                        Diagnóstico de {recomendacion.clienteNombre}
                                    </h2>
                                    <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
                                        {recomendacion.observacionDiagnostico}
                                    </p>

                                    {/* Alergias Registradas */}
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-white/70 font-medium">Alergias / Restricciones:</span>
                                        {recomendacion.alergiasRegistradas ? (
                                            recomendacion.alergiasRegistradas.split(',').map((alg, i) => (
                                                <span key={i} className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-200 border border-red-500/30">
                                                    🚫 {alg.trim()}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-emerald-300">Ninguna reportada</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDiagModal(true)}
                                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
                                >
                                    <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                                    Actualizar Diagnóstico
                                </button>
                            </div>

                            {/* Rutina Sugerida */}
                            <div className="bg-white p-6 rounded-2xl border border-[#EDE8E1] shadow-sm">
                                <h3 className="text-base font-bold text-[#2A2825] mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                                    Protocolo Dermatológico Sugerido (HU-11)
                                </h3>
                                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] text-sm text-[#3C3530] whitespace-pre-line leading-relaxed font-normal">
                                    {recomendacion.rutinaSugerida}
                                </div>
                            </div>

                            {/* Productos Compatibles Disponibles en Stock */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#2A2825]">
                                            Cosmecéutica Recomendada en Stock ({recomendacion.productosRecomendados.length})
                                        </h3>
                                        <p className="text-xs text-[#8A7F74]">
                                            Filtrados exclusivamente para piel {recomendacion.tipoPiel} y libres de tus alérgenos registrados.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {recomendacion.productosRecomendados.map(prod => (
                                        <div
                                            key={`rec-prod-${prod.productoId}`}
                                            className="bg-white p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B]/40 transition-all shadow-sm flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7F74]">
                                                        {prod.marca}
                                                    </span>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Stock: {prod.stockActual}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-[#2A2825] mt-1.5">
                                                    {prod.nombre}
                                                </h4>
                                                <p className="text-xs text-[#8A7F74] mt-1 line-clamp-2">
                                                    {prod.paraQueSirve || prod.descripcion}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-[#F5F2EB] flex items-center justify-between">
                                                <span className="text-sm font-bold text-[#7A3B3B]">
                                                    ${prod.precio.toLocaleString('es-AR')}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {onToggleWishlist && (
                                                        <button
                                                            onClick={() => onToggleWishlist(prod.productoId.toString(), {
                                                                nombre: prod.nombre,
                                                                marca: prod.marca,
                                                                precio: prod.precio,
                                                                imagenUrl: prod.imagenUrl,
                                                                descripcion: prod.paraQueSirve || prod.descripcion
                                                            })}
                                                            className={`p-2 rounded-lg border transition-all ${
                                                                wishlistIds.includes(prod.productoId.toString())
                                                                    ? 'bg-[#7A3B3B] text-white border-[#7A3B3B]'
                                                                    : 'bg-white text-[#8A7F74] hover:text-[#7A3B3B] border-[#EDE8E1]'
                                                            }`}
                                                            title={wishlistIds.includes(prod.productoId.toString()) ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
                                                        >
                                                            <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(prod.productoId.toString()) ? 'fill-current' : ''}`} />
                                                        </button>
                                                    )}
                                                    {onAddToCart && (
                                                        <button
                                                            onClick={() => handleAddProductToCart(prod)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${addedCartIds[prod.productoId]
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-[#3C3530] text-white hover:bg-[#7A3B3B]'
                                                                }`}
                                                        >
                                                            {addedCartIds[prod.productoId] ? (
                                                                <>
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    ¡Agregado!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                                    Al Carrito
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* MODAL: REGISTRAR / ACTUALIZAR DIAGNÓSTICO DERMATOLÓGICO */}
            {showDiagModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EDE8E1]">
                        <div className="flex items-center justify-between pb-4 border-b border-[#EDE8E1] mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#7A3B3B]/10 text-[#7A3B3B] flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-bold text-[#2A2825]">Test de Diagnóstico Cutáneo</h3>
                            </div>
                            <button
                                onClick={() => setShowDiagModal(false)}
                                className="text-[#8A7F74] hover:text-[#2A2825] text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveDiagnostico} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#3C3530] uppercase tracking-wider mb-2">
                                    1. Selecciona tu Biotipo Cutáneo
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible'].map(tipo => (
                                        <button
                                            type="button"
                                            key={tipo}
                                            onClick={() => setSelectedTipoPiel(tipo)}
                                            className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${selectedTipoPiel === tipo
                                                ? 'bg-[#7A3B3B] text-white border-[#7A3B3B] shadow-2xs'
                                                : 'bg-[#FAF8F5] text-[#3C3530] border-[#DDD5C8] hover:border-[#7A3B3B]'
                                                }`}
                                        >
                                            {tipo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3C3530] uppercase tracking-wider mb-1.5">
                                    2. Alergias o Sensibilidades (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={alergiasInput}
                                    onChange={(e) => setAlergiasInput(e.target.value)}
                                    placeholder="Ej. Parabenos, Fragancias fuertes, Níquel"
                                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DDD5C8] rounded-xl focus:outline-none focus:border-[#7A3B3B]"
                                />
                                <span className="text-[10px] text-[#8A7F74] mt-1 block">
                                    El motor RAG excluirá automáticamente los productos que contengan estos alérgenos.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#3C3530] uppercase tracking-wider mb-1.5">
                                    3. Preocupaciones Cutáneas Principales
                                </label>
                                <textarea
                                    value={observacionInput}
                                    onChange={(e) => setObservacionInput(e.target.value)}
                                    placeholder="Ej. Siento tirantez después de lavarme el rostro y tengo brillo en la frente hacia la tarde."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DDD5C8] rounded-xl focus:outline-none focus:border-[#7A3B3B] resize-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-[#EDE8E1] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowDiagModal(false)}
                                    className="px-4 py-2 rounded-xl border border-[#DDD5C8] text-xs font-semibold text-[#8A7F74] hover:bg-[#F5F2EB]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingDiag}
                                    className="px-5 py-2 bg-[#7A3B3B] text-white rounded-xl text-xs font-semibold hover:bg-[#602D2D] transition-colors disabled:opacity-50"
                                >
                                    {savingDiag ? 'Guardando...' : 'Guardar y Recalcular'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
