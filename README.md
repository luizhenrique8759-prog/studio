
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

### 1. Portal Administrador
- **Acesso Exclusivo**: Reservado para o e-mail `luizhenrique8759@gmail.com`.
- **Gestão de Equipe**: Atribuição de níveis de autoridade para colaboradores.

### 2. Hierarquia de Autoridade
O administrador define o nível de acesso de cada profissional:
- **Nível 1 (Recepção)**: Acesso exclusivo à **Agenda**. Pode visualizar nomes e confirmar horários. Ideal para recepção.
- **Nível 2 (Clínico)**: Acesso à **Agenda** e aos **Prontuários**. Pode visualizar procedimentos, ficha do paciente e evoluções. Ideal para dentistas e auxiliares.
- **Nível 3 (Administrativo)**: Acesso total: **Agenda**, **Prontuários**, **Equipe** e **Financeiro** (Faturamento, notas e métricas). Ideal para gerência.

### 3. Assistente de Evolução Clínica (IA)
- Geração automática de resumos profissionais e sugestão de tratamentos baseada em notas brutas.

### 4. Experiência do Paciente
- Agendamento intuitivo e painel para acompanhar consultas.

## Tecnologias Utilizadas
- **Frontend**: Next.js 15, Tailwind CSS, ShadCN UI.
- **Backend**: Firebase Auth, Firestore.
- **IA**: Google Genkit com modelos Gemini.
