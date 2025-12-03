// ============================================================
// PRIVACY POLICY PAGE
// Página de Política de Privacidade
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politica de Privacidade',
  description: 'Politica de Privacidade do HealthFlow',
};

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold">Politica de Privacidade</h1>
        <p className="text-muted-foreground">
          Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <h2>1. Introducao</h2>
        <p>
          O HealthFlow esta comprometido com a protecao da privacidade e dos dados
          pessoais de seus usuarios. Esta politica descreve como coletamos, usamos,
          armazenamos e protegemos suas informacoes.
        </p>

        <h2>2. Dados Coletados</h2>
        <p>Coletamos os seguintes tipos de dados:</p>

        <h3>2.1 Dados de Cadastro</h3>
        <ul>
          <li>Nome completo</li>
          <li>Email</li>
          <li>CPF</li>
          <li>Telefone</li>
          <li>Data de nascimento</li>
          <li>Endereco</li>
        </ul>

        <h3>2.2 Dados de Saude (Dados Sensiveis)</h3>
        <ul>
          <li>Historico medico</li>
          <li>Prescricoes</li>
          <li>Resultados de exames</li>
          <li>Alergias e condicoes medicas</li>
          <li>Registros de consultas</li>
        </ul>

        <h3>2.3 Dados de Uso</h3>
        <ul>
          <li>Logs de acesso</li>
          <li>Endereço IP</li>
          <li>Dispositivo e navegador</li>
          <li>Paginas visitadas</li>
        </ul>

        <h2>3. Finalidade do Tratamento</h2>
        <p>Utilizamos seus dados para:</p>
        <ul>
          <li>Prestacao dos servicos contratados</li>
          <li>Agendamento e gestao de consultas</li>
          <li>Emissao de receitas e laudos</li>
          <li>Comunicacao sobre o servico</li>
          <li>Cumprimento de obrigacoes legais</li>
          <li>Melhoria continua do sistema</li>
        </ul>

        <h2>4. Base Legal</h2>
        <p>O tratamento de dados e realizado com base em:</p>
        <ul>
          <li>Consentimento do titular</li>
          <li>Execucao de contrato</li>
          <li>Cumprimento de obrigacao legal</li>
          <li>Tutela da saude (para dados de saude)</li>
          <li>Interesse legitimo do controlador</li>
        </ul>

        <h2>5. Compartilhamento de Dados</h2>
        <p>Seus dados podem ser compartilhados com:</p>
        <ul>
          <li>Profissionais de saude autorizados</li>
          <li>Laboratorios (mediante autorizacao)</li>
          <li>Convenios e operadoras de saude</li>
          <li>RNDS/DATASUS (conforme regulamentacao)</li>
          <li>Autoridades (quando exigido por lei)</li>
        </ul>

        <h2>6. Seguranca dos Dados</h2>
        <p>Implementamos medidas de seguranca como:</p>
        <ul>
          <li>Criptografia em transito e em repouso</li>
          <li>Autenticacao de dois fatores (2FA)</li>
          <li>Controle de acesso baseado em funcoes (RBAC)</li>
          <li>Logs e auditoria de acesso</li>
          <li>Backups regulares</li>
          <li>Testes de seguranca periodicos</li>
        </ul>

        <h2>7. Retencao de Dados</h2>
        <p>
          Mantemos seus dados pelo tempo necessario para cumprir as finalidades
          descritas ou conforme exigido por lei. Dados medicos sao mantidos por
          no minimo 20 anos, conforme resolucao CFM 1821/2007.
        </p>

        <h2>8. Seus Direitos</h2>
        <p>Conforme a LGPD, voce tem direito a:</p>
        <ul>
          <li>Confirmacao da existencia de tratamento</li>
          <li>Acesso aos dados</li>
          <li>Correcao de dados incompletos ou inexatos</li>
          <li>Anonimizacao ou bloqueio de dados desnecessarios</li>
          <li>Portabilidade dos dados</li>
          <li>Eliminacao de dados (quando aplicavel)</li>
          <li>Revogacao do consentimento</li>
        </ul>

        <h2>9. Cookies</h2>
        <p>
          Utilizamos cookies para melhorar sua experiencia. Voce pode gerenciar
          as preferencias de cookies nas configuracoes do navegador.
        </p>

        <h2>10. Transferencia Internacional</h2>
        <p>
          Seus dados podem ser processados em servidores localizados fora do Brasil,
          sempre com garantias adequadas de protecao conforme exigido pela LGPD.
        </p>

        <h2>11. Menores de Idade</h2>
        <p>
          O tratamento de dados de menores de 18 anos requer consentimento de
          um dos pais ou responsavel legal.
        </p>

        <h2>12. Alteracoes na Politica</h2>
        <p>
          Esta politica pode ser atualizada periodicamente. Alteracoes significativas
          serao comunicadas por email ou atraves do sistema.
        </p>

        <h2>13. Encarregado de Dados (DPO)</h2>
        <p>
          Nosso Encarregado de Protecao de Dados pode ser contatado em:
          <br />
          Email: dpo@healthflow.com.br
        </p>

        <h2>14. Contato</h2>
        <p>
          Para exercer seus direitos ou esclarecer duvidas sobre privacidade:
          <br />
          Email: privacidade@healthflow.com.br
          <br />
          Telefone: (11) 1234-5678
        </p>

        <h2>15. Autoridade Nacional</h2>
        <p>
          Voce pode apresentar reclamacoes a Autoridade Nacional de Protecao de
          Dados (ANPD) em caso de violacao de seus direitos.
        </p>
      </div>
    </div>
  );
}
