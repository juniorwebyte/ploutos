import React from 'react';
import {
  Target,
  Eye,
  Heart,
  TrendingUp,
  Shield,
  Users,
  Award,
  Sparkles,
  Calculator,
  Building
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-xl">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sobre a <span className="text-emerald-600">PloutosLedger</span>
          </h1>
          <p className="text-xl text-gray-600 italic max-w-2xl mx-auto">
            "A riqueza começa com controle."
          </p>
        </div>

        {/* História */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Nossa História</h2>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
            <p>
              <strong className="text-emerald-600">PloutosLedger</strong> nasceu da visão de transformar a gestão financeira
              de pequenas e médias empresas. O nome foi cuidadosamente escolhido: <strong>Ploutos</strong> (ou Plutus) é o
              deus grego da riqueza, simbolizando abundância e prosperidade. <strong>Ledger</strong>, por sua vez, representa
              o livro-razão contábil, a base sólida de qualquer controle financeiro eficiente.
            </p>

            <p>
              Desenvolvido pela <strong>Webyte | Tecnologia Laravel</strong>, a PloutosLedger surgiu da necessidade real
              de empresários que buscavam um sistema profissional, técnico e corporativo para automatizar o fechamento de caixa
              diário e ter controle preciso sobre suas operações financeiras.
            </p>

            <p>
              Mais do que um software, a PloutosLedger representa a democratização de ferramentas financeiras de alto nível,
              antes acessíveis apenas a grandes corporações. Acreditamos que todo negócio, independente do tamanho, merece
              ter controle total sobre suas finanças com precisão, segurança e eficiência.
            </p>

            <p>
              Nossa plataforma combina a sabedoria milenar representada por Ploutos com a tecnologia moderna do século XXI,
              criando uma solução que honra o passado enquanto constrói o futuro financeiro dos nossos clientes.
            </p>
          </div>
        </div>

        {/* Missão, Visão e Valores */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Missão */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Missão</h3>
            <p className="text-gray-700 leading-relaxed">
              Fornecer soluções de gestão financeira acessíveis, eficientes e profissionais que permitam a pequenas e
              médias empresas alcançarem excelência operacional e controle total sobre seus recursos, facilitando a
              tomada de decisões estratégicas com base em dados confiáveis.
            </p>
          </div>

          {/* Visão */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
              <Eye className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Visão</h3>
            <p className="text-gray-700 leading-relaxed">
              Ser reconhecida como a principal plataforma de gestão financeira para PMEs no Brasil, democratizando o
              acesso a ferramentas corporativas de alto nível e contribuindo para o crescimento sustentável de milhares
              de negócios através da organização financeira e controle inteligente.
            </p>
          </div>

          {/* Valores */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Valores</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Transparência:</strong> Clareza total em processos e dados</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Precisão:</strong> Compromisso com a exatidão contábil</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Inovação:</strong> Evolução constante da tecnologia</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>Acessibilidade:</strong> Ferramentas profissionais para todos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Diferenciais */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Nossos Diferenciais</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <TrendingUp className="w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Controle Profissional</h3>
              <p className="text-emerald-100 text-sm">
                Gestão completa de entradas, saídas, comissões e notas fiscais com precisão contábil
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <Shield className="w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Segurança Total</h3>
              <p className="text-emerald-100 text-sm">
                Backup automático, validações robustas e proteção integral dos seus dados financeiros
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <Users className="w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Suporte Dedicado</h3>
              <p className="text-emerald-100 text-sm">
                Equipe técnica especializada pronta para auxiliar no crescimento do seu negócio
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <Award className="w-8 h-8 mb-4" />
              <h3 className="font-bold text-lg mb-2">Tecnologia Laravel</h3>
              <p className="text-emerald-100 text-sm">
                Desenvolvido com a robustez e confiabilidade do framework Laravel mais moderno
              </p>
            </div>
          </div>
        </div>

        {/* Webyte */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Webyte Desenvolvimentos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A <strong>Webyte | Tecnologia Laravel</strong> é uma empresa especializada no desenvolvimento de soluções
                web corporativas, focada em criar sistemas robustos, escaláveis e de alta performance para empresas que
                buscam excelência tecnológica.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Localizada na <strong>Rua Agrimensor Sugaya 1203, Bloco 5 Sala 32, São Paulo - SP</strong>, a Webyte
                combina expertise técnica com compreensão profunda das necessidades empresariais, desenvolvendo produtos
                que realmente fazem a diferença no dia a dia dos negócios.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-6">
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">Laravel</span>
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">React</span>
                <span className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium">TypeScript</span>
                <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">Sistemas Corporativos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chamada para Ação */}
        <div className="text-center mt-16">
          <p className="text-2xl text-gray-700 mb-6">
            Junte-se a centenas de empresas que já controlam suas finanças com <strong className="text-emerald-600">PloutosLedger</strong>
          </p>
          <p className="text-lg text-gray-600 italic">
            "Onde a sabedoria antiga encontra a tecnologia moderna"
          </p>
        </div>
      </div>
    </div>
  );
}
