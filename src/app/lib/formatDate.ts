/**
 * Formata uma data para exibição (dd/mm/aaaa) ou para o input (aaaa-mm-dd).
 * @param dateString A data como string (ISO ou aaaa-mm-dd) ou objeto Date.
 * @param format 'display' para dd/mm/aaaa ou 'input' para aaaa-mm-dd.
 * @returns A data formatada ou uma string vazia se a data for inválida.
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  format: 'display' | 'input'
): string {
  if (!dateString) {
    return ''
  }

  // Adiciona um horário para evitar problemas de fuso horário que podem mudar o dia.
  const date = new Date(dateString.toString().replace(/-/g, '/').replace(/T.*/, ''))

  if (isNaN(date.getTime())) {
    return ''
  }

  if (format === 'display') {
    return date.toLocaleDateString('pt-BR')
  }

  return date.toISOString().split('T')[0]
}