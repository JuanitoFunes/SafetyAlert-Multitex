// script.js completo e funcional
let incidents = JSON.parse(localStorage.getItem('incidents')) || [];
let statusChartInstance = null;
let currentDeleteIndex = null; // Índice do registro a ser excluído
const PASSWORD = "senha123"; // Senha fixa para exclusão (em um cenário real, use autenticação segura)

document.addEventListener('DOMContentLoaded', function () {
    init();
});

// Função para gerar o relatório em PDF
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "landscape", // Formato paisagem
        unit: "mm",
        format: "a4", // Formato A4
    });

    // Configurações gerais
    const margin = 10; // Margem do documento
    const pageWidth = doc.internal.pageSize.getWidth(); // Largura da página
    const pageHeight = doc.internal.pageSize.getHeight(); // Altura da página
    const lineHeight = 7; // Altura da linha
    let y = margin; // Posição vertical inicial

    // Função para adicionar cabeçalho
    function addHeader() {
        doc.setFontSize(18);
        doc.setTextColor(33, 33, 33); // Cor do texto: #333
        doc.setFont("helvetica", "bold");
        doc.text("Relatório de Ocorrências - SafeAlert Multitex", margin, y);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100); // Cor do texto: cinza
        doc.setFont("helvetica", "normal");
        doc.text(`Data de geração: ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: "right" });

        y += 10; // Espaçamento após o cabeçalho
    }

    // Função para adicionar rodapé
    function addFooter() {
        const footerY = pageHeight - margin; // Posição Y do rodapé
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Cor do texto: cinza
        doc.text(`Página ${doc.internal.getNumberOfPages()}`, margin, footerY);
        doc.text("SafeAlert Multitex", pageWidth - margin, footerY, { align: "right" });
    }

    // Adicionar cabeçalho na primeira página
    addHeader();

    // Adicionar gráfico ao PDF
    function addChart() {
        const chartCanvas = document.getElementById("status-chart");
        if (chartCanvas) {
            const chartImage = chartCanvas.toDataURL("image/png"); // Converte o gráfico em imagem
            doc.addImage(chartImage, "PNG", margin, y, pageWidth - 2 * margin, 80); // Adiciona a imagem ao PDF
            y += 90; // Espaçamento após o gráfico
        }
    }

    // Adicionar gráfico
    addChart();

    // Cabeçalho da tabela
    doc.setFontSize(12);
    doc.setTextColor(74, 144, 226); // Cor do texto: #4a90e2
    doc.setFont("helvetica", "bold");
    doc.text("Descrição", margin, y);
    doc.text("Local", 60, y);
    doc.text("Data", 110, y);
    doc.text("Hora", 140, y);
    doc.text("Tipo", 160, y);
    doc.text("Ações", 190, y);
    doc.text("Status", 240, y);

    y += lineHeight; // Espaçamento após o cabeçalho da tabela

    // Dados das ocorrências
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51); // Cor do texto: #333
    doc.setFont("helvetica", "normal");

    incidents.forEach((incident, index) => {
        // Verifica se precisa de uma nova página
        if (y > pageHeight - margin - 20) {
            doc.addPage(); // Adiciona uma nova página
            y = margin; // Reinicia a posição Y
            addHeader(); // Adiciona cabeçalho na nova página
        }

        // Descrição (com quebra de linha)
        const descriptionLines = doc.splitTextToSize(incident.description.substring(0, 100), 50); // Limita a descrição a 100 caracteres e quebra em linhas
        doc.text(descriptionLines, margin, y);

        // Local
        doc.text(incident.location, 60, y);

        // Data
        doc.text(incident.date, 110, y);

        // Hora
        doc.text(incident.time, 140, y);

        // Tipo
        doc.text(incident.type, 160, y);

        // Ações (com quebra de linha)
        const actionsLines = doc.splitTextToSize(incident.actions || 'Não informado', 30); // Limita as ações a 30 caracteres por linha
        doc.text(actionsLines, 190, y);

        // Status
        doc.text(incident.status, 240, y);

        // Linha divisória entre registros
        doc.setDrawColor(200, 200, 200); // Cor da linha: cinza claro
        doc.line(margin, y + 5, pageWidth - margin, y + 5); // Linha horizontal

        y += 20; // Incrementa a posição vertical para a próxima linha
    });

    // Adicionar rodapé em todas as páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter();
    }

    // Salvar o PDF
    doc.save("relatorio_ocorrencias.pdf");
}

// Função para exportar dados
function exportData() {
    const dataStr = JSON.stringify({ incidents });
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_incidents.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Backup exportado com sucesso!');
}

// Função para importar dados
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data && Array.isArray(data.incidents)) {
                        if (confirm(`Importar ${data.incidents.length} ocorrências? Os dados atuais serão substituídos.`)) {
                            incidents = data.incidents;
                            localStorage.setItem('incidents', JSON.stringify(incidents));
                            updateReports();
                            updateCharts();
                            alert('Dados importados com sucesso!');
                        }
                    } else {
                        alert('Formato de arquivo inválido.');
                    }
                } catch (error) {
                    alert('Erro ao processar o arquivo. Verifique se é um backup válido do SafeAlert.');
                    console.error(error);
                }
            };
            reader.readAsText(file);
        }
    });
    input.click();
}

// Função para abrir o modal de exclusão
function openDeleteModal(index) {
    currentDeleteIndex = index;
    document.getElementById('delete-modal').style.display = 'block';
}

// Função para fechar o modal de exclusão
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentDeleteIndex = null;
}

// Função para confirmar a exclusão
function confirmDelete() {
    const password = document.getElementById('delete-password').value;
    if (password === PASSWORD) {
        if (currentDeleteIndex !== null) {
            incidents.splice(currentDeleteIndex, 1); // Remove o registro
            localStorage.setItem('incidents', JSON.stringify(incidents));
            updateReports();
            updateCharts();
            alert('Registro excluído com sucesso!');
        }
        closeDeleteModal();
    } else {
        alert('Senha incorreta. Tente novamente.');
    }
}

// Função para atualizar relatórios
function updateReports() {
    const reportsList = document.getElementById('reports-list');
    if (!reportsList) return;
    reportsList.innerHTML = '';

    if (incidents.length === 0) {
        reportsList.innerHTML = '<p>Nenhuma ocorrência registrada.</p>';
        return;
    }

    incidents.forEach((incident, index) => {
        const div = document.createElement('div');
        div.classList.add('incident-item');
        div.innerHTML = `
            <h3>Ocorrência #${index + 1}</h3>
            <p><strong>Descrição:</strong> ${incident.description}</p>
            <p><strong>Local:</strong> ${incident.location}</p>
            <p><strong>Data:</strong> ${incident.date} - <strong>Hora:</strong> ${incident.time}</p>
            <p><strong>Tipo:</strong> ${incident.type}</p>
            <p><strong>Ações:</strong> ${incident.actions || 'Não informado'}</p>
            <p><strong>Status:</strong> ${incident.status}</p>
            <button onclick="updateStatus(${index}, 'pending')">Pendente</button>
            <button onclick="updateStatus(${index}, 'in-progress')">Em andamento</button>
            <button onclick="updateStatus(${index}, 'completed')">Concluído</button>
            <button onclick="openDeleteModal(${index})">Excluir</button>
        `;
        reportsList.appendChild(div);
    });
}

// Função para atualizar status da ocorrência
function updateStatus(index, newStatus) {
    incidents[index].status = newStatus;
    localStorage.setItem('incidents', JSON.stringify(incidents));
    updateReports();
    updateCharts();
}

// Função para atualizar gráficos
function updateCharts() {
    const ctxStatus = document.getElementById('status-chart');
    if (!ctxStatus) return;

    const statusCounts = incidents.reduce((acc, incident) => {
        acc[incident.status] = (acc[incident.status] || 0) + 1;
        return acc;
    }, {});

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    // Cores personalizadas para o gráfico
    const backgroundColors = [
        'rgba(255, 99, 132, 0.6)', // Vermelho
        'rgba(54, 162, 235, 0.6)', // Azul
        'rgba(75, 192, 192, 0.6)', // Verde
        'rgba(255, 206, 86, 0.6)', // Amarelo
        'rgba(153, 102, 255, 0.6)', // Roxo
        'rgba(255, 159, 64, 0.6)', // Laranja
    ];

    statusChartInstance = new Chart(ctxStatus.getContext('2d'), {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Status das Ocorrências',
                data: Object.values(statusCounts),
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                        },
                        color: '#333',
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            let total = Object.values(statusCounts).reduce((sum, val) => sum + val, 0);
                            let value = tooltipItem.raw;
                            let percentage = ((value / total) * 100).toFixed(2) + '%';
                            return `${tooltipItem.label}: ${value} (${percentage})`;
                        }
                    },
                    bodyFont: {
                        size: 14,
                    },
                    titleFont: {
                        size: 16,
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad',
            }
        }
    });
}

// Função para enviar e-mail de alerta
async function sendEmailAlert(incident) {
    try {
        const response = await fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incident),
        });

        if (response.ok) {
            console.log('E-mail de alerta enviado com sucesso!');
        } else {
            console.error('Erro ao enviar e-mail de alerta:', response.statusText);
        }
    } catch (error) {
        console.error('Erro ao enviar e-mail de alerta:', error);
    }
}

// Função para adicionar um novo incidente
function addIncident(description, location, date, time, type, actions) {
    const newIncident = {
        description,
        location,
        date,
        time,
        type,
        actions,
        status: 'pending' // Status inicial
    };
    incidents.push(newIncident);
    localStorage.setItem('incidents', JSON.stringify(incidents));
    updateReports();
    updateCharts();

    // Enviar e-mail de alerta
    sendEmailAlert(newIncident);
}

// Inicialização do sistema
function init() {
    updateReports();
    updateCharts();

    document.getElementById('export-data')?.addEventListener('click', exportData);
    document.getElementById('import-data')?.addEventListener('click', importData);
    document.getElementById('clear-data')?.addEventListener('click', function () {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            incidents = [];
            localStorage.removeItem('incidents');
            updateReports();
            updateCharts();
            alert('Todos os dados foram removidos.');
        }
    });
    async function sendEmailAlert(incident) {
        try {
            const response = await fetch('http://localhost:3000/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(incident),
            });
    
            if (response.ok) {
                console.log('✅ E-mail de alerta enviado com sucesso!');
            } else {
                console.error('❌ Erro ao enviar e-mail de alerta:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail de alerta:', error);
        }
    }
    

    // Adicionar evento de submissão do formulário
    const form = document.getElementById('incident-form');
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const description = document.getElementById('incident-description').value;
            const location = document.getElementById('incident-location').value;
            const date = document.getElementById('incident-date').value;
            const time = document.getElementById('incident-time').value;
            const type = document.getElementById('incident-type').value;
            const actions = document.getElementById('actions-taken').value;

            addIncident(description, location, date, time, type, actions);

            // Limpar o formulário após a submissão
            form.reset();
        });
    }
}