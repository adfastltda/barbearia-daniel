const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3033;

app.use(bodyParser.json());

const horariosDisponiveis = [
  "08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "12:30", "13:15",
  "14:00", "14:45", "15:30", "16:15", "17:00", "17:45"
];

let agendamentos = [];

// Função para carregar os agendamentos do arquivo JSON
const carregarAgendamentos = () => {
  try {
    const data = fs.readFileSync('agendamentos.json');
    agendamentos = JSON.parse(data);
  } catch (err) {
    agendamentos = [];
  }
};

// Função para salvar os agendamentos no arquivo JSON
const salvarAgendamentos = () => {
  fs.writeFileSync('agendamentos.json', JSON.stringify(agendamentos, null, 2));
};

// Carrega os agendamentos ao iniciar o servidor
carregarAgendamentos();

// Função para capturar o horário atual
const obterHorarioAtual = () => {
  const now = new Date();
  const horas = now.getHours().toString().padStart(2, '0');
  const minutos = now.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
};

// Função para calcular o próximo dia útil, evitando o domingo
const obterDataMaximaAgendamento = () => {
  const hoje = new Date();
  const dataMaxima = new Date(hoje);
  let diasAdicionados = 0;
  
  while (diasAdicionados < 3) {
    dataMaxima.setDate(dataMaxima.getDate() + 1); // Avança um dia
    if (dataMaxima.getDay() !== 0) { // Exclui o domingo (0 = domingo)
      diasAdicionados++;
    }
  }
  
  return dataMaxima;
};

// Função para formatar data no formato YYYY-MM-DD
const formatarData = (data) => {
  const ano = data.getFullYear();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const dia = data.getDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

// Rota para consultar horários disponíveis e agendamentos realizados
app.get('/disponibilidade', (req, res) => {
  const horarioAtual = obterHorarioAtual();
  const dataMaxima = obterDataMaximaAgendamento();
  const dataMaximaFormatada = formatarData(dataMaxima);

  // Filtra os horários disponíveis, levando em consideração os agendamentos já realizados
  const horariosLivres = horariosDisponiveis.filter(horario => {
    return !agendamentos.some(agendamento => agendamento.horario === horario && agendamento.data === dataMaximaFormatada) && horario >= horarioAtual;
  });

  // Agrupa os agendamentos por data
  const agendamentosAgrupadosPorData = agendamentos.reduce((acc, agendamento) => {
    const data = agendamento.data;
    if (!acc[data]) {
      acc[data] = {
        horariosDisponiveis: [...horariosDisponiveis], // Copia todos os horários inicialmente
        agendamentos: []
      };
    }
    // Remove o horário já agendado da lista de horários disponíveis
    const index = acc[data].horariosDisponiveis.indexOf(agendamento.horario);
    if (index > -1) {
      acc[data].horariosDisponiveis.splice(index, 1);
    }
    acc[data].agendamentos.push(agendamento);
    return acc;
  }, {});

  res.json({
    dataMaximaAgendamento: dataMaximaFormatada,
    agendamentosPorData: agendamentosAgrupadosPorData
  });
});

// Rota para agendar um horário
app.post('/agendar', (req, res) => {
  const { horario, nomeCliente, numeroCliente, servico, data } = req.body;

  if (!horario || !nomeCliente || !numeroCliente || !servico || !data) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
  }

  const horarioAtual = obterHorarioAtual();
  const dataMaxima = obterDataMaximaAgendamento();
  const dataMaximaFormatada = formatarData(dataMaxima);
  
  // Verifica se a data informada está dentro do limite de 3 dias úteis
  if (data > dataMaximaFormatada) {
    return res.status(400).json({ erro: `Agendamento pode ser feito apenas até ${dataMaximaFormatada}.` });
  }

  if (data < formatarData(new Date())) {
    return res.status(400).json({ erro: "Não é possível agendar para uma data no passado." });
  }

  if (!horariosDisponiveis.includes(horario)) {
    return res.status(400).json({ erro: "Horário inválido." });
  }

  if (agendamentos.some(agendamento => agendamento.horario === horario && agendamento.data === data)) {
    return res.status(400).json({ erro: "Este horário já foi agendado." });
  }

  // Adiciona o agendamento com nome, número, horário, serviço e data
  agendamentos.push({ nomeCliente, numeroCliente, servico, horario, data });
  salvarAgendamentos(); // Salva os agendamentos no arquivo JSON
  res.status(200).json({
    mensagem: `Agendamento confirmado para ${nomeCliente} no dia ${data} às ${horario}. Serviço: ${servico}`
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
