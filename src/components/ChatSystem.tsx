import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Users,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Image,
  File,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Search,
  Filter,
  Archive,
  Star,
  StarOff,
  Edit,
  Trash2,
  Copy,
  Forward,
  Reply,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  Link,
  Download,
  Upload,
  RefreshCw,
  Bell,
  BellOff,
  User,
  UserPlus,
  UserMinus,
  Crown,
  Zap,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Ban,
  Mute,
  Unmute,
  Volume1,
  Volume3,
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Radio,
  Music,
  Headphones,
  Speaker,
  Mic2,
  VideoOff,
  Camera,
  CameraOff,
  Monitor,
  MonitorOff,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Database,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  SignalOff,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Plug,
  PlugOff,
  Power,
  PowerOff,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  AreaChart,
  Target,
  Award,
  Trophy,
  Medal,
  Badge,
  Certificate,
  Gift,
  Present,
  Party,
  Celebration,
  Fire,
  Lightning,
  Sparkles,
  Star as StarIcon,
  Moon,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Leaf,
  Tree,
  Flower,
  Butterfly,
  Bird,
  Fish,
  Cat,
  Dog,
  Rabbit,
  Bear,
  Lion,
  Tiger,
  Elephant,
  Monkey,
  Panda,
  Koala,
  Penguin,
  Owl,
  Eagle,
  Falcon,
  Hawk,
  Dove,
  Swan,
  Peacock,
  Flamingo,
  Parrot,
  Toucan,
  Hummingbird,
  Woodpecker,
  Robin,
  Cardinal,
  Bluebird,
  Canary,
  Finch,
  Sparrow,
  Wren,
  Thrush,
  Warbler,
  Oriole,
  Tanager,
  Grosbeak,
  Bunting,
  Junco,
  Chickadee,
  Nuthatch,
  Titmouse,
  Kinglet,
  Gnatcatcher,
  Vireo,
  Shrike,
  Mockingbird,
  Thrasher,
  Catbird,
  BrownThrasher,
  SageThrasher,
  BendireThrasher,
  CurveBilledThrasher,
  CaliforniaThrasher,
  LeConteThrasher,
  CrissalThrasher,
  LongBilledThrasher,
  GrayThrasher,
  WhiteThrasher,
  ScrubThrasher,
  PearlyEyedThrasher,
  Trembler,
  RufousThroatedSolitare,
  BlueGrayGnatcatcher,
  BlackTailedGnatcatcher,
  CaliforniaGnatcatcher,
  BlackCappedGnatcatcher,
  PlumbeousGnatcatcher,
  TropicalGnatcatcher,
  WhiteLoredGnatcatcher,
  MaskedGnatcatcher,
  CubanGnatcatcher,
  YucatanGnatcatcher,
  WhiteBrowedGnatcatcher,
  SlateThroatedGnatcatcher,
  RufousBrowedGnatcatcher,
  LongBilledGnatcatcher,
  ChiapasGnatcatcher,
  BlueHeadedGnatcatcher
} from 'lucide-react';

interface ChatSystemProps {
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role: 'user' | 'admin' | 'superadmin';
  };
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: string;
  edited?: boolean;
  deleted?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  description?: string;
  members: string[];
  unreadCount: number;
  lastMessage?: Message;
  pinned?: boolean;
  muted?: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: 'user' | 'admin' | 'superadmin';
  lastSeen?: Date;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ onClose }) => {
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'general',
      name: 'Geral',
      type: 'public',
      description: 'Canal geral para discussões',
      members: ['user1', 'user2', 'user3'],
      unreadCount: 3,
      lastMessage: {
        id: 'msg1',
        content: 'Olá pessoal!',
        sender: { id: 'user1', name: 'João Silva', avatar: '', role: 'user' },
        timestamp: new Date(),
        type: 'text'
      }
    },
    {
      id: 'suporte',
      name: 'Suporte',
      type: 'public',
      description: 'Canal de suporte técnico',
      members: ['admin1', 'user2'],
      unreadCount: 1,
      lastMessage: {
        id: 'msg2',
        content: 'Preciso de ajuda com o sistema',
        sender: { id: 'user2', name: 'Maria Santos', avatar: '', role: 'user' },
        timestamp: new Date(),
        type: 'text'
      }
    },
    {
      id: 'admin',
      name: 'Administradores',
      type: 'private',
      description: 'Canal exclusivo para administradores',
      members: ['admin1', 'superadmin1'],
      unreadCount: 0,
      lastMessage: {
        id: 'msg3',
        content: 'Reunião marcada para amanhã',
        sender: { id: 'admin1', name: 'Admin User', avatar: '', role: 'admin' },
        timestamp: new Date(),
        type: 'text'
      }
    }
  ]);
  const [users, setUsers] = useState<User[]>([
    { id: 'user1', name: 'João Silva', avatar: '', status: 'online', role: 'user' },
    { id: 'user2', name: 'Maria Santos', avatar: '', status: 'away', role: 'user' },
    { id: 'admin1', name: 'Admin User', avatar: '', status: 'online', role: 'admin' },
    { id: 'superadmin1', name: 'Super Admin', avatar: '', status: 'online', role: 'superadmin' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simular carregamento de mensagens
    const sampleMessages: Message[] = [
      {
        id: '1',
        content: 'Bem-vindos ao sistema de chat!',
        sender: { id: 'superadmin1', name: 'Super Admin', avatar: '', role: 'superadmin' },
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      },
      {
        id: '2',
        content: 'Obrigado! Estou testando o sistema',
        sender: { id: 'user1', name: 'João Silva', avatar: '', role: 'user' },
        timestamp: new Date(Date.now() - 1800000),
        type: 'text'
      },
      {
        id: '3',
        content: 'Alguém pode me ajudar com uma dúvida?',
        sender: { id: 'user2', name: 'Maria Santos', avatar: '', role: 'user' },
        timestamp: new Date(Date.now() - 900000),
        type: 'text'
      },
      {
        id: '4',
        content: 'Claro! Em que posso ajudar?',
        sender: { id: 'admin1', name: 'Admin User', avatar: '', role: 'admin' },
        timestamp: new Date(Date.now() - 300000),
        type: 'text'
      }
    ];
    setMessages(sampleMessages);
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: { id: 'current-user', name: 'Você', avatar: '', role: 'user' },
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          existingReaction.users.push('current-user');
        } else {
          reactions.push({ emoji, users: ['current-user'] });
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'text-purple-600';
      case 'admin': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Chat System</h2>
              <p className="text-blue-100 text-sm">Comunicação em tempo real</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Canais</h3>
                <button className="text-blue-600 hover:text-blue-700">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeChannel === channel.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-sm text-gray-500">{channel.description}</p>
                        </div>
                      </div>
                      {channel.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {channel.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Online Users */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Online</h3>
                <button
                  onClick={() => setShowUserList(!showUserList)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {users.filter(user => user.status === 'online').map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}></div>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${getRoleColor(user.role)}`}>{user.name}</p>
                      <p className="text-xs text-gray-500">{user.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Channel Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {channels.find(c => c.id === activeChannel)?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {channels.find(c => c.id === activeChannel)?.members.length} membros
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ligar">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Vídeo">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Mais">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {message.sender.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-medium text-sm ${getRoleColor(message.sender.role)}`}>
                        {message.sender.name}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      {message.edited && (
                        <span className="text-xs text-gray-400">(editado)</span>
                      )}
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                      <p className="text-gray-900">{message.content}</p>
                    </div>
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex space-x-1 mt-2">
                        {message.reactions.map((reaction, index) => (
                          <button
                            key={index}
                            onClick={() => addReaction(message.id, reaction.emoji)}
                            className="flex items-center space-x-1 bg-white border border-gray-200 rounded-full px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => addReaction(message.id, '👍')}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Curtir"
                      >
                        <ThumbsUp className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Responder">
                        <Reply className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Mais">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  />
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    title="Emoji"
                  >
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Enviar"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;
