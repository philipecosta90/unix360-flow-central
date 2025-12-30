import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AnamneseEnvio, AnamneseResposta } from "@/hooks/useAnamnese";

interface RespostasPorSecao {
  [secao: string]: {
    icone: string | null | undefined;
    respostas: AnamneseResposta[];
  };
}

export const exportAnamneseToPDF = (
  envio: AnamneseEnvio,
  respostas: AnamneseResposta[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPosition = 20;

  // Função auxiliar para verificar e adicionar nova página
  const checkNewPage = (neededHeight: number) => {
    if (yPosition + neededHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Função para quebrar texto longo
  const splitText = (text: string, maxWidth: number): string[] => {
    return doc.splitTextToSize(text, maxWidth);
  };

  // Título
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Anamnese", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 10;

  // Dados do cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", marginLeft, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(envio.cliente?.nome || "N/A", marginLeft + 20, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "bold");
  doc.text("E-mail:", marginLeft, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(envio.cliente?.email || "N/A", marginLeft + 20, yPosition);
  yPosition += 7;

  if (envio.preenchido_em) {
    doc.setFont("helvetica", "bold");
    doc.text("Preenchido em:", marginLeft, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(
      format(new Date(envio.preenchido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      marginLeft + 35,
      yPosition
    );
    yPosition += 7;
  }

  yPosition += 5;
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 15;

  // Agrupar respostas por seção
  const respostasPorSecao = respostas.reduce((acc, resposta) => {
    const secao = resposta.pergunta?.secao || "Outros";
    if (!acc[secao]) {
      acc[secao] = {
        icone: resposta.pergunta?.secao_icone,
        respostas: [],
      };
    }
    acc[secao].respostas.push(resposta);
    return acc;
  }, {} as RespostasPorSecao);

  // Ordenar respostas por ordem
  Object.values(respostasPorSecao).forEach((data) => {
    data.respostas.sort((a, b) => (a.pergunta?.ordem || 0) - (b.pergunta?.ordem || 0));
  });

  // Renderizar seções
  Object.entries(respostasPorSecao).forEach(([secao, data]) => {
    checkNewPage(20);

    // Título da seção
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const secaoTitle = data.icone ? `${data.icone} ${secao}` : secao;
    doc.text(secaoTitle, marginLeft, yPosition);
    yPosition += 8;

    // Renderizar perguntas e respostas
    data.respostas.forEach((resposta) => {
      const perguntaText = resposta.pergunta?.pergunta || "";
      const respostaText = resposta.resposta || "Não respondido";

      // Pergunta
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      const perguntaLines = splitText(perguntaText, contentWidth);
      checkNewPage(perguntaLines.length * 5 + 15);
      doc.text(perguntaLines, marginLeft, yPosition);
      yPosition += perguntaLines.length * 5 + 2;

      // Resposta
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const respostaLines = splitText(respostaText, contentWidth);
      checkNewPage(respostaLines.length * 5 + 10);
      doc.text(respostaLines, marginLeft, yPosition);
      yPosition += respostaLines.length * 5 + 8;
    });

    yPosition += 5;
  });

  // Rodapé com data de geração
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Salvar o PDF
  const fileName = `anamnese_${envio.cliente?.nome?.replace(/\s+/g, "_") || "cliente"}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
