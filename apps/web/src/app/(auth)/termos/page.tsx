// ============================================================
// TERMS OF SERVICE PAGE
// Página de Termos de Uso
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de Uso do HealthFlow',
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-2xl font-bold">Termos de Uso</h1>
        <p className="text-muted-foreground">
          Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <h2>1. Aceitacao dos Termos</h2>
        <p>
          Ao acessar e usar o HealthFlow, voce concorda em cumprir e estar vinculado a estes
          Termos de Uso. Se voce nao concordar com qualquer parte destes termos, nao
          podera usar nossos servicos.
        </p>

        <h2>2. Descricao do Servico</h2>
        <p>
          O HealthFlow e um sistema de gestao de saude que oferece funcionalidades como
          agendamento de consultas, prontuario eletronico, receituario digital,
          telemedicina e outras ferramentas para clinicas e consultorios medicos.
        </p>

        <h2>3. Cadastro e Conta</h2>
        <p>
          Para utilizar o HealthFlow, voce deve criar uma conta fornecendo informacoes
          precisas e completas. Voce e responsavel por manter a confidencialidade
          de sua senha e por todas as atividades que ocorram em sua conta.
        </p>

        <h2>4. Uso Adequado</h2>
        <p>Voce concorda em:</p>
        <ul>
          <li>Usar o servico apenas para fins legais e de acordo com a legislacao vigente</li>
          <li>Nao compartilhar suas credenciais de acesso</li>
          <li>Manter a precisao dos dados cadastrados</li>
          <li>Nao tentar acessar areas restritas do sistema</li>
          <li>Respeitar a privacidade de outros usuarios e pacientes</li>
        </ul>

        <h2>5. Dados e Privacidade</h2>
        <p>
          O tratamento de dados pessoais segue nossa Politica de Privacidade e esta
          em conformidade com a Lei Geral de Protecao de Dados (LGPD). Ao usar o
          servico, voce consente com a coleta e uso de seus dados conforme descrito.
        </p>

        <h2>6. Dados de Saude</h2>
        <p>
          Dados de saude sao considerados dados sensiveis pela LGPD. O HealthFlow
          implementa medidas tecnicas e organizacionais para proteger esses dados,
          incluindo criptografia, controle de acesso e auditoria.
        </p>

        <h2>7. Responsabilidades do Usuario</h2>
        <p>Voce e responsavel por:</p>
        <ul>
          <li>Garantir a veracidade das informacoes inseridas</li>
          <li>Obter consentimento dos pacientes para armazenamento de seus dados</li>
          <li>Cumprir as normas do Conselho Federal de Medicina e demais orgaos reguladores</li>
          <li>Manter backup de dados criticos quando necessario</li>
        </ul>

        <h2>8. Disponibilidade do Servico</h2>
        <p>
          O HealthFlow se esforça para manter o servico disponivel 24/7, mas nao
          garante disponibilidade ininterrupta. Manutencoes programadas serao
          comunicadas com antecedencia.
        </p>

        <h2>9. Propriedade Intelectual</h2>
        <p>
          Todo o conteudo, marcas, logos e software do HealthFlow sao propriedade
          exclusiva da empresa. E proibida a reproducao, distribuicao ou modificacao
          sem autorizacao expressa.
        </p>

        <h2>10. Limitacao de Responsabilidade</h2>
        <p>
          O HealthFlow nao se responsabiliza por decisoes medicas tomadas com base
          nas informacoes do sistema. A responsabilidade clinica e sempre do
          profissional de saude.
        </p>

        <h2>11. Alteracoes nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento.
          Alteracoes significativas serao comunicadas por email ou atraves do sistema.
        </p>

        <h2>12. Rescisao</h2>
        <p>
          Podemos suspender ou encerrar sua conta em caso de violacao destes termos.
          Voce pode cancelar sua conta a qualquer momento atraves das configuracoes.
        </p>

        <h2>13. Lei Aplicavel</h2>
        <p>
          Estes termos sao regidos pelas leis brasileiras. Qualquer disputa sera
          resolvida no foro da comarca de Sao Paulo, SP.
        </p>

        <h2>14. Contato</h2>
        <p>
          Para duvidas sobre estes termos, entre em contato:
          <br />
          Email: juridico@healthflow.com.br
          <br />
          Telefone: (11) 1234-5678
        </p>
      </div>
    </div>
  );
}
