# Sync Dental Group - Sistema de Agendamento Odontológico

Este é um sistema moderno de gestão odontológica desenvolvido com Next.js, Firebase e Genkit (IA).

## Configuração do Repositório

Para conectar este projeto ao seu GitHub, utilize os comandos abaixo:

```bash
git remote add origin https://github.com/luizhenrique8759-prog/Agenda.git
git branch -M main
git push -u origin main
```

## Funcionalidades Principais

### 1. Portal Administrador Blindado
- **Acesso Exclusivo**: Reservado para o e-mail `luizhenrique8759@gmail.com`.
- **Gestão de Equipe**: Atribuição de níveis de autoridade (1 a 3) para colaboradores.
- **Financeiro**: Visão consolidada de faturamento e procedimentos.

### 2. Níveis de Autoridade para Colaboradores
O administrador pode definir o nível de acesso de cada profissional:
- **Nível 1 (Básico)**: Acesso apenas à visualização e gestão da Agenda.
- **Nível 2 (Intermediário)**: Acesso à Agenda e aos Prontuários Clínicos (Leitura/Escrita).
- **Nível 3 (Avançado)**: Acesso total à Agenda, Prontuários e visualização da lista de Equipe.

### 3. Assistente de Evolução Clínica (IA)
- Geração automática de resumos profissionais a partir de notas brutas do dentista.
- Sugestão de tratamentos e análise de risco clínico em português (pt-BR).

### 4. Experiência do Paciente
- Agendamento intuitivo com fluxo de confirmação.
- Painel do paciente para acompanhar consultas agendadas.

## Tecnologias Utilizadas
- **Frontend**: Next.js 15, Tailwind CSS, ShadCN UI.
- **Backend**: Firebase Auth, Firestore.
- **IA**: Google Genkit com modelos Gemini.
